// Puerto de salida: almacena el documento KYC y devuelve una URL DESCARGABLE
// para que el servicio de IA (consumidor de SQS) pueda obtenerlo. Las
// implementaciones viven en infrastructure/ (p. ej. S3 con URL prefirmada).
export interface UploadDocumentInput {
	accountId: string;
	buffer: Buffer;
	contentType: string;
	originalName: string;
}

export interface IDocumentStorage {
	// Guarda el archivo y retorna una URL temporal descargable por HTTP GET.
	uploadAndGetDownloadUrl(input: UploadDocumentInput): Promise<string>;
}
