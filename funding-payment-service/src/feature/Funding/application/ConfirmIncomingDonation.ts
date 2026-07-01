import { NotFoundError, UnauthorizedError } from '../../../shared/errors';
import { IFundingRepository } from '../domain/IFundingRepository';

// El creador confirma manualmente un yapeo recibido: marca el pago COMPLETED,
// suma el monto al progreso de su campaña y notifica hitos. Solo el dueño de la
// campaña puede confirmar. Idempotente.
export class ConfirmIncomingDonation {
	constructor(private readonly repository: IFundingRepository) {}

	async execute(creatorId: string, donationId: string) {
		const payment = await this.repository.findPaymentByDonation(donationId);
		if (!payment) {
			throw new NotFoundError('No existe la donación indicada.');
		}

		const meta = await this.repository.getCampaignMeta(payment.campaignId);
		if (!meta) {
			throw new NotFoundError('La campaña no existe.');
		}
		// Autorización: solo el creador dueño de la campaña puede confirmar.
		if (meta.creatorId !== creatorId) {
			throw new UnauthorizedError('No puedes confirmar donaciones de otra campaña.');
		}

		// Idempotencia: si ya está en estado final, no reaplicamos.
		if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
			return { donationId, status: payment.status, applied: false };
		}

		await this.repository.markPaymentStatus(payment.paymentId, 'COMPLETED');
		await this.repository.incrementCampaignAmount(payment.campaignId, payment.amount);

		if (meta.goal > 0) {
			await this.notifyMilestones(
				payment.campaignId,
				meta.title,
				meta.goal,
				meta.current,
				meta.current + payment.amount,
				meta.creatorId,
			);
		}

		return { donationId, status: 'COMPLETED', applied: true };
	}

	private async notifyMilestones(
		campaignId: string,
		title: string,
		goal: number,
		before: number,
		after: number,
		creatorId: string | null,
	): Promise<void> {
		const milestones = [25, 50, 75, 100];
		const pct = (amount: number) => (amount / goal) * 100;
		const crossed = milestones.filter((m) => pct(before) < m && pct(after) >= m);
		if (crossed.length === 0) return;

		const followers = await this.repository.listFollowerIds(campaignId);
		const recipients = [...new Set([...followers, ...(creatorId ? [creatorId] : [])])];
		if (recipients.length === 0) return;

		const top = crossed[crossed.length - 1];
		const body =
			top >= 100
				? `¡La campaña "${title}" alcanzó su meta!`
				: `La campaña "${title}" alcanzó el ${top}% de su meta.`;
		await this.repository.createNotifications(recipients, 'Hito de campaña', body, campaignId);
	}
}
