// Shared Kernel: configuracion global y lectura centralizada de process.env.

export interface AwsConfig {
	region: string;
	// Bucket S3 para multimedia de campañas. Si no esta definido, se usa
	// almacenamiento local en disco (desarrollo sin credenciales AWS).
	campaignBucket: string | undefined;
	documentUrlTtlSeconds: number;
}

export interface AppConfig {
	databaseUrl: string | undefined;
	jwtAccessSecret: string;
	aws: AwsConfig;
}

export const config: AppConfig = {
	databaseUrl: process.env.DATABASE_URL,
	jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'local-access-secret',
	aws: {
		region: process.env.AWS_REGION ?? 'us-east-2',
		campaignBucket: process.env.CAMPAIGN_BUCKET,
		documentUrlTtlSeconds: Number(process.env.DOCUMENT_URL_TTL_SECONDS ?? 86400),
	},
};

export const assertDatabaseUrl = (): string => {
	if (!config.databaseUrl) {
		throw new Error('DATABASE_URL no esta configurada para inicializar PrismaClient.');
	}
	return config.databaseUrl;
};
