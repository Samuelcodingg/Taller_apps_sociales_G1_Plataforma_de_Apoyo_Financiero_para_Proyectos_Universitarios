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
