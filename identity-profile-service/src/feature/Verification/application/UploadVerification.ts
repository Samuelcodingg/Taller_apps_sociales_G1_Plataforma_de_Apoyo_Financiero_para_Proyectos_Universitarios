import { ValidationError } from '../../../shared/errors';
import { IVerificationRepository } from '../domain/IVerificationRepository';
import { IVerificationEventPublisher } from '../domain/IVerificationEventPublisher';
import { UploadVerificationInput, VerificationDTO, toVerificationDTO } from './dtos';

const DEFAULT_TYPE = 'KYC';

export class UploadVerification {
	constructor(
		private readonly verificationRepository: IVerificationRepository,
		// Publicador opcional: si no se inyecta, el flujo sigue funcionando sin
		// disparar el procesamiento asincrono (util en tests y entornos locales).
		private readonly eventPublisher?: IVerificationEventPublisher,
	) {}

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

		// Disparo asincrono hacia el servicio de IA via SQS. El documento ya quedo
		// guardado, asi que un fallo de red al publicar NO debe romper la respuesta:
		// se registra el error y se devuelve 201 igual.
		if (this.eventPublisher) {
			try {
				await this.eventPublisher.publishVerificationRequested({
					verificationId: verification.id,
					accountId: verification.accountId ?? accountId,
					documentUrl: verification.documentUrl,
				});
			} catch (error) {
				console.error('No se pudo publicar el evento de verificacion en SQS:', error);
			}
		}

		return toVerificationDTO(verification);
	}
}
