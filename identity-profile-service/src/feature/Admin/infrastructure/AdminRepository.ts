import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { randomUUID } from 'node:crypto';
import { databaseAdapterConfig } from '../../../shared/config';
import { ConflictError, NotFoundError } from '../../../shared/errors';
import {
	AdminCampaignDetailDTO,
	AdminCampaignListItemDTO,
	AdminPendingDonationDTO,
	AdminUserDetailDTO,
	AdminUserListItemDTO,
	CreateUserData,
	ListCampaignsQuery,
	ListUsersQuery,
	UpdateCampaignData,
} from '../application/dtos';

const dec = (v: unknown): number => (v == null ? 0 : Number(v));

// Repositorio del panel de administracion. Consulta directamente la BD (misma
// RDS compartida) via Prisma: cuentas, roles, perfiles, campañas y donaciones.
export class AdminRepository {
	private readonly prisma: PrismaClient;

	constructor(prismaClient?: PrismaClient) {
		if (prismaClient) {
			this.prisma = prismaClient;
			return;
		}
		const adapter = new PrismaMariaDb(databaseAdapterConfig());
		this.prisma = new PrismaClient({ adapter });
	}

	private roleOf(account: { account_roles: { roles: { name: string | null } }[] }): string {
		return account.account_roles[0]?.roles.name ?? 'DONOR';
	}

	async listUsers(query: ListUsersQuery): Promise<AdminUserListItemDTO[]> {
		const where: Record<string, unknown> = {};
		if (query.search) {
			where.email = { contains: query.search };
		}
		if (query.type) {
			where.account_roles = { some: { roles: { name: query.type } } };
		}

		const accounts = await this.prisma.account.findMany({
			where,
			orderBy: { createdAt: query.sort === 'oldest' ? 'asc' : 'desc' },
			include: {
				account_roles: { include: { roles: true } },
				profile: true,
			},
			take: 500,
		});

		return accounts.map((a) => {
			const profile = a.profile[0];
			return {
				id: a.id,
				email: a.email,
				names: profile?.names ?? '',
				surnames: profile?.surnames ?? '',
				role: this.roleOf(a),
				createdAt: a.createdAt.toISOString(),
				lastLoginAt: a.last_login_at ? a.last_login_at.toISOString() : null,
			};
		});
	}

	async getUserDetail(id: string): Promise<AdminUserDetailDTO> {
		const account = await this.prisma.account.findUnique({
			where: { id },
			include: {
				account_roles: { include: { roles: true } },
				profile: true,
				createdCampaigns: {
					orderBy: { createdAt: 'desc' },
					select: {
						id: true,
						title: true,
						status: true,
						goalAmount: true,
						currentAmount: true,
						createdAt: true,
					},
				},
				donations: {
					orderBy: { created_at: 'desc' },
					include: {
						campaign: { select: { title: true } },
						payments: { orderBy: { createdAt: 'desc' }, take: 1 },
					},
				},
			},
		});

		if (!account) {
			throw new NotFoundError('El usuario no existe.');
		}

		const profile = account.profile[0];
		return {
			id: account.id,
			email: account.email,
			names: profile?.names ?? '',
			surnames: profile?.surnames ?? '',
			role: this.roleOf(account),
			createdAt: account.createdAt.toISOString(),
			lastLoginAt: account.last_login_at ? account.last_login_at.toISOString() : null,
			campaigns: account.createdCampaigns.map((c) => ({
				id: c.id,
				title: c.title,
				status: c.status,
				goalAmount: dec(c.goalAmount),
				currentAmount: dec(c.currentAmount),
				createdAt: c.createdAt.toISOString(),
			})),
			donations: account.donations.map((d) => ({
				id: d.id,
				amount: dec(d.amount),
				campaignTitle: d.campaign?.title ?? null,
				status: d.payments[0]?.status ?? 'PENDING',
				isAnonymous: !!d.isAnonymous,
				createdAt: d.created_at.toISOString(),
			})),
		};
	}

