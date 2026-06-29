import { NotFoundError, ValidationError } from '../../../shared/errors';
import { ICampaignRepository } from '../domain/ICampaignRepository';
import { InteractionInput, InteractionResultDTO } from './dtos';

export class ToggleInteraction {
	constructor(private readonly repository: ICampaignRepository) {}

	async execute(input: InteractionInput): Promise<InteractionResultDTO> {
		const allowed = ['LIKE', 'SHARE', 'BOOKMARK', 'FOLLOW', 'INTEREST'];
		if (!allowed.includes(input.type)) {
			throw new ValidationError(`Tipo de interaccion invalido (${allowed.join(', ')}).`);
		}

		const ownerId = await this.repository.getOwnerId(input.campaignId);
		if (ownerId === null) {
			throw new NotFoundError('La campaña no existe.');
		}

		return this.repository.toggleInteraction(input.campaignId, input.accountId, input.type);
	}
}
