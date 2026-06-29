import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { randomUUID } from 'node:crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IAuthRepository, StoreRefreshTokenInput } from '../domain/IAuthRepository';
import { CreateLocalUserInput, CreateOAuthUserInput, AuthProvider, User } from '../domain/User';
import { Role } from '../domain/Role';
import { databaseAdapterConfig } from '../../../shared/config';

// La cuenta siempre se carga junto a sus roles (tabla account_roles -> roles),
// ya que en esta base de datos el rol no vive como columna de `account`.
const accountWithRoles = Prisma.validator<Prisma.AccountDefaultArgs>()({
	include: { account_roles: { include: { roles: true } } },
});

type AccountWithRoles = Prisma.AccountGetPayload<typeof accountWithRoles>;

export class AuthRepository implements IAuthRepository {
	private readonly prisma: PrismaClient;

	constructor(prismaClient?: PrismaClient) {
		if (prismaClient) {
			this.prisma = prismaClient;
			return;
		}

		const adapter = new PrismaMariaDb(databaseAdapterConfig());
		this.prisma = new PrismaClient({ adapter });
	}

	async findByEmail(email: string): Promise<User | null> {
		const account = await this.prisma.account.findUnique({
			where: { email },
			...accountWithRoles,
		});

		return account ? this.toDomainUser(account) : null;
	}

	async findById(userId: string): Promise<User | null> {
		const account = await this.prisma.account.findUnique({
			where: { id: userId },
			...accountWithRoles,
		});

		return account ? this.toDomainUser(account) : null;
	}

	async createLocalUser(input: CreateLocalUserInput): Promise<User> {
		return this.createAccountWithRole({
			email: input.email,
			password: input.passwordHash,
			provider: 'LOCAL',
			role: input.role,
			emailVerified: false,
			names: input.names,
			surnames: input.surnames,
		});
	}

	async createOAuthUser(input: CreateOAuthUserInput): Promise<User> {
		return this.createAccountWithRole({
			email: input.email,
			password: '',
			provider: input.provider,
			role: input.role,
			emailVerified: true,
		});
	}

	async storeRefreshToken(input: StoreRefreshTokenInput): Promise<void> {
		void input;
	}

	async updateLastLogin(userId: string): Promise<void> {
		await this.prisma.account.update({
			where: { id: userId },
			data: { last_login_at: new Date() },
		});
	}

	async findUserByRefreshToken(token: string): Promise<User | null> {
		const decoded = jwt.decode(token) as JwtPayload | null;
		const rawUserId = decoded?.userId;

		if (typeof rawUserId !== 'string' || rawUserId.length === 0) {
			return null;
		}

		return this.findById(rawUserId);
	}

	async revokeRefreshToken(token: string): Promise<void> {
		void token;
	}

	// Crea la cuenta y la asocia con el rol correspondiente en account_roles,
	// todo dentro de una transaccion para no dejar cuentas sin rol.
	private async createAccountWithRole(params: {
		email: string;
		password: string;
		provider: AuthProvider;
		role: Role;
		emailVerified: boolean;
		names?: string;
		surnames?: string;
	}): Promise<User> {
		const account = await this.prisma.$transaction(async (tx) => {
			const role = await tx.roles.findUnique({ where: { name: params.role } });
			if (!role) {
				throw new Error(`El rol "${params.role}" no existe en la base de datos.`);
			}

			const now = new Date();
			const created = await tx.account.create({
				data: {
					id: randomUUID(),
					email: params.email,
					password: params.password,
					provider: params.provider,
					emailVerified: params.emailVerified,
					createdAt: now,
					account_roles: {
						create: {
							id_role: role.id_role,
							created_at: now,
						},
					},
					// Perfil inicial basico vinculado al id_account, en la misma transaccion.
					profile: {
						create: {
							id: randomUUID(),
							names: params.names ?? '',
							surnames: params.surnames ?? '',
							updated_at: now,
						},
					},
				},
				...accountWithRoles,
			});

			return created;
		});

		return this.toDomainUser(account);
	}

	private toDomainUser(account: AccountWithRoles): User {
		const roleName = account.account_roles[0]?.roles.name ?? null;
		const role = (roleName as Role) ?? Role.DONOR;

		return {
			id: account.id,
			email: account.email,
			passwordHash: account.password,
			role,
			provider: (account.provider as AuthProvider) ?? 'LOCAL',
			providerId: null,
			createdAt: account.createdAt,
			updatedAt: account.createdAt,
		};
	}
}
