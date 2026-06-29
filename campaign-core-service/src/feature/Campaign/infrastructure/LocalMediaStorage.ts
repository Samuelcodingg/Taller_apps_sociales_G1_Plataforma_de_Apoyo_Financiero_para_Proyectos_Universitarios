import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { IMediaStorage, UploadMediaInput } from '../domain/IMediaStorage';

// Adaptador para DESARROLLO LOCAL: guarda la multimedia de la campaña en disco y
// devuelve una URL http://localhost servida estaticamente por app.ts.
export class LocalMediaStorage implements IMediaStorage {
	static readonly UPLOAD_DIR = join(process.cwd(), 'uploads', 'campaigns');
	static readonly PUBLIC_PATH = '/uploads/campaigns';

	private readonly baseUrl: string;

	constructor(baseUrl?: string) {
		const port = process.env.PORT ?? '3001';
		this.baseUrl = baseUrl ?? `http://localhost:${port}`;
	}

	async uploadAndGetUrl(input: UploadMediaInput): Promise<string> {
		const dir = join(LocalMediaStorage.UPLOAD_DIR, input.campaignId);
		await mkdir(dir, { recursive: true });

		const fileName = `${randomUUID()}${this.extensionFor(input.originalName, input.contentType)}`;
		await writeFile(join(dir, fileName), input.buffer);

		return `${this.baseUrl}${LocalMediaStorage.PUBLIC_PATH}/${input.campaignId}/${fileName}`;
	}

	private extensionFor(originalName: string, contentType: string): string {
		const fromName = originalName.includes('.')
			? originalName.slice(originalName.lastIndexOf('.')).toLowerCase()
			: '';
		if (fromName) return fromName;
		if (contentType === 'image/png') return '.png';
		if (contentType === 'image/jpeg') return '.jpg';
		if (contentType === 'video/mp4') return '.mp4';
		return '';
	}
}
