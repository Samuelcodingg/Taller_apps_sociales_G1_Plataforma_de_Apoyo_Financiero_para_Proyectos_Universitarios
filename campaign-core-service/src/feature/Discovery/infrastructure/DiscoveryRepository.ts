import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { randomUUID } from 'node:crypto';
import { databaseAdapterConfig } from '../../../shared/config';
import { IDiscoveryRepository, ScoredCampaign } from '../domain/IDiscoveryRepository';

const summaryInclude = Prisma.validator<Prisma.CampaignDefaultArgs>()({
	include: {
		categories: { include: { category: true } },
		media: true,
		creator: { include: { profile: { include: { institution: true } }, verification: true } },
		_count: { select: { donations: true } },
	},
});
type SummaryRow = Prisma.CampaignGetPayload<typeof summaryInclude>;

const dec = (v: Prisma.Decimal | null | undefined): number => (v ? Number(v) : 0);
const DAY = 24 * 60 * 60 * 1000;

// Pesos de cada señal de comportamiento para el feed personalizado.
const SIGNAL_WEIGHT: Record<string, number> = {
	DONATION: 3,
	INTEREST: 2.5,
	BOOKMARK: 2,
	FOLLOW: 2,
	LIKE: 1.5,
	CLICK: 1,
	SHARE: 1,
};

export class DiscoveryRepository implements IDiscoveryRepository {
	private readonly prisma: PrismaClient;

	constructor(prismaClient?: PrismaClient) {
		if (prismaClient) {
			this.prisma = prismaClient;
			return;
		}
		const adapter = new PrismaMariaDb(databaseAdapterConfig());
		this.prisma = new PrismaClient({ adapter });
	}

	async recordView(campaignId: string, accountId: string | null): Promise<void> {
		if (!accountId) return;
		await this.prisma.campaign_interaction.create({
			data: {
				id_interaction: randomUUID(),
				id_account: accountId,
				id_campaign: campaignId,
				type: 'CLICK',
				created_at: new Date(),
			},
		});
	}

	// ---------- TENDENCIAS (indice de viralidad) ----------
	async getTrending(limit: number): Promise<ScoredCampaign[]> {
		const since = new Date(Date.now() - DAY);

		const rows = await this.prisma.campaign.findMany({
			where: { status: 'ACTIVE' },
			include: {
				...summaryInclude.include,
				donations: { where: { created_at: { gte: since } }, include: { payments: true } },
				campaign_interaction: { where: { type: 'SHARE' } },
			},
		});

		const scored = rows.map((row) => {
			const completed = row.donations.filter((d) =>
				d.payments.some((p) => p.status === 'COMPLETED'),
			);
			const donations24h = completed.length;
			const amount24h = completed.reduce((acc, d) => acc + dec(d.amount), 0);
			const shares = row.campaign_interaction.length;
			const ageDays = (Date.now() - row.createdAt.getTime()) / DAY;
			const recencyBoost = ageDays <= 7 ? 2 : 0;

			// Indice de viralidad: velocidad de donaciones + monto + compartidos.
			const score =
				donations24h * 3 + amount24h / 50 + shares * 2 + recencyBoost;

			return { summary: this.buildSummary(row, score), donations24h, amount24h };
		});

		scored.sort((a, b) => b.summary.score - a.summary.score);
		const top = scored.slice(0, limit);

		// Persiste un snapshot del indice en campaign_metrics (calculo "periodico").
		this.persistMetrics(top).catch((e) =>
			console.error('[discovery] no se pudo guardar campaign_metrics:', e.message),
		);

		return top.map((t) => t.summary);
	}

	// ---------- FEED PERSONALIZADO ----------
	// El feed lo produce ai-analytics-service: un lote periodico le pide a un LLM
	// que rankee las campañas para cada donante y deja el resultado en
	// user_recommendation. Aqui solo se lee.
	//
	// Si ese lote todavia no corrio para este donante (cuenta nueva, o el job
	// fallo), se cae al scoring heuristico de siempre. Es peor feed, pero es un
	// feed: nadie ve una pantalla vacia.
	async getPersonalizedFeed(accountId: string, limit: number): Promise<ScoredCampaign[]> {
		const recommended = await this.readRecommendations(accountId, limit);
		if (recommended.length > 0) return recommended;

		console.info(
			`[discovery] sin recomendaciones del LLM para la cuenta ${accountId}; ` +
				'se usa el scoring heuristico',
		);
		return this.heuristicFeed(accountId, limit);
	}

	// Lee el feed que dejo el LLM, descartando lo que se quedo obsoleto entre
	// que corrio el lote y ahora: campañas cerradas y campañas que el donante ya
	// apoyo desde entonces.
	private async readRecommendations(
		accountId: string,
		limit: number,
	): Promise<ScoredCampaign[]> {
		const [rows, donatedIds] = await Promise.all([
			this.prisma.user_recommendation.findMany({
				where: { id_account: accountId, campaign: { status: 'ACTIVE' } },
				include: { campaign: summaryInclude },
				orderBy: { score: 'desc' },
			}),
			this.getDonatedCampaignIds(accountId),
		]);

		return rows
			.filter((row) => row.campaign && !donatedIds.has(row.campaign.id))
			.slice(0, limit)
			.map((row) => ({
				...this.buildSummary(row.campaign as SummaryRow, Number(row.score)),
				reason: row.reason,
			}));
	}

