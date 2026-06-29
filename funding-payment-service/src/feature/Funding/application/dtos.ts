// DTOs de la feature Funding (donaciones + pagos).

export interface RegisterDonationInput {
	campaignId: string;
	donorId: string | null; // null si es anonima/sin sesion
	amount: number;
	isAnonymous: boolean;
	message?: string | null;
	paymentMethod?: string;
}

export interface DonationResultDTO {
	donationId: string;
	paymentId: string;
	transactionId: string;
	status: string; // estado del pago (PENDING al iniciar)
	amount: number;
	gateway: string;
}

export type PaymentStatus = 'COMPLETED' | 'FAILED';

export interface WebhookInput {
	transactionId: string;
	status: PaymentStatus;
}

export interface WebhookResultDTO {
	transactionId: string;
	status: string;
	applied: boolean; // si este webhook produjo un cambio (idempotencia)
}

export interface MyDonationDTO {
	donationId: string;
	campaignId: string;
	campaignTitle: string;
	campaignCover: string | null;
	amount: number;
	status: string; // estado del ultimo pago (COMPLETED/PENDING/FAILED)
	isAnonymous: boolean;
	message: string | null;
	donatedAt: string;
}

export interface CampaignProgressDTO {
	campaignId: string;
	goal: number;
	raised: number; // suma de donaciones con pago COMPLETED
	currentAmount: number; // valor almacenado en campaign.current_amount
	donorsCount: number;
	percentage: number; // 0-100
}
