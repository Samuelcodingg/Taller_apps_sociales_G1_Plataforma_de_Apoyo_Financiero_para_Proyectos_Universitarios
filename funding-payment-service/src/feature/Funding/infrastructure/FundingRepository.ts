import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { randomUUID } from 'node:crypto';
import { databaseAdapterConfig } from '../../../shared/config';
import {
	CampaignGoal,
	CreateDonationData,
	CreatePaymentData,
	IFundingRepository,
	MyDonationRow,
	NotificationRow,
	PaymentRecord,
	ProgressData,
} from '../domain/IFundingRepository';

const num = (value: unknown): number => (value == null ? 0 : Number(value));

export class FundingRepository implements IFundingRepository {
	private readonly prisma: PrismaClient;

	constructor(prismaClient?: PrismaClient) {
		if (prismaClient) {
			this.prisma = prismaClient;
			return;
		}
		const adapter = new PrismaMariaDb(databaseAdapterConfig());
		this.prisma = new PrismaClient({ adapter });
	}

	async getCampaignGoal(campaignId: string): Promise<CampaignGoal | null> {
		const c = await this.prisma.campaign.findUnique({
			where: { id: campaignId },
			select: { goalAmount: true },
		});
		return c ? { goalAmount: num(c.goalAmount) } : null;
	}

	async createDonation(data: CreateDonationData): Promise<string> {
		const id = randomUUID();
		await this.prisma.donation.create({
			data: {
				id,
				campaignId: data.campaignId,
				donorId: data.donorId,
				amount: data.amount,
				isAnonymous: data.isAnonymous,
				message: data.message,
				created_at: new Date(),
			},
		});
		return id;
	}

	async createPayment(data: CreatePaymentData): Promise<string> {
		const id = randomUUID();
		await this.prisma.payment.create({
			data: {
				id,
				donationId: data.donationId,
				paymentMethod: data.paymentMethod,
				transactionId: data.transactionId,
				gateway: data.gateway,
				status: data.status,
				createdAt: new Date(),
			},
		});
		return id;
	}

	async findPaymentByTransaction(transactionId: string): Promise<PaymentRecord | null> {
		const p = await this.prisma.payment.findFirst({
			where: { transactionId },
			include: { donation: true },
		});
		if (!p || !p.donation) return null;
		return {
			paymentId: p.id,
			status: p.status,
			donationId: p.donationId ?? '',
			campaignId: p.donation.campaignId ?? '',
			amount: num(p.donation.amount),
		};
	}

	async markPaymentStatus(paymentId: string, status: string): Promise<void> {
		await this.prisma.payment.update({ where: { id: paymentId }, data: { status } });
	}

	async incrementCampaignAmount(campaignId: string, amount: number): Promise<void> {
		await this.prisma.campaign.update({
			where: { id: campaignId },
			data: { currentAmount: { increment: amount }, updated_at: new Date() },
		});
	}

	async getProgress(campaignId: string): Promise<ProgressData | null> {
		const campaign = await this.prisma.campaign.findUnique({
			where: { id: campaignId },
			select: { goalAmount: true, currentAmount: true },
		});
		if (!campaign) return null;

		// Donaciones con al menos un pago COMPLETED (fuente de verdad del progreso).
		const donations = await this.prisma.donation.findMany({
			where: { campaignId, payments: { some: { status: 'COMPLETED' } } },
			select: { amount: true },
		});

		const raised = donations.reduce((acc, d) => acc + num(d.amount), 0);

		return {
			goal: num(campaign.goalAmount),
			currentAmount: num(campaign.currentAmount),
			raised,
			donorsCount: donations.length,
		};
	}

	async listDonationsByDonor(donorId: string): Promise<MyDonationRow[]> {
		const rows = await this.prisma.donation.findMany({
			where: { donorId },
			orderBy: { created_at: 'desc' },
			include: {
				campaign: { include: { media: { take: 1, orderBy: { order_index: 'asc' } } } },
				payments: { orderBy: { createdAt: 'desc' }, take: 1 },
			},
		});
		return rows.map((d) => ({
			donationId: d.id,
			campaignId: d.campaignId ?? '',
			campaignTitle: d.campaign?.title ?? 'Campaña',
			campaignCover: d.campaign?.media?.[0]?.mediaUrl ?? null,
			amount: num(d.amount),
			status: d.payments?.[0]?.status ?? 'PENDING',
			isAnonymous: Boolean(d.isAnonymous),
			message: d.message ?? null,
			donatedAt: d.created_at,
		}));
	}

	async getCampaignMeta(
		campaignId: string,
	): Promise<{ goal: number; current: number; title: string; creatorId: string | null } | null> {
		const c = await this.prisma.campaign.findUnique({
			where: { id: campaignId },
			select: { goalAmount: true, currentAmount: true, title: true, creatorId: true },
		});
		return c
			? {
					goal: num(c.goalAmount),
					current: num(c.currentAmount),
					title: c.title,
					creatorId: c.creatorId ?? null,
				}
			: null;
	}

	async listFollowerIds(campaignId: string): Promise<string[]> {
		const rows = await this.prisma.campaign_interaction.findMany({
			where: { id_campaign: campaignId, type: 'FOLLOW' },
			select: { id_account: true },
		});
		return rows.map((r) => r.id_account).filter((id): id is string => !!id);
	}

	async createNotifications(
		accountIds: string[],
		title: string,
		body: string,
		entityId: string,
	): Promise<void> {
		if (accountIds.length === 0) return;
		const now = new Date();
		await this.prisma.notification.createMany({
			data: accountIds.map((id) => ({
				id_notification: randomUUID(),
				id_account: id,
				type: 'CAMPAIGN_MILESTONE',
				title,
				body,
				entity_type: 'campaign',
				entity_id: entityId,
				created_at: now,
			})),
		});
	}

	async listNotifications(accountId: string): Promise<NotificationRow[]> {
		const rows = await this.prisma.notification.findMany({
			where: { id_account: accountId },
			orderBy: { created_at: 'desc' },
			take: 50,
		});
		return rows.map((n) => ({
			id: n.id_notification,
			type: n.type,
			title: n.title,
			body: n.body,
			entityType: n.entity_type,
			entityId: n.entity_id,
			isRead: Boolean(n.is_read),
			createdAt: n.created_at,
		}));
	}

	async markNotificationsRead(accountId: string, ids?: string[]): Promise<void> {
		await this.prisma.notification.updateMany({
			where: {
				id_account: accountId,
				...(ids && ids.length > 0 ? { id_notification: { in: ids } } : {}),
			},
			data: { is_read: true },
		});
	}
}
