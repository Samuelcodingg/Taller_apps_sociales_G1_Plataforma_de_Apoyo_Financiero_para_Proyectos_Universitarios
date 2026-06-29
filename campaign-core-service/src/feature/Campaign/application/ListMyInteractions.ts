import { ValidationError } from '../../../shared/errors';
import { ICampaignRepository } from '../domain/ICampaignRepository';
import { CampaignSummaryDTO } from './dtos';

// Lista las campañas con las que el usuario tiene cierta interaccion:
// BOOKMARK (favoritos), FOLLOW (seguidas) o INTEREST (matchmaking).
export class ListMyInteractions {
	constructor(private readonly repository: ICampaignRepository) {}

	execute(accountId: string, type: string): Promise<CampaignSummaryDTO[]> {
		const t = String(type).toUpperCase();
		if (!['BOOKMARK', 'FOLLOW', 'INTEREST', 'LIKE'].includes(t)) {
			throw new ValidationError('Tipo invalido (BOOKMARK, FOLLOW, INTEREST o LIKE).');
		}
		return this.repository.listSummariesByInteraction(accountId, t);
	}
}
