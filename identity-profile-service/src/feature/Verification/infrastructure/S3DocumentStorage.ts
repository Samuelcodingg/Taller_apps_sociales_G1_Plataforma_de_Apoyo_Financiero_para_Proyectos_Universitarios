import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { config } from '../../../shared/config';
import { IDocumentStorage, UploadDocumentInput } from '../domain/IDocumentStorage';

// Adaptador de salida: sube el documento KYC a S3 (objeto PRIVADO) y devuelve una
// URL prefirmada de descarga (presigned GET). Asi el servicio de IA puede
// descargar el archivo por HTTP sin exponerlo publicamente.
export class S3DocumentStorage implements IDocumentStorage {
	private readonly client: S3Client;
	private readonly bucket: string | undefined;

	constructor(client?: S3Client) {
		this.client = client ?? new S3Client({ region: config.aws.region });
		this.bucket = config.aws.kycBucket;
	}

	async uploadAndGetDownloadUrl(input: UploadDocumentInput): Promise<string> {
		if (!this.bucket) {
			throw new Error('KYC_BUCKET no esta configurado para subir documentos a S3.');
		}

		const extension = this.extensionFor(input.originalName, input.contentType);
		const key = `kyc/${input.accountId}/${randomUUID()}${extension}`;

		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: input.buffer,
				ContentType: input.contentType,
			}),
		);

		// URL temporal de descarga (la usa el servicio de IA para obtener el archivo).
		return getSignedUrl(
			this.client,
			new GetObjectCommand({ Bucket: this.bucket, Key: key }),
			{ expiresIn: config.aws.documentUrlTtlSeconds },
		);
	}

	private extensionFor(originalName: string, contentType: string): string {
		const fromName = originalName.includes('.')
			? originalName.slice(originalName.lastIndexOf('.')).toLowerCase()
			: '';
		if (fromName) return fromName;
		if (contentType === 'application/pdf') return '.pdf';
		if (contentType === 'image/png') return '.png';
		if (contentType === 'image/jpeg') return '.jpg';
		return '';
	}
}
