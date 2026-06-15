// Puerto de salida: publica eventos de verificacion hacia un bus/cola asincrono
// (p. ej. AWS SQS) para que un servicio de IA procese el documento sin bloquear
// la respuesta HTTP. Las implementaciones viven en infrastructure/.
export interface VerificationRequestedEvent {
	verificationId: string;
	accountId: string;
	documentUrl: string;
}

export interface IVerificationEventPublisher {
	publishVerificationRequested(event: VerificationRequestedEvent): Promise<void>;
}
