import { IFundingRepository } from '../domain/IFundingRepository';

// Lista las donaciones (yapeos) pendientes de confirmar de las campañas del
// creador autenticado.
export class GetIncomingPending {
	constructor(private readonly repository: IFundingRepository) {}

	async execute(creatorId: string) {
		const rows = await this.repository.listIncomingPending(creatorId);
		return rows.map((r) => ({
			donationId: r.donationId,
			campaignId: r.campaignId,
			campaignTitle: r.campaignTitle,
			amount: r.amount,
			paymentMethod: r.paymentMethod,
			donorName: r.donorName,
			isAnonymous: r.isAnonymous,
			message: r.message,
			donatedAt: r.donatedAt.toISOString(),
		}));
	}
}
