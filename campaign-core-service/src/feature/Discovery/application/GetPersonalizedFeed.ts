import { IDiscoveryRepository, ScoredCampaign } from '../domain/IDiscoveryRepository';

export class GetPersonalizedFeed {
	constructor(private readonly repository: IDiscoveryRepository) {}

	execute(accountId: string, limit = 9): Promise<ScoredCampaign[]> {
		return this.repository.getPersonalizedFeed(accountId, limit);
	}
}
