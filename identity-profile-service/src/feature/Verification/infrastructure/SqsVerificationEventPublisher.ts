import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { config } from '../../../shared/config';
import {
	IVerificationEventPublisher,
	VerificationRequestedEvent,
} from '../domain/IVerificationEventPublisher';

// Adaptador de salida: publica el evento en AWS SQS para procesamiento asincrono
// por el servicio de IA. No debe hacer fallar el flujo HTTP (el caso de uso
// captura los errores); aqui solo se encarga del envio.
export class SqsVerificationEventPublisher implements IVerificationEventPublisher {
	private readonly client: SQSClient;
	private readonly queueUrl: string | undefined;

	constructor(client?: SQSClient) {
		this.client = client ?? new SQSClient({ region: config.aws.region });
		this.queueUrl = config.aws.verificationQueueUrl;
	}

	async publishVerificationRequested(event: VerificationRequestedEvent): Promise<void> {
		if (!this.queueUrl) {
			throw new Error('VERIFICATION_QUEUE_URL no esta configurada para publicar en SQS.');
		}

		await this.client.send(
			new SendMessageCommand({
				QueueUrl: this.queueUrl,
				MessageBody: JSON.stringify(event),
			}),
		);
	}
}
