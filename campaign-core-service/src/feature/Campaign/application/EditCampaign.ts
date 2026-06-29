import { NotFoundError, UnauthorizedError, ValidationError } from '../../../shared/errors';
import { EditCampaignFields, ICampaignRepository } from '../domain/ICampaignRepository';
import { CampaignDetailDTO, EditCampaignInput } from './dtos';

const ALLOWED_STATUS = ['DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED'];

export class EditCampaign {
	constructor(private readonly repository: ICampaignRepository) {}

	async execute(input: EditCampaignInput): Promise<CampaignDetailDTO> {
		const ownerId = await this.repository.getOwnerId(input.id);
		if (ownerId === null) {
			throw new NotFoundError('La campaña no existe.');
		}
		if (ownerId !== input.requesterId) {
			throw new UnauthorizedError('Solo el creador puede editar esta campaña.');
		}

		const fields: EditCampaignFields = {};

		if (input.title !== undefined) {
			if (input.title.trim().length < 3) {
				throw new ValidationError('El titulo debe tener al menos 3 caracteres.');
			}
			fields.title = input.title.trim();
		}

		if (input.description !== undefined) {
			if (input.description.trim().length < 10) {
				throw new ValidationError('La descripcion debe tener al menos 10 caracteres.');
			}
			fields.description = input.description.trim();
		}

		if (input.goalAmount !== undefined) {
			const goal = Number(input.goalAmount);
			if (!Number.isFinite(goal) || goal <= 0) {
				throw new ValidationError('La meta economica debe ser mayor a 0.');
			}
			fields.goalAmount = goal;
		}

		if (input.endDate !== undefined) {
			const date = new Date(input.endDate);
			if (Number.isNaN(date.getTime())) {
				throw new ValidationError('La fecha limite no es valida.');
			}
			fields.endDate = date;
		}

		if (input.status !== undefined) {
			const status = input.status.toUpperCase();
			if (!ALLOWED_STATUS.includes(status)) {
				throw new ValidationError(`Estado invalido. Use uno de: ${ALLOWED_STATUS.join(', ')}.`);
			}
			fields.status = status;
		}

		if (Object.keys(fields).length === 0) {
			throw new ValidationError('No hay cambios para guardar.');
		}

		return this.repository.update(input.id, fields);
	}
}
