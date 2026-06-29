import { randomUUID } from 'node:crypto';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../../shared/errors';
import { ICampaignRepository } from '../domain/ICampaignRepository';
import { IMediaStorage } from '../domain/IMediaStorage';
import { CampaignUpdateDTO, CreateUpdateInput } from './dtos';

export class AddUpdate {
	constructor(
		private readonly repository: ICampaignRepository,
		private readonly mediaStorage: IMediaStorage,
	) {}

	async execute(input: CreateUpdateInput): Promise<CampaignUpdateDTO> {
		const ownerId = await this.repository.getOwnerId(input.campaignId);
		if (ownerId === null) {
			throw new NotFoundError('La campaña no existe.');
		}
		if (ownerId !== input.requesterId) {
			throw new UnauthorizedError('Solo el creador puede publicar actualizaciones.');
		}

		const message = input.message?.trim() ?? '';
		// La actualizacion debe tener texto o foto (al menos uno).
		if (message.length < 3 && !input.image) {
			throw new Error('La actualizacion debe tener un mensaje o una foto.');
		}
		const title = input.title?.trim() || null;

		// Sube la foto (si la hay) al almacenamiento de la campaña.
		let imageUrl: string | null = null;
		if (input.image) {
			imageUrl = await this.mediaStorage.uploadAndGetUrl({
				campaignId: `${input.campaignId}/updates/${randomUUID()}`,
				buffer: input.image.buffer,
				contentType: input.image.mimetype,
				originalName: input.image.originalName,
			});
		}

		if (message.length === 0 && !imageUrl) {
			throw new ValidationError('La actualizacion no puede estar vacia.');
		}

		return this.repository.addUpdate(input.campaignId, title, message, imageUrl);
	}
}
