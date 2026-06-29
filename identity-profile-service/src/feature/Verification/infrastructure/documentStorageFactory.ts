import { config } from '../../../shared/config';
import { IDocumentStorage } from '../domain/IDocumentStorage';
import { S3DocumentStorage } from './S3DocumentStorage';
import { LocalDocumentStorage } from './LocalDocumentStorage';

// Selecciona el adaptador de almacenamiento del documento KYC segun el entorno:
// - Si KYC_BUCKET esta definido -> S3 (despliegue real).
// - Si no -> almacenamiento local en disco (desarrollo sin credenciales AWS).
export const createDocumentStorage = (): IDocumentStorage => {
	if (config.aws.kycBucket) {
		return new S3DocumentStorage();
	}
	console.warn(
		'[storage] KYC_BUCKET no definido: usando almacenamiento LOCAL en disco (solo desarrollo).',
	);
	return new LocalDocumentStorage();
};
