// Value Object que representa el documento PDF de verificacion (KYC) recibido en
// el registro. Su unica via de construccion (create) valida el archivo y lanza un
// Error si es invalido; el entrypoint traduce ese Error a un HTTP 400. Asi la
// validacion del PDF ocurre ANTES de crear la cuenta.

// Cabecera magica de todo PDF: los bytes "%PDF" (0x25 0x50 0x44 0x46).
const PDF_MAGIC = Buffer.from('%PDF');

export interface RawPdfFile {
	buffer: Buffer;
	mimetype: string;
	originalName: string;
}

export class PdfDocument {
	private constructor(
		readonly buffer: Buffer,
		readonly mimetype: string,
		readonly originalName: string,
	) {}

	static create(file: RawPdfFile | undefined): PdfDocument {
		if (!file || !file.buffer || file.buffer.length === 0) {
			throw new Error('Debes adjuntar el documento PDF de verificacion.');
		}

		if (file.mimetype !== 'application/pdf') {
			throw new Error('El documento debe ser un archivo PDF (application/pdf).');
		}

		// Validacion por contenido: comprobamos la firma del archivo, no solo el
		// mimetype declarado por el cliente (que es facilmente falsificable).
		const header = file.buffer.subarray(0, PDF_MAGIC.length);
		if (!header.equals(PDF_MAGIC)) {
			throw new Error('El archivo enviado no es un PDF valido.');
		}

		return new PdfDocument(file.buffer, file.mimetype, file.originalName);
	}
}
