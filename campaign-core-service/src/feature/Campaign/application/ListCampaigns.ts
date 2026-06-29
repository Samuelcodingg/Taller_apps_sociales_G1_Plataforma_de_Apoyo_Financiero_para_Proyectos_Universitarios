import { ICampaignRepository } from '../domain/ICampaignRepository';
import { CampaignSummaryDTO } from './dtos';

export class ListCampaigns {
	constructor(private readonly repository: ICampaignRepository) {}

	execute(): Promise<CampaignSummaryDTO[]> {
		return this.repository.listSummaries();
	}
}
