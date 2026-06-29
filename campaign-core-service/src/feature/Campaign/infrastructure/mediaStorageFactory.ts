import { config } from '../../../shared/config';
import { IMediaStorage } from '../domain/IMediaStorage';
import { S3MediaStorage } from './S3MediaStorage';
import { LocalMediaStorage } from './LocalMediaStorage';

// S3 si hay CAMPAIGN_BUCKET; si no, disco local (desarrollo sin AWS).
export const createMediaStorage = (): IMediaStorage => {
	if (config.aws.campaignBucket) {
		return new S3MediaStorage();
	}
	console.warn(
		'[storage] CAMPAIGN_BUCKET no definido: usando almacenamiento LOCAL en disco (solo desarrollo).',
	);
	return new LocalMediaStorage();
};
