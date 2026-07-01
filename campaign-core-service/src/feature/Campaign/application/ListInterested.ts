import { NotFoundError, UnauthorizedError } from '../../../shared/errors';
import { ICampaignRepository } from '../domain/ICampaignRepository';
import { InterestedDTO } from './dtos';

// Lista las cuentas que marcaron "Conectar" (INTEREST) en una campaña. Solo el
// creador dueño de la campaña puede verlas (incluyen datos de contacto).
export class ListInterested {
	constructor(private readonly repository: ICampaignRepository) {}

	async execute(campaignId: string, requesterId: string): Promise<InterestedDTO[]> {
		const ownerId = await this.repository.getOwnerId(campaignId);
		if (ownerId === null) {
			throw new NotFoundError('La campaña no existe.');
		}
		if (ownerId !== requesterId) {
			throw new UnauthorizedError('Solo el creador de la campaña puede ver los interesados.');
		}
		return this.repository.listInterested(campaignId);
	}
}
