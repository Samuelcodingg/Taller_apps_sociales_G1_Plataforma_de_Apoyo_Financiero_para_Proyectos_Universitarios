import { IDiscoveryRepository, ScoredCampaign } from '../domain/IDiscoveryRepository';

export class GetTrending {
	constructor(private readonly repository: IDiscoveryRepository) {}

	execute(limit = 9): Promise<ScoredCampaign[]> {
		return this.repository.getTrending(limit);
	}
}
