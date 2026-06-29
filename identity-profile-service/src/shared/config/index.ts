// Shared Kernel: configuracion global y validacion de variables de entorno.
// Centraliza la lectura de process.env para que las capas de infraestructura
// no accedan directamente a las variables de entorno.

export interface JwtConfig {
	accessSecret: string;
	refreshSecret: string;
	accessTtlSeconds: number;
	refreshTtlSeconds: number;
}

export interface AwsConfig {
	region: string;
	verificationQueueUrl: string | undefined;
	kycBucket: string | undefined;
	// Vigencia (segundos) de la URL prefirmada de descarga del documento KYC que
	// se envia al servicio de IA. Debe cubrir el tiempo de procesamiento + reintentos.
	documentUrlTtlSeconds: number;
}

export interface AppConfig {
	databaseUrl: string | undefined;
	jwt: JwtConfig;
	aws: AwsConfig;
}

export const config: AppConfig = {
	databaseUrl: process.env.DATABASE_URL,
	jwt: {
		accessSecret: process.env.JWT_ACCESS_SECRET ?? 'local-access-secret',
		refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'local-refresh-secret',
		accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
		refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 604800),
	},
	aws: {
		region: process.env.AWS_REGION ?? 'us-east-2',
		verificationQueueUrl: process.env.VERIFICATION_QUEUE_URL,
		kycBucket: process.env.KYC_BUCKET,
		documentUrlTtlSeconds: Number(process.env.DOCUMENT_URL_TTL_SECONDS ?? 86400),
	},
};

// Valida que las variables de entorno criticas esten presentes.
// Lanza un error temprano si falta alguna requerida en tiempo de ejecucion.
export const assertDatabaseUrl = (): string => {
	if (!config.databaseUrl) {
		throw new Error('DATABASE_URL no esta configurada para inicializar PrismaClient.');
	}

	return config.databaseUrl;
};

// Config del pool de MariaDB para el driver adapter de Prisma. Se parsea la
// DATABASE_URL y se fuerza un pool PEQUENO: en Lambda hay muchas instancias y
// varios microservicios compartiendo una misma RDS de desarrollo; un pool grande
// por contenedor agota las conexiones de la RDS y provoca "pool timeout".
export const databaseAdapterConfig = () => {
	const url = new URL(assertDatabaseUrl());
	return {
		host: url.hostname,
		port: url.port ? Number(url.port) : 3306,
		user: decodeURIComponent(url.username),
		password: decodeURIComponent(url.password),
		database: url.pathname.replace(/^\//, ''),
		connectionLimit: 3, // pocas conexiones por contenedor
		idleTimeout: 60, // s: libera conexiones ociosas
		acquireTimeout: 20000, // ms: margen para el cold start
	};
};