	async createUser(input: CreateUserData): Promise<AdminUserListItemDTO> {
		// Verifica correo unico para devolver 409 en vez de un error de Prisma.
		const existing = await this.prisma.account.findUnique({ where: { email: input.email } });
		if (existing) {
			throw new ConflictError('Ya existe una cuenta con ese correo.');
		}

		const account = await this.prisma.$transaction(async (tx) => {
			const role = await tx.roles.findUnique({ where: { name: input.role } });
			if (!role) {
				throw new ConflictError(`El rol "${input.role}" no existe en la base de datos.`);
			}
			const now = new Date();
			return tx.account.create({
				data: {
					id: randomUUID(),
					email: input.email,
					password: input.passwordHash,
					provider: 'LOCAL',
					emailVerified: false,
					createdAt: now,
					account_roles: { create: { id_role: role.id_role, created_at: now } },
					profile: {
						create: {
							id: randomUUID(),
							names: input.names ?? '',
							surnames: input.surnames ?? '',
							updated_at: now,
						},
					},
				},
				include: { account_roles: { include: { roles: true } }, profile: true },
			});
		});

		const profile = account.profile[0];
		return {
			id: account.id,
			email: account.email,
			names: profile?.names ?? '',
			surnames: profile?.surnames ?? '',
			role: this.roleOf(account),
			createdAt: account.createdAt.toISOString(),
			lastLoginAt: null,
		};
	}

	async updateUser(
		id: string,
		input: { email?: string; names?: string; surnames?: string; role?: string },
	): Promise<AdminUserListItemDTO> {
		const account = await this.prisma.account.findUnique({ where: { id } });
		if (!account) {
			throw new NotFoundError('El usuario no existe.');
		}

		// Si cambia el correo, verifica que no este tomado por otra cuenta.
		if (input.email && input.email !== account.email) {
			const taken = await this.prisma.account.findUnique({ where: { email: input.email } });
			if (taken) {
				throw new ConflictError('Ya existe una cuenta con ese correo.');
			}
		}

		const updated = await this.prisma.$transaction(async (tx) => {
			if (input.email !== undefined) {
				await tx.account.update({ where: { id }, data: { email: input.email } });
			}

			if (input.names !== undefined || input.surnames !== undefined) {
				const profile = await tx.profile.findFirst({ where: { accountId: id } });
				if (profile) {
					await tx.profile.update({
						where: { id: profile.id },
						data: {
							names: input.names ?? undefined,
							surnames: input.surnames ?? undefined,
							updated_at: new Date(),
						},
					});
				}
			}

			if (input.role) {
				const role = await tx.roles.findUnique({ where: { name: input.role } });
				if (!role) {
					throw new ConflictError(`El rol "${input.role}" no existe.`);
				}
				await tx.account_roles.deleteMany({ where: { id_account: id } });
				await tx.account_roles.create({
					data: { id_account: id, id_role: role.id_role, created_at: new Date() },
				});
			}

			return tx.account.findUniqueOrThrow({
				where: { id },
				include: { account_roles: { include: { roles: true } }, profile: true },
			});
		});

		const profile = updated.profile[0];
		return {
			id: updated.id,
			email: updated.email,
			names: profile?.names ?? '',
			surnames: profile?.surnames ?? '',
			role: this.roleOf(updated),
			createdAt: updated.createdAt.toISOString(),
			lastLoginAt: updated.last_login_at ? updated.last_login_at.toISOString() : null,
		};
	}

