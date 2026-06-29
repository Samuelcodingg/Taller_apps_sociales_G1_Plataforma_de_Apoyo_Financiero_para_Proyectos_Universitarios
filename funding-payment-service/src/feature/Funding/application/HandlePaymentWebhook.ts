import { NotFoundError, ValidationError } from '../../../shared/errors';
import { IFundingRepository } from '../domain/IFundingRepository';
import { WebhookInput, WebhookResultDTO } from './dtos';

// Procesa el webhook de la pasarela: confirma o rechaza el pago y, si se
// completa, actualiza el progreso financiero de la campaña. Es idempotente.
export class HandlePaymentWebhook {
	constructor(private readonly repository: IFundingRepository) {}

	async execute(input: WebhookInput): Promise<WebhookResultDTO> {
		const transactionId = input.transactionId?.trim();
		if (!transactionId) {
			throw new ValidationError('Falta el transactionId.');
		}
		const status = String(input.status).toUpperCase();
		if (status !== 'COMPLETED' && status !== 'FAILED') {
			throw new ValidationError('Estado de pago invalido (COMPLETED o FAILED).');
		}

		const payment = await this.repository.findPaymentByTransaction(transactionId);
		if (!payment) {
			throw new NotFoundError('No existe un pago con ese transactionId.');
		}

		// Idempotencia: si el pago ya esta en un estado final, no reaplicamos.
		if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
			return { transactionId, status: payment.status, applied: false };
		}

		await this.repository.markPaymentStatus(payment.paymentId, status);

		// Al completarse, suma el monto al progreso y notifica hitos a seguidores.
		if (status === 'COMPLETED') {
			const meta = await this.repository.getCampaignMeta(payment.campaignId);
			await this.repository.incrementCampaignAmount(payment.campaignId, payment.amount);

			if (meta && meta.goal > 0) {
				await this.notifyMilestones(
					payment.campaignId,
					meta.title,
					meta.goal,
					meta.current, // antes del incremento
					meta.current + payment.amount, // despues
					meta.creatorId,
				);
			}
		}

		return { transactionId, status, applied: true };
	}

	// Crea notificaciones para los seguidores cuando el progreso cruza un hito.
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

		// Destinatarios: seguidores + creador de la campaña (sin duplicados).
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
