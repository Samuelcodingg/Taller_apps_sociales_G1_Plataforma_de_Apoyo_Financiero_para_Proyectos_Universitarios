import { PDFParse } from 'pdf-parse';
import { IPdfTextExtractor } from '../domain/IPdfTextExtractor';

// Adaptador de salida: extrae el texto de un PDF con la libreria pdf-parse (JS
// puro, funciona en Node y en Lambda). Implementa el puerto IPdfTextExtractor.
export class PdfParseTextExtractor implements IPdfTextExtractor {
	async extractText(buffer: Buffer): Promise<string> {
		const parser = new PDFParse({ data: buffer });
		try {
			const result = await parser.getText();
			return result.text;
		} finally {
			// Libera los recursos internos del parser.
			await parser.destroy();
		}
	}
}
