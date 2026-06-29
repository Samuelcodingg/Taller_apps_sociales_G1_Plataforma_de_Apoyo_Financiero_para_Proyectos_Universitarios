// Puerto de salida: guarda el archivo multimedia de la campaña y devuelve una URL
// accesible por HTTP. Implementaciones: S3 (prod) o disco local (desarrollo).
export interface UploadMediaInput {
	campaignId: string;
	buffer: Buffer;
	contentType: string;
	originalName: string;
}

export interface IMediaStorage {
	uploadAndGetUrl(input: UploadMediaInput): Promise<string>;
}
