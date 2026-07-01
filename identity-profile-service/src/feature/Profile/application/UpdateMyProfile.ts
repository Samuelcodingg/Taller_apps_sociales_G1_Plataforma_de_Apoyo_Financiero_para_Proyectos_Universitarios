import { ValidationError } from '../../../shared/errors';
import { IProfileRepository, UpdateProfileFields } from '../domain/IProfileRepository';
import { ProfileDTO, toProfileDTO, UpdateProfileInput } from './dtos';

export class UpdateMyProfile {
	constructor(private readonly profileRepository: IProfileRepository) {}

	async execute(accountId: string, input: UpdateProfileInput): Promise<ProfileDTO> {
		const fields = this.toFields(input);

		const updated = await this.profileRepository.updateByAccountId(accountId, fields);
		return toProfileDTO(updated);
	}

	// Valida y normaliza el DTO de entrada hacia los campos del repositorio.
	private toFields(input: UpdateProfileInput): UpdateProfileFields {
		const fields: UpdateProfileFields = {};

		if (input.names !== undefined) {
			if (typeof input.names !== 'string' || input.names.trim().length === 0) {
				throw new ValidationError('El nombre no puede estar vacio.');
			}
			fields.names = input.names.trim();
		}

		if (input.surnames !== undefined) {
			if (typeof input.surnames !== 'string' || input.surnames.trim().length === 0) {
				throw new ValidationError('Los apellidos no pueden estar vacios.');
			}
			fields.surnames = input.surnames.trim();
		}

		if (input.biography !== undefined) {
			fields.biography = input.biography;
		}

		if (input.photoUrl !== undefined) {
			fields.photoUrl = input.photoUrl;
		}

		if (input.yapeQrUrl !== undefined) {
			fields.yapeQrUrl = input.yapeQrUrl;
		}

		if (input.countryId !== undefined) {
			fields.countryId = input.countryId;
		}

		if (input.country !== undefined) {
			// Nombre de pais (texto). El repositorio lo resuelve/crea y asigna el id.
			fields.countryName =
				typeof input.country === 'string' && input.country.trim()
					? input.country.trim()
					: null;
		}

		if (input.institutionId !== undefined) {
			fields.institutionId = input.institutionId;
		}

		if (input.birthDate !== undefined) {
			if (input.birthDate === null) {
				fields.birthDate = null;
			} else {
				const date = new Date(input.birthDate);
				if (Number.isNaN(date.getTime())) {
					throw new ValidationError('La fecha de nacimiento no es valida.');
				}
				fields.birthDate = date;
			}
		}

		if (input.socialNetworks !== undefined) {
			if (!Array.isArray(input.socialNetworks)) {
				throw new ValidationError('socialNetworks debe ser una lista.');
			}
			fields.socialNetworks = input.socialNetworks.map((sn) => {
				if (typeof sn?.platform !== 'string' || typeof sn?.link !== 'string') {
					throw new ValidationError('Cada red social requiere platform y link como texto.');
				}
				return { platform: sn.platform.trim(), link: sn.link.trim() };
			});
		}

		return fields;
	}
}
