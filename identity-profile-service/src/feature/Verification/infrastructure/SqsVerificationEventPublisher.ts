import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { NodeHttpHandler } from '@smithy/node-http-handler';
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
		this.client =
			client ??
			new SQSClient({
				region: config.aws.region,
				// Limita los reintentos y pone timeouts de conexion/respuesta para que
				// un endpoint de SQS que no responde NO cuelgue la peticion HTTP hasta el
				// timeout de la Lambda (30s). Si SQS no contesta, abortamos rapido, el
				// caso de uso captura el error y devuelve 201 igual.
				maxAttempts: 2,
				requestHandler: new NodeHttpHandler({
					connectionTimeout: 2000,
					requestTimeout: 3000,
				}),
			});
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
