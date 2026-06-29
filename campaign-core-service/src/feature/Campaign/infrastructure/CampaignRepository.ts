import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { randomUUID } from 'node:crypto';
import { databaseAdapterConfig } from '../../../shared/config';
import { relativeTimeEs } from '../../../shared/time/relativeTime';
import { EditCampaignFields, ICampaignRepository } from '../domain/ICampaignRepository';
import {
	CampaignDetailDTO,
	CampaignSummaryDTO,
	CampaignUpdateDTO,
	CommentDTO,
	CreateCampaignData,
	CreatorDTO,
	InteractionResultDTO,
	InteractionType,
} from '../application/dtos';

// Include reutilizable para armar el resumen (creator + categorias + media + conteo).
const summaryInclude = Prisma.validator<Prisma.CampaignDefaultArgs>()({
	include: {
		creator: { include: { profile: { include: { institution: true } }, verification: true } },
		categories: { include: { category: true } },
		media: true,
		_count: { select: { donations: true } },
	},
});
type CampaignSummaryRow = Prisma.CampaignGetPayload<typeof summaryInclude>;

const dec = (value: Prisma.Decimal | null | undefined): number =>
	value ? Number(value) : 0;

// campaign_update no tiene columna de imagen; guardamos la URL de la foto al
// final del mensaje con un marcador y la separamos al leer.
const IMG_MARK = /\n*\[\[img:(.*?)\]\]\s*$/;
const encodeUpdateMessage = (message: string, imageUrl: string | null): string =>
	imageUrl ? `${message}\n[[img:${imageUrl}]]` : message;
const decodeUpdateMessage = (stored: string): { message: string; imageUrl: string | null } => {
	const m = stored.match(IMG_MARK);
	if (!m) return { message: stored, imageUrl: null };
	return { message: stored.replace(IMG_MARK, '').trim(), imageUrl: m[1] };
};

export class CampaignRepository implements ICampaignRepository {
	private readonly prisma: PrismaClient;

	constructor(prismaClient?: PrismaClient) {
		if (prismaClient) {
			this.prisma = prismaClient;
			return;
		}
		const adapter = new PrismaMariaDb(databaseAdapterConfig());
		this.prisma = new PrismaClient({ adapter });
	}

	async create(data: CreateCampaignData): Promise<CampaignDetailDTO> {
		const now = new Date();

		// 1. Resuelve (o crea) las categorias FUERA de la transaccion. Son lookups
		// compartidos y mantenerlos dentro alargaba la transaccion lo suficiente
		// como para agotar el tiempo de adquisicion en un RDS remoto.
		const categoryIds = await this.resolveCategoryIds(data.categories);

		// 2. Transaccion corta (solo inserciones rapidas) con tiempos holgados para
		// tolerar la latencia de red hacia el RDS.
		const operations: Prisma.PrismaPromise<unknown>[] = [
			this.prisma.campaign.create({
				data: {
					id: data.id,
					creatorId: data.creatorId,
					title: data.title,
					description: data.description,
					goalAmount: data.goalAmount,
					currentAmount: 0,
					status: data.status,
					endDate: data.endDate,
					createdAt: now,
					updated_at: now,
				},
			}),
			this.prisma.campaignCategory.createMany({
				data: categoryIds.map((categoryId) => ({ campaignId: data.id, categoryId })),
			}),
		];

		if (data.media) {
			operations.push(
				this.prisma.campaignMedia.create({
					data: {
						id: randomUUID(),
						campaignId: data.id,
						typeMedia: data.media.type,
						mediaUrl: data.media.url,
						order_index: 0,
					},
				}),
			);
		}

		await this.prisma.$transaction(operations, { timeout: 20000 });

		const detail = await this.getDetail(data.id);
		if (!detail) {
			throw new Error('No se pudo recuperar la campaña recien creada.');
		}
		return detail;
	}

	async listSummaries(): Promise<CampaignSummaryDTO[]> {
		const rows = await this.prisma.campaign.findMany({
			...summaryInclude,
			orderBy: { createdAt: 'desc' },
		});
		return rows.map((row) => this.toSummary(row));
	}

