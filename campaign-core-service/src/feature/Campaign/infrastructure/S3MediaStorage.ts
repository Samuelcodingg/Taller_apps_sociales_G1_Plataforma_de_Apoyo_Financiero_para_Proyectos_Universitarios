import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { config } from '../../../shared/config';
import { IMediaStorage, UploadMediaInput } from '../domain/IMediaStorage';

// Adaptador de produccion: sube la multimedia a S3 con ACL implicito de bucket y
// devuelve la URL publica del objeto. (La multimedia de campaña es publica.)
export class S3MediaStorage implements IMediaStorage {
	private readonly client: S3Client;
	private readonly bucket: string | undefined;

	constructor(client?: S3Client) {
		this.client = client ?? new S3Client({ region: config.aws.region });
		this.bucket = config.aws.campaignBucket;
	}

	async uploadAndGetUrl(input: UploadMediaInput): Promise<string> {
		if (!this.bucket) {
			throw new Error('CAMPAIGN_BUCKET no esta configurado para subir multimedia a S3.');
		}

		const key = `campaigns/${input.campaignId}/${randomUUID()}`;
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: input.buffer,
				ContentType: input.contentType,
			}),
		);

		return `https://${this.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
	}
}