	// Fallback: scoring por reglas (afinidad de categorias + misma universidad +
	// popularidad). No persiste nada: user_recommendation es de ai-analytics-service.
	private async heuristicFeed(accountId: string, limit: number): Promise<ScoredCampaign[]> {
		const [categoryWeights, donatedIds, university] = await Promise.all([
			this.getCategoryWeights(accountId),
			this.getDonatedCampaignIds(accountId),
			this.getUserUniversity(accountId),
		]);

		const candidates = await this.prisma.campaign.findMany({
			where: { status: 'ACTIVE', creatorId: { not: accountId } },
			...summaryInclude,
		});

		const scored = candidates
			.filter((row) => !donatedIds.has(row.id))
			.map((row) => {
				const cats = row.categories.map((c) => c.category.name);
				const affinity = cats.reduce((acc, c) => acc + (categoryWeights.get(c) ?? 0), 0);
				const creatorUni = this.creatorUniversity(row);
				const sameUni = university && creatorUni && creatorUni === university ? 3 : 0;
				const popularity = row._count.donations * 0.2;
				const score = affinity + sameUni + popularity;
				return this.buildSummary(row, score);
			});

		// Si el usuario no tiene señales, recomienda lo mas popular (cold start).
		const hasSignals = categoryWeights.size > 0 || !!university;
		scored.sort((a, b) =>
			hasSignals ? b.score - a.score : b.donorsCount - a.donorsCount,
		);

		return scored.slice(0, limit);
	}

	// ---------- señales del usuario ----------
	private async getCategoryWeights(accountId: string): Promise<Map<string, number>> {
		const [donations, interactions] = await Promise.all([
			this.prisma.donation.findMany({ where: { donorId: accountId }, select: { campaignId: true } }),
			this.prisma.campaign_interaction.findMany({
				where: { id_account: accountId },
				select: { id_campaign: true, type: true },
			}),
		]);

		// Peso por campaña segun la señal mas fuerte observada.
		const campaignWeight = new Map<string, number>();
		const bump = (id: string | null, w: number) => {
			if (!id) return;
			campaignWeight.set(id, Math.max(campaignWeight.get(id) ?? 0, w));
		};
		donations.forEach((d) => bump(d.campaignId, SIGNAL_WEIGHT.DONATION));
		interactions.forEach((i) => bump(i.id_campaign, SIGNAL_WEIGHT[i.type] ?? 1));

		const ids = [...campaignWeight.keys()];
		if (ids.length === 0) return new Map();

		const links = await this.prisma.campaignCategory.findMany({
			where: { campaignId: { in: ids } },
			include: { category: true },
		});

		const weights = new Map<string, number>();
		for (const link of links) {
			const w = campaignWeight.get(link.campaignId) ?? 0;
			weights.set(link.category.name, (weights.get(link.category.name) ?? 0) + w);
		}
		return weights;
	}

	private async getDonatedCampaignIds(accountId: string): Promise<Set<string>> {
		const donations = await this.prisma.donation.findMany({
			where: { donorId: accountId },
			select: { campaignId: true },
		});
		return new Set(donations.map((d) => d.campaignId).filter((id): id is string => !!id));
	}

	private async getUserUniversity(accountId: string): Promise<string | null> {
		const verifications = await this.prisma.verification.findMany({
			where: { id_account: accountId },
			orderBy: { created_at: 'desc' },
			take: 10,
		});
		const withData = verifications.find((v) => v.extracted_data);
		const data = (withData?.extracted_data ?? {}) as Record<string, unknown>;
		const uni = data.university ?? data.universidad;
		return typeof uni === 'string' && uni.trim() ? uni : null;
	}

	private creatorUniversity(row: SummaryRow): string | null {
		const inst = row.creator?.profile?.[0]?.institution?.name;
		if (inst) return inst;
		const verifications = row.creator?.verification ?? [];
		const withData = verifications
			.filter((v) => v.extracted_data)
			.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
		const data = (withData?.extracted_data ?? {}) as Record<string, unknown>;
		const uni = data.university ?? data.universidad;
		return typeof uni === 'string' && uni.trim() ? uni : null;
	}

	// ---------- persistencia ----------
	private async persistMetrics(
		items: { summary: ScoredCampaign; donations24h: number; amount24h: number }[],
	): Promise<void> {
		if (items.length === 0) return;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const ids = items.map((i) => i.summary.id);
		await this.prisma.campaign_metrics.deleteMany({
			where: { id_campaign: { in: ids }, date: today },
		});
		await this.prisma.campaign_metrics.createMany({
			data: items.map((i) => ({
				id_metric: randomUUID(),
				id_campaign: i.summary.id,
				date: today,
				donations_last_24h: i.donations24h,
				amount_last_24h: i.amount24h,
				trend_score: Math.min(999.99, Number(i.summary.score.toFixed(2))),
			})),
		});
	}

	// ---------- mapeo a resumen ----------
	private buildSummary(row: SummaryRow, score: number): ScoredCampaign {
		const cover = row.media[0]
			? { type: row.media[0].typeMedia, url: row.media[0].mediaUrl }
			: null;
		const profile = row.creator?.profile?.[0];
		const verified = (row.creator?.verification ?? []).some((v) => v.status === 'APPROVED');

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
			creator: {
				id: row.creator?.id ?? null,
				name: profile
					? `${profile.names ?? ''} ${profile.surnames ?? ''}`.trim() || 'Usuario'
					: 'Usuario',
				university: this.creatorUniversity(row),
				career: null,
				verified,
				yapeQrUrl: null,
			},
			donorsCount: row._count.donations,
			likes: 0,
			shares: 0,
			score: Number(score.toFixed(2)),
		};
	}
}
