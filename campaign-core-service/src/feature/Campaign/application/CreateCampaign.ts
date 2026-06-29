import { randomUUID } from 'node:crypto';
import { ValidationError } from '../../../shared/errors';
import { ICampaignRepository } from '../domain/ICampaignRepository';
import { IMediaStorage } from '../domain/IMediaStorage';
import { categorize } from '../domain/categorize';
import { CampaignDetailDTO, CreateCampaignInput } from './dtos';

export class CreateCampaign {
	constructor(
		private readonly repository: ICampaignRepository,
		private readonly mediaStorage: IMediaStorage,
	) {}

	async execute(input: CreateCampaignInput): Promise<CampaignDetailDTO> {
		const title = input.title?.trim() ?? '';
		const description = input.description?.trim() ?? '';

		if (title.length < 3) {
			throw new ValidationError('El titulo es obligatorio (minimo 3 caracteres).');
		}
		if (description.length < 10) {
			throw new ValidationError('La descripcion es obligatoria (minimo 10 caracteres).');
		}

		const goalAmount = Number(input.goalAmount);
		if (!Number.isFinite(goalAmount) || goalAmount <= 0) {
			throw new ValidationError('La meta economica debe ser un numero mayor a 0.');
		}

		if (!input.endDate) {
			throw new ValidationError('La fecha limite es obligatoria.');
		}
		const endDate = new Date(input.endDate);
		if (Number.isNaN(endDate.getTime())) {
			throw new ValidationError('La fecha limite no es valida.');
		}
		if (endDate.getTime() <= Date.now()) {
			throw new ValidationError('La fecha limite debe ser futura.');
		}

		if (!input.media) {
			throw new ValidationError('Debes adjuntar una imagen o video de la campaña.');
		}

		// Categorizacion automatica a partir del titulo + descripcion.
		const categories = categorize(title, description);

		// Generamos el id aqui para poder nombrar el archivo multimedia antes de
		// insertar la campaña.
		const campaignId = randomUUID();

		const type = input.media.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE';
		const url = await this.mediaStorage.uploadAndGetUrl({
			campaignId,
			buffer: input.media.buffer,
			contentType: input.media.mimetype,
			originalName: input.media.originalName,
		});

		// Borrador o publicacion directa.
		const status = input.status?.toUpperCase() === 'DRAFT' ? 'DRAFT' : 'ACTIVE';

		return this.repository.create({
			id: campaignId,
			creatorId: input.creatorId,
			title,
			description,
			goalAmount,
			endDate,
			status,
			categories,
			media: { type, url },
		});
	}
}
