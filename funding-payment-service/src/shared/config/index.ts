// Shared Kernel: configuracion global y lectura centralizada de process.env.
export interface AppConfig {
	databaseUrl: string | undefined;
	jwtAccessSecret: string;
	// Secreto compartido para validar webhooks de la pasarela (cabecera).
	webhookSecret: string;
}

export const config: AppConfig = {
	databaseUrl: process.env.DATABASE_URL,
	jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'local-access-secret',
	webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? 'local-webhook-secret',
};

export const assertDatabaseUrl = (): string => {
	if (!config.databaseUrl) {
		throw new Error('DATABASE_URL no esta configurada para inicializar PrismaClient.');
	}
	return config.databaseUrl;
};
