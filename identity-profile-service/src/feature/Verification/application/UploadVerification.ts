import { ValidationError } from '../../../shared/errors';
import { IVerificationRepository } from '../domain/IVerificationRepository';
import { UploadVerificationInput, VerificationDTO, toVerificationDTO } from './dtos';

const DEFAULT_TYPE = 'KYC';

export class UploadVerification {
	constructor(private readonly verificationRepository: IVerificationRepository) {}

	async execute(accountId: string, input: UploadVerificationInput): Promise<VerificationDTO> {
		const documentUrl = typeof input.documentUrl === 'string' ? input.documentUrl.trim() : '';

		if (documentUrl.length === 0) {
			throw new ValidationError('Debes enviar la URL del documento (documentUrl).');
		}

		const type =
			typeof input.type === 'string' && input.type.trim().length > 0
				? input.type.trim()
				: DEFAULT_TYPE;

		const verification = await this.verificationRepository.create({
			accountId,
			type,
			documentUrl,
			status: 'PENDING',
		});

		return toVerificationDTO(verification);
	}
}
