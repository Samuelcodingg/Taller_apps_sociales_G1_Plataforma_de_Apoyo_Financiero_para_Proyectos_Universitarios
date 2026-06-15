import { NotFoundError } from '../../../shared/errors';
import { IProfileRepository } from '../domain/IProfileRepository';
import { ProfileDTO, toProfileDTO } from './dtos';

export class GetMyProfile {
	constructor(private readonly profileRepository: IProfileRepository) {}

	async execute(accountId: string): Promise<ProfileDTO> {
		const profile = await this.profileRepository.findByAccountId(accountId);

		if (!profile) {
			throw new NotFoundError('El perfil del usuario no existe.');
		}

		return toProfileDTO(profile);
	}
}
