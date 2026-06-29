import { NotFoundError } from '../../../shared/errors';
import { ICampaignRepository } from '../domain/ICampaignRepository';
import { CampaignDetailDTO } from './dtos';

export class GetCampaign {
	constructor(private readonly repository: ICampaignRepository) {}

	async execute(id: string, viewerId?: string | null): Promise<CampaignDetailDTO> {
		const campaign = await this.repository.getDetail(id, viewerId);
		if (!campaign) {
			throw new NotFoundError('La campaña no existe.');
		}
		return campaign;
	}
}
