// Puerto de salida: extrae el texto plano de un PDF para poder validar su
// contenido (p. ej. el reporte de matricula). La implementacion concreta vive en
// infrastructure/ (pdf-parse).
export interface IPdfTextExtractor {
	extractText(buffer: Buffer): Promise<string>;
}
