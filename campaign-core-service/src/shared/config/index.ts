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

// Config del pool de MariaDB para el driver adapter de Prisma. Pool PEQUENO: en
// Lambda hay muchas instancias y varios microservicios compartiendo la misma RDS
// de desarrollo; un pool grande por contenedor agota las conexiones ("pool timeout").
export const databaseAdapterConfig = () => {
	const url = new URL(assertDatabaseUrl());
	return {
		host: url.hostname,
		port: url.port ? Number(url.port) : 3306,
		user: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		database: url.pathname.replace(/^\//, ''),
		connectionLimit: 3,
		idleTimeout: 60,
		acquireTimeout: 20000,
	};
};
