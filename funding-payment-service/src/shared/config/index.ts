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
