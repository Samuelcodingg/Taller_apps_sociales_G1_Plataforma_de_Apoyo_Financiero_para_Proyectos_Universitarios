import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { IDocumentStorage, UploadDocumentInput } from '../domain/IDocumentStorage';

// Adaptador de salida para DESARROLLO LOCAL: guarda el documento KYC en el disco
// (carpeta uploads/) en vez de S3, y devuelve una URL http://localhost que el
// servidor sirve de forma estatica. Asi todo el flujo de registro funciona sin
// credenciales AWS. En produccion se usa S3DocumentStorage (cuando hay KYC_BUCKET).
export class LocalDocumentStorage implements IDocumentStorage {
	// Carpeta fisica donde se escriben los archivos (relativa a la raiz del proceso).
	static readonly UPLOAD_DIR = join(process.cwd(), 'uploads', 'kyc');
	// Ruta HTTP publica bajo la que app.ts sirve esa carpeta de forma estatica.
	static readonly PUBLIC_PATH = '/uploads/kyc';

	private readonly baseUrl: string;

	constructor(baseUrl?: string) {
		const port = process.env.PORT ?? '3000';
		this.baseUrl = baseUrl ?? `http://localhost:${port}`;
	}

	async uploadAndGetDownloadUrl(input: UploadDocumentInput): Promise<string> {
		const dir = join(LocalDocumentStorage.UPLOAD_DIR, input.accountId);
		await mkdir(dir, { recursive: true });

		const fileName = `${randomUUID()}${this.extensionFor(input.originalName, input.contentType)}`;
		await writeFile(join(dir, fileName), input.buffer);

		return `${this.baseUrl}${LocalDocumentStorage.PUBLIC_PATH}/${input.accountId}/${fileName}`;
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