	async getDetail(id: string, viewerId?: string | null): Promise<CampaignDetailDTO | null> {
		const row = await this.prisma.campaign.findUnique({
			where: { id },
			include: {
				creator: {
					include: { profile: { include: { institution: true } }, verification: true },
				},
				categories: { include: { category: true } },
				media: { orderBy: { order_index: 'asc' } },
				_count: { select: { donations: true } },
				campaign_update: { orderBy: { created_at: 'desc' } },
				comments: {
					include: { account: { include: { profile: true } } },
					orderBy: { createdAt: 'desc' },
				},
				donations: {
					include: { donor: { include: { profile: true } } },
					orderBy: { created_at: 'desc' },
					take: 8,
				},
			},
		});

		if (!row) return null;

		const [likes, shares, bookmarks, follows, interests, mine] = await Promise.all([
			this.prisma.campaign_interaction.count({ where: { id_campaign: id, type: 'LIKE' } }),
			this.prisma.campaign_interaction.count({ where: { id_campaign: id, type: 'SHARE' } }),
			this.prisma.campaign_interaction.count({ where: { id_campaign: id, type: 'BOOKMARK' } }),
			this.prisma.campaign_interaction.count({ where: { id_campaign: id, type: 'FOLLOW' } }),
			this.prisma.campaign_interaction.count({ where: { id_campaign: id, type: 'INTEREST' } }),
			viewerId
				? this.prisma.campaign_interaction.findMany({
						where: { id_campaign: id, id_account: viewerId },
						select: { type: true },
					})
				: Promise.resolve([] as { type: string }[]),
		]);

		const summary = this.toSummary(row);

		return {
			...summary,
			likes,
			shares,
			bookmarks,
			follows,
			interests,
			myInteractions: [...new Set(mine.map((m) => m.type))],
			media: row.media.map((m) => ({ type: m.typeMedia, url: m.mediaUrl })),
			updates: row.campaign_update.map((u) => {
				const decoded = decodeUpdateMessage(u.message);
				return {
					id: u.id_update_campaign,
					title: u.title,
					message: decoded.message,
					imageUrl: decoded.imageUrl,
					createdAt: u.created_at.toISOString(),
				};
			}),
			comments: row.comments.map((c) => ({
				id: c.id,
				author: this.personName(c.account?.profile?.[0]) ?? 'Usuario',
				content: c.content,
				parentId: c.parentId ?? null,
				createdAt: c.createdAt.toISOString(),
			})),
			recentDonations: row.donations.map((d) => ({
				donor: d.isAnonymous
					? 'Anonimo'
					: this.personName(d.donor?.profile?.[0]) ?? 'Usuario',
				amount: dec(d.amount),
				donatedAt: d.created_at.toISOString(),
				timeAgo: relativeTimeEs(d.created_at),
			})),
		};
	}

	async getOwnerId(id: string): Promise<string | null> {
		const row = await this.prisma.campaign.findUnique({
			where: { id },
			select: { creatorId: true },
		});
		if (!row) return null;
		return row.creatorId ?? '';
	}

	async update(id: string, fields: EditCampaignFields): Promise<CampaignDetailDTO> {
		await this.prisma.campaign.update({
			where: { id },
			data: {
				...(fields.title !== undefined && { title: fields.title }),
				...(fields.description !== undefined && { description: fields.description }),
				...(fields.goalAmount !== undefined && { goalAmount: fields.goalAmount }),
				...(fields.endDate !== undefined && { endDate: fields.endDate }),
				...(fields.status !== undefined && { status: fields.status }),
				updated_at: new Date(),
			},
		});
		const detail = await this.getDetail(id);
		if (!detail) throw new Error('No se pudo recuperar la campaña actualizada.');
		return detail;
	}

	async addUpdate(
		campaignId: string,
		title: string | null,
		message: string,
		imageUrl: string | null,
	): Promise<CampaignUpdateDTO> {
		const now = new Date();
		const row = await this.prisma.campaign_update.create({
			data: {
				id_update_campaign: randomUUID(),
				id_campaign: campaignId,
				title,
				message: encodeUpdateMessage(message, imageUrl),
				created_at: now,
			},
		});
		const decoded = decodeUpdateMessage(row.message);
		return {
			id: row.id_update_campaign,
			title: row.title,
			message: decoded.message,
			imageUrl: decoded.imageUrl,
			createdAt: row.created_at.toISOString(),
		};
	}

	async addComment(
		campaignId: string,
		accountId: string,
		content: string,
		parentId: string | null,
	): Promise<CommentDTO> {
		const now = new Date();
		const row = await this.prisma.commentCampaign.create({
			data: {
				id: randomUUID(),
				campaignId,
				accountId,
				content,
				parentId,
				createdAt: now,
			},
			include: { account: { include: { profile: true } } },
		});
		return {
			id: row.id,
			author: this.personName(row.account?.profile?.[0]) ?? 'Usuario',
			content: row.content,
			parentId: row.parentId ?? null,
			createdAt: row.createdAt.toISOString(),
		};
	}