	async deleteUser(id: string): Promise<void> {
		const account = await this.prisma.account.findUnique({ where: { id } });
		if (!account) {
			throw new NotFoundError('El usuario no existe.');
		}

		await this.prisma.$transaction(
			async (tx) => {
				// Desactiva la verificacion de FKs durante el borrado en cascada manual,
				// para no fallar por el orden de las dependencias. La variable es de
				// sesion y la transaccion usa una unica conexion.
				await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');

				// Campañas creadas por el usuario y todo lo que cuelga de ellas.
				const camps = await tx.campaign.findMany({
					where: { creatorId: id },
					select: { id: true },
				});
				const campIds = camps.map((c) => c.id);
				if (campIds.length) {
					await tx.payment.deleteMany({ where: { donation: { campaignId: { in: campIds } } } });
					await tx.donation.deleteMany({ where: { campaignId: { in: campIds } } });
					await tx.campaignCategory.deleteMany({ where: { campaignId: { in: campIds } } });
					await tx.campaignMedia.deleteMany({ where: { campaignId: { in: campIds } } });
					await tx.commentCampaign.deleteMany({ where: { campaignId: { in: campIds } } });
					await tx.campaign_interaction.deleteMany({ where: { id_campaign: { in: campIds } } });
					await tx.campaign_update.deleteMany({ where: { id_campaign: { in: campIds } } });
					await tx.campaign_metrics.deleteMany({ where: { id_campaign: { in: campIds } } });
					await tx.campaign.deleteMany({ where: { id: { in: campIds } } });
				}

				// Donaciones hechas por el usuario (como donante) y sus pagos.
				const dons = await tx.donation.findMany({
					where: { donorId: id },
					select: { id: true },
				});
				const donIds = dons.map((d) => d.id);
				if (donIds.length) {
					await tx.payment.deleteMany({ where: { donationId: { in: donIds } } });
					await tx.donation.deleteMany({ where: { donorId: id } });
				}

				// Dependencias a nivel de cuenta.
				await tx.campaign_interaction.deleteMany({ where: { id_account: id } });
				await tx.commentCampaign.deleteMany({ where: { accountId: id } });
				await tx.verification.deleteMany({ where: { id_account: id } });
				await tx.notification.deleteMany({ where: { id_account: id } });
				await tx.notification_config.deleteMany({ where: { id_account: id } });
				await tx.user_recommendation.deleteMany({ where: { id_account: id } });

				const profiles = await tx.profile.findMany({
					where: { accountId: id },
					select: { id: true },
				});
				const profIds = profiles.map((p) => p.id);
				if (profIds.length) {
					await tx.social_network.deleteMany({ where: { id_profile: { in: profIds } } });
				}
				await tx.profile.deleteMany({ where: { accountId: id } });
				await tx.account_roles.deleteMany({ where: { id_account: id } });
				await tx.account.delete({ where: { id } });

				await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
			},
			{ timeout: 30000 },
		);
	}

	// ---------- Proyectos (campañas) ----------
	private creatorName(creator: { profile: { names: string; surnames: string }[] } | null): string {
		const p = creator?.profile?.[0];
		if (!p) return 'Usuario';
		return `${p.names ?? ''} ${p.surnames ?? ''}`.trim() || 'Usuario';
	}

	async listCampaigns(query: ListCampaignsQuery): Promise<AdminCampaignListItemDTO[]> {
		const where: Record<string, unknown> = {};
		if (query.search) where.title = { contains: query.search };
		if (query.status) where.status = query.status;

		const rows = await this.prisma.campaign.findMany({
			where,
			orderBy: { createdAt: query.sort === 'oldest' ? 'asc' : 'desc' },
			include: {
				creator: { include: { profile: true } },
				categories: { include: { category: true } },
				_count: { select: { donations: true } },
			},
			take: 500,
		});

		return rows.map((c) => ({
			id: c.id,
			title: c.title,
			status: c.status,
			goalAmount: dec(c.goalAmount),
			currentAmount: dec(c.currentAmount),
			categories: c.categories.map((cc) => cc.category.name),
			creatorId: c.creatorId,
			creatorName: this.creatorName(c.creator),
			creatorEmail: c.creator?.email ?? null,
			donorsCount: c._count.donations,
			createdAt: c.createdAt.toISOString(),
			endDate: c.endDate.toISOString(),
		}));
	}

	async getCampaignDetail(id: string): Promise<AdminCampaignDetailDTO> {
		const c = await this.prisma.campaign.findUnique({
			where: { id },
			include: {
				creator: { include: { profile: true } },
				categories: { include: { category: true } },
				_count: { select: { donations: true } },
				donations: {
					orderBy: { created_at: 'desc' },
					include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
				},
			},
		});
		if (!c) {
			throw new NotFoundError('La campaña no existe.');
		}

		return {
			id: c.id,
			title: c.title,
			description: c.description,
			status: c.status,
			goalAmount: dec(c.goalAmount),
			currentAmount: dec(c.currentAmount),
			categories: c.categories.map((cc) => cc.category.name),
			creatorId: c.creatorId,
			creatorName: this.creatorName(c.creator),
			creatorEmail: c.creator?.email ?? null,
			donorsCount: c._count.donations,
			createdAt: c.createdAt.toISOString(),
			endDate: c.endDate.toISOString(),
			donations: c.donations.map((d) => ({
				id: d.id,
				amount: dec(d.amount),
				campaignTitle: c.title,
				status: d.payments[0]?.status ?? 'PENDING',
				isAnonymous: !!d.isAnonymous,
				createdAt: d.created_at.toISOString(),
			})),
		};
	}

