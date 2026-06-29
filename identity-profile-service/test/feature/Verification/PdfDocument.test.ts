import { PdfDocument } from '../../../src/feature/Verification/domain/PdfDocument';

const validPdfBuffer = (): Buffer =>
	Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.from('contenido del pdf')]);

describe('PdfDocument', () => {
	it('acepta un PDF valido (mimetype + firma %PDF)', () => {
		const doc = PdfDocument.create({
			buffer: validPdfBuffer(),
			mimetype: 'application/pdf',
			originalName: 'kyc.pdf',
		});

		expect(doc.mimetype).toBe('application/pdf');
		expect(doc.originalName).toBe('kyc.pdf');
	});

	it('rechaza cuando no se adjunta archivo', () => {
		expect(() => PdfDocument.create(undefined)).toThrow(/adjuntar el documento PDF/i);
	});

	it('rechaza un archivo vacio', () => {
		expect(() =>
			PdfDocument.create({
				buffer: Buffer.alloc(0),
				mimetype: 'application/pdf',
				originalName: 'vacio.pdf',
			}),
		).toThrow(/adjuntar el documento PDF/i);
	});

	it('rechaza un mimetype que no es application/pdf', () => {
		expect(() =>
			PdfDocument.create({
				buffer: validPdfBuffer(),
				mimetype: 'image/png',
				originalName: 'foto.png',
			}),
		).toThrow(/debe ser un archivo PDF/i);
	});

	it('rechaza un archivo con mimetype pdf pero contenido que NO es PDF (firma falsa)', () => {
		expect(() =>
			PdfDocument.create({
				buffer: Buffer.from('esto no es un pdf de verdad'),
				mimetype: 'application/pdf',
				originalName: 'falso.pdf',
			}),
		).toThrow(/no es un PDF valido/i);
	});
});