	async toggleInteraction(
		campaignId: string,
		accountId: string,
		type: InteractionType,
	): Promise<InteractionResultDTO> {
		let active = true;

		if (type === 'SHARE') {
			// SHARE es un evento (no toggle): se registra siempre.
			await this.prisma.campaign_interaction.create({
				data: {
					id_interaction: randomUUID(),
					id_account: accountId,
					id_campaign: campaignId,
					type: 'SHARE',
					created_at: new Date(),
				},
			});
		} else {
			// LIKE/BOOKMARK/FOLLOW/INTEREST: toggle (activar/desactivar).
			const existing = await this.prisma.campaign_interaction.findFirst({
				where: { id_campaign: campaignId, id_account: accountId, type },
			});
			if (existing) {
				await this.prisma.campaign_interaction.delete({
					where: { id_interaction: existing.id_interaction },
				});
				active = false;
			} else {
				await this.prisma.campaign_interaction.create({
					data: {
						id_interaction: randomUUID(),
						id_account: accountId,
						id_campaign: campaignId,
						type,
						created_at: new Date(),
					},
				});
			}
		}

		const [likes, shares] = await Promise.all([
			this.prisma.campaign_interaction.count({ where: { id_campaign: campaignId, type: 'LIKE' } }),
			this.prisma.campaign_interaction.count({ where: { id_campaign: campaignId, type: 'SHARE' } }),
		]);

		return { type, active, likes, shares };
	}

	async listSummariesByInteraction(
		accountId: string,
		type: string,
	): Promise<CampaignSummaryDTO[]> {
		const interactions = await this.prisma.campaign_interaction.findMany({
			where: { id_account: accountId, type },
			orderBy: { created_at: 'desc' },
			select: { id_campaign: true },
		});
		const ids = interactions
			.map((i) => i.id_campaign)
			.filter((id): id is string => !!id);
		if (ids.length === 0) return [];

		const rows = await this.prisma.campaign.findMany({
			where: { id: { in: ids } },
			...summaryInclude,
		});
		return rows.map((row) => this.toSummary(row));
	}

	// Resuelve los ids de categoria por nombre, creando las que falten. Se ejecuta
	// fuera de cualquier transaccion (lookups idempotentes).
	private async resolveCategoryIds(names: string[]): Promise<string[]> {
		const ids: string[] = [];
		for (const name of names) {
			let category = await this.prisma.category.findFirst({ where: { name } });
			if (!category) {
				category = await this.prisma.category.create({ data: { id: randomUUID(), name } });
			}
			ids.push(category.id);
		}
		return ids;
	}

	// --- helpers de mapeo ---

	private toSummary(row: CampaignSummaryRow): CampaignSummaryDTO {
		const cover = row.media[0]
			? { type: row.media[0].typeMedia, url: row.media[0].mediaUrl }
			: null;

		return {
			id: row.id,
			title: row.title,
			description: row.description,
			goalAmount: dec(row.goalAmount),
			currentAmount: dec(row.currentAmount),
			status: row.status,
			endDate: row.endDate.toISOString(),
			createdAt: row.createdAt.toISOString(),
			cover,
			categories: row.categories.map((c) => c.category.name),
			creator: this.toCreator(row),
			donorsCount: row._count.donations,
			likes: 0, // El detalle los sobrescribe con el conteo real.
			shares: 0,
		};
	}

	private toCreator(row: CampaignSummaryRow): CreatorDTO {
		const profile = row.creator?.profile?.[0];
		const verifications = row.creator?.verification ?? [];
		const verified = verifications.some((v) => v.status === 'APPROVED');

		// Universidad y escuela (carrera) se guardaron en verification.extracted_data
		// durante el registro del creador (extraidos del reporte de matricula).
		const withData = verifications
			.filter((v) => v.extracted_data)
			.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
		const data = (withData?.extracted_data ?? {}) as Record<string, unknown>;
		const universityFromData = typeof data.university === 'string' ? data.university : null;
		const career = typeof data.school === 'string' ? data.school : null;

		return {
			id: row.creator?.id ?? null,
			name: this.personName(profile) ?? 'Usuario',
			university: profile?.institution?.name ?? universityFromData,
			career,
			verified,
		};
	}

	private personName(profile?: { names: string; surnames: string } | null): string | null {
		if (!profile) return null;
		const full = `${profile.names ?? ''} ${profile.surnames ?? ''}`.trim();
		return full.length > 0 ? full : null;
	}
}
