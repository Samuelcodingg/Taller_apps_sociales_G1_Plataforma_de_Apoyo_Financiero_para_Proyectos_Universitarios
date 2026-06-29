import { NotFoundError } from '../../../shared/errors';
import { IFundingRepository } from '../domain/IFundingRepository';
import { CampaignProgressDTO } from './dtos';

export class GetCampaignProgress {
	constructor(private readonly repository: IFundingRepository) {}

	async execute(campaignId: string): Promise<CampaignProgressDTO> {
		const data = await this.repository.getProgress(campaignId);
		if (!data) {
			throw new NotFoundError('La campaña no existe.');
		}

		const percentage =
			data.goal > 0 ? Math.min(100, Math.round((data.raised / data.goal) * 100)) : 0;

		return {
			campaignId,
			goal: data.goal,
			raised: data.raised,
			currentAmount: data.currentAmount,
			donorsCount: data.donorsCount,
			percentage,
		};
	}
}
