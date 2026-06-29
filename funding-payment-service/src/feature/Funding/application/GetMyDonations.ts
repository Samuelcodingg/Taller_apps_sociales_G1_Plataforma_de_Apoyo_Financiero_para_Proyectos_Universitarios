import { IFundingRepository } from '../domain/IFundingRepository';
import { MyDonationDTO } from './dtos';

export class GetMyDonations {
	constructor(private readonly repository: IFundingRepository) {}

	async execute(donorId: string): Promise<MyDonationDTO[]> {
		const rows = await this.repository.listDonationsByDonor(donorId);
		return rows.map((d) => ({
			donationId: d.donationId,
			campaignId: d.campaignId,
			campaignTitle: d.campaignTitle,
			campaignCover: d.campaignCover,
			amount: d.amount,
			status: d.status,
			isAnonymous: d.isAnonymous,
			message: d.message,
			donatedAt: d.donatedAt.toISOString(),
		}));
	}
}