	async updateCampaign(id: string, input: UpdateCampaignData): Promise<AdminCampaignListItemDTO> {
		const existing = await this.prisma.campaign.findUnique({ where: { id } });
		if (!existing) {
			throw new NotFoundError('La campaña no existe.');
		}
		await this.prisma.campaign.update({
			where: { id },
			data: {
				title: input.title ?? undefined,
				description: input.description ?? undefined,
				status: input.status ?? undefined,
				goalAmount: input.goalAmount ?? undefined,
				updated_at: new Date(),
			},
		});
		const list = await this.listCampaigns({});
		return list.find((c) => c.id === id) ?? (await this.getCampaignDetail(id));
	}

	// ---------- Donaciones pendientes (confirmacion por admin) ----------
	async listPendingDonations(): Promise<AdminPendingDonationDTO[]> {
		const payments = await this.prisma.payment.findMany({
			where: { status: 'PENDING' },
			include: {
				donation: {
					include: {
						campaign: { include: { creator: { include: { profile: true } } } },
						donor: { include: { profile: true } },
					},
				},
			},
			orderBy: { createdAt: 'desc' },
			take: 300,
		});

		return payments
			.filter((p) => p.donation)
			.map((p) => {
				const d = p.donation!;
				const donorProf = d.donor?.profile?.[0];
				const creatorProf = d.campaign?.creator?.profile?.[0];
				const donorName = d.isAnonymous
					? 'Anónimo'
					: `${donorProf?.names ?? ''} ${donorProf?.surnames ?? ''}`.trim() || 'Donante';
				const creatorName =
					`${creatorProf?.names ?? ''} ${creatorProf?.surnames ?? ''}`.trim() || 'Usuario';
				return {
					donationId: d.id,
					campaignId: d.campaignId ?? '',
					campaignTitle: d.campaign?.title ?? '',
					creatorName,
					donorName,
					amount: dec(d.amount),
					paymentMethod: p.paymentMethod,
					isAnonymous: !!d.isAnonymous,
					message: d.message ?? null,
					createdAt: d.created_at.toISOString(),
				};
			});
	}

	async confirmDonation(donationId: string): Promise<void> {
		const payment = await this.prisma.payment.findFirst({
			where: { donationId },
			include: { donation: true },
			orderBy: { createdAt: 'desc' },
		});
		if (!payment || !payment.donation) {
			throw new NotFoundError('No existe la donación indicada.');
		}
		if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
			return; // idempotente
		}
		const campaignId = payment.donation.campaignId;
		const amount = dec(payment.donation.amount);
		await this.prisma.$transaction(async (tx) => {
			await tx.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED' } });
			if (campaignId) {
				await tx.campaign.update({
					where: { id: campaignId },
					data: { currentAmount: { increment: amount }, updated_at: new Date() },
				});
			}
		});
	}

	async deleteCampaign(id: string): Promise<void> {
		const existing = await this.prisma.campaign.findUnique({ where: { id } });
		if (!existing) {
			throw new NotFoundError('La campaña no existe.');
		}
		await this.prisma.$transaction(
			async (tx) => {
				await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=0');
				await tx.payment.deleteMany({ where: { donation: { campaignId: id } } });
				await tx.donation.deleteMany({ where: { campaignId: id } });
				await tx.campaignCategory.deleteMany({ where: { campaignId: id } });
				await tx.campaignMedia.deleteMany({ where: { campaignId: id } });
				await tx.commentCampaign.deleteMany({ where: { campaignId: id } });
				await tx.campaign_interaction.deleteMany({ where: { id_campaign: id } });
				await tx.campaign_update.deleteMany({ where: { id_campaign: id } });
				await tx.campaign_metrics.deleteMany({ where: { id_campaign: id } });
				await tx.user_recommendation.deleteMany({ where: { id_campaign: id } });
				await tx.campaign.delete({ where: { id } });
				await tx.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS=1');
			},
			{ timeout: 30000 },
		);
	}
}
