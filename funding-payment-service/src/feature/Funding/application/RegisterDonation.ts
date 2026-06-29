import { NotFoundError, ValidationError } from '../../../shared/errors';
import { IFundingRepository } from '../domain/IFundingRepository';
import { IPaymentGateway } from '../domain/IPaymentGateway';
import { DonationResultDTO, RegisterDonationInput } from './dtos';

export class RegisterDonation {
	constructor(
		private readonly repository: IFundingRepository,
		private readonly gateway: IPaymentGateway,
	) {}

	async execute(input: RegisterDonationInput): Promise<DonationResultDTO> {
		const amount = Number(input.amount);
		if (!Number.isFinite(amount) || amount <= 0) {
			throw new ValidationError('El monto de la donacion debe ser mayor a 0.');
		}

		const campaign = await this.repository.getCampaignGoal(input.campaignId);
		if (!campaign) {
			throw new NotFoundError('La campaña no existe.');
		}

		// Sin donante identificado, la donacion es necesariamente anonima.
		const isAnonymous = input.isAnonymous || !input.donorId;

		// 1. Registra la donacion (aun sin pago confirmado).
		const donationId = await this.repository.createDonation({
			campaignId: input.campaignId,
			donorId: input.donorId,
			amount,
			isAnonymous,
			message: input.message?.trim() || null,
		});

		// 2. Inicia el cobro en la pasarela (aislado tras el puerto IPaymentGateway).
		const charge = await this.gateway.createCharge({
			amount,
			currency: 'PEN',
			metadata: { donationId, campaignId: input.campaignId },
		});

		// 3. Registra el pago en estado PENDING (se confirma via webhook).
		const paymentId = await this.repository.createPayment({
			donationId,
			paymentMethod: input.paymentMethod?.trim() || 'CARD',
			transactionId: charge.transactionId,
			gateway: charge.gateway,
			status: 'PENDING',
		});

		return {
			donationId,
			paymentId,
			transactionId: charge.transactionId,
			status: 'PENDING',
			amount,
			gateway: charge.gateway,
		};
	}
}
