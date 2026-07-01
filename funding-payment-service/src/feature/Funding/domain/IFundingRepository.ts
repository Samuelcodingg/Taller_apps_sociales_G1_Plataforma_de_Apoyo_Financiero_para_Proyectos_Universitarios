export interface CampaignGoal {
	goalAmount: number;
}

export interface CreateDonationData {
	campaignId: string;
	donorId: string | null;
	amount: number;
	isAnonymous: boolean;
	message: string | null;
}

export interface CreatePaymentData {
	donationId: string;
	paymentMethod: string;
	transactionId: string;
	gateway: string;
	status: string;
}

export interface PaymentRecord {
	paymentId: string;
	status: string;
	donationId: string;
	campaignId: string;
	amount: number;
}

export interface ProgressData {
	goal: number;
	currentAmount: number;
	raised: number;
	donorsCount: number;
}

export interface IFundingRepository {
	// Lee la meta de la campaña; null si no existe.
	getCampaignGoal(campaignId: string): Promise<CampaignGoal | null>;

	createDonation(data: CreateDonationData): Promise<string>; // devuelve donationId
	createPayment(data: CreatePaymentData): Promise<string>; // devuelve paymentId

	findPaymentByTransaction(transactionId: string): Promise<PaymentRecord | null>;
	findPaymentByDonation(donationId: string): Promise<PaymentRecord | null>;
	markPaymentStatus(paymentId: string, status: string): Promise<void>;

	// Donaciones con pago PENDING para campañas creadas por `creatorId` (para que
	// el creador confirme los yapeos recibidos).
	listIncomingPending(creatorId: string): Promise<IncomingPendingRow[]>;

	// Suma `amount` a campaign.current_amount (progreso financiero).
	incrementCampaignAmount(campaignId: string, amount: number): Promise<void>;

	// Progreso financiero calculado desde los pagos COMPLETED.
	getProgress(campaignId: string): Promise<ProgressData | null>;

	// Donaciones de un donante (con campaña y estado del pago).
	listDonationsByDonor(donorId: string): Promise<MyDonationRow[]>;

	// Datos de campaña para notificaciones de hito.
	getCampaignMeta(
		campaignId: string,
	): Promise<{ goal: number; current: number; title: string; creatorId: string | null } | null>;

	// Cuentas que siguen la campaña (campaign_interaction type FOLLOW).
	listFollowerIds(campaignId: string): Promise<string[]>;

	// Crea notificaciones para varias cuentas.
	createNotifications(
		accountIds: string[],
		title: string,
		body: string,
		entityId: string,
	): Promise<void>;

	// Notificaciones de una cuenta (mas recientes primero).
	listNotifications(accountId: string): Promise<NotificationRow[]>;

	// Marca como leidas las notificaciones de la cuenta (todas o las indicadas).
	markNotificationsRead(accountId: string, ids?: string[]): Promise<void>;
}

export interface NotificationRow {
	id: string;
	type: string;
	title: string;
	body: string | null;
	entityType: string | null;
	entityId: string | null;
	isRead: boolean;
	createdAt: Date;
}

export interface IncomingPendingRow {
	donationId: string;
	campaignId: string;
	campaignTitle: string;
	amount: number;
	paymentMethod: string;
	donorName: string;
	isAnonymous: boolean;
	message: string | null;
	donatedAt: Date;
}

export interface MyDonationRow {
	donationId: string;
	campaignId: string;
	campaignTitle: string;
	campaignCover: string | null;
	amount: number;
	status: string;
	isAnonymous: boolean;
	message: string | null;
	donatedAt: Date;
}
