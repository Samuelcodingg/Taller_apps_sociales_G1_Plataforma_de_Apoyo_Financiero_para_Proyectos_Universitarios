import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IAuthRepository, StoreRefreshTokenInput } from '../domain/IAuthRepository';
import { CreateLocalUserInput, CreateOAuthUserInput, User } from '../domain/User';
import { Role } from '../domain/Role';

const ACCOUNT_ROLES_INCLUDE = {
	accountRoles: {
		include: { role: true },
		orderBy: { createdAt: 'asc' as const },
	},
};

interface AccountWithRolesRow {
	id: string;
	email: string;
	password: string;
	provider: string;
	createdAt: Date;
	accountRoles: Array<{
		role: {
			name: string;
		};
	}>;
}

interface RoleRow {
	id: string;
}

export class AuthRepository implements IAuthRepository {
	private readonly prisma: PrismaClient;

	constructor(prismaClient?: PrismaClient) {
		if (prismaClient) {
			this.prisma = prismaClient;
			return;
		}

		const databaseUrl = process.env.DATABASE_URL;
		if (!databaseUrl) {
			throw new Error('DATABASE_URL no esta configurada para inicializar PrismaClient.');
		}

		const adapter = new PrismaMariaDb(databaseUrl);
		this.prisma = new PrismaClient({ adapter });
	}

	private get accountQuery() {
		return this.prisma.account as unknown as {
			findUnique(args: unknown): Promise<AccountWithRolesRow | null>;
			create(args: unknown): Promise<AccountWithRolesRow>;
		};
	}

	private get roleQuery() {
		return (this.prisma as unknown as { role: { upsert(args: unknown): Promise<RoleRow> } }).role;
	}

	async findByEmail(email: string): Promise<User | null> {
		const account = await this.accountQuery.findUnique({
			where: { email },
			include: ACCOUNT_ROLES_INCLUDE,
		});

		return account ? this.toDomainUser(account) : null;
	}

	async findById(userId: string): Promise<User | null> {
		const account = await this.accountQuery.findUnique({
			where: { id: userId },
			include: ACCOUNT_ROLES_INCLUDE,
		});

		return account ? this.toDomainUser(account) : null;
	}

	async createLocalUser(input: CreateLocalUserInput): Promise<User> {
		const role = await this.ensureRoleExists(input.role);

		const createdAccount = await this.accountQuery.create({
			data: {
				email: input.email,
				password: input.passwordHash,
				emailVerified: false,
				provider: 'LOCAL',
				accountRoles: {
					create: {
						roleId: role.id,
					},
				},
			},
			include: ACCOUNT_ROLES_INCLUDE,
		});

		return this.toDomainUser(createdAccount);
	}

	async createOAuthUser(input: CreateOAuthUserInput): Promise<User> {
		const role = await this.ensureRoleExists(input.role);

		const createdAccount = await this.accountQuery.create({
			data: {
				email: input.email,
				password: '',
				emailVerified: true,
				provider: input.provider,
				accountRoles: {
					create: {
						roleId: role.id,
					},
				},
			},
			include: ACCOUNT_ROLES_INCLUDE,
		});

		return this.toDomainUser(createdAccount);
	}

	async storeRefreshToken(input: StoreRefreshTokenInput): Promise<void> {
		void input;
	}

	async findUserByRefreshToken(token: string): Promise<User | null> {
		const decoded = jwt.decode(token) as JwtPayload | null;
		const rawUserId = decoded?.userId;

		if (!rawUserId) {
			return null;
		}

		const id = String(rawUserId);

		const account = await this.accountQuery.findUnique({
			where: { id },
			include: ACCOUNT_ROLES_INCLUDE,
		});

		return account ? this.toDomainUser(account) : null;
	}

	async revokeRefreshToken(token: string): Promise<void> {
		void token;
	}

	private async ensureRoleExists(roleName: Role) {
		return this.roleQuery.upsert({
			where: { name: roleName },
			update: {},
			create: {
				name: roleName,
			},
		});
	}

	private toDomainUser(account: AccountWithRolesRow): User {
		const firstRole = account.accountRoles[0]?.role?.name;
		const normalizedRole = this.toDomainRole(firstRole);

		return {
			id: String(account.id),
			email: account.email,
			passwordHash: account.password,
			role: normalizedRole,
			provider: this.toDomainProvider(account.provider),
			providerId: null,
			createdAt: account.createdAt,
			updatedAt: account.createdAt,
		};
	}

	private toDomainRole(roleName: string | undefined): User['role'] {
		if (roleName === Role.CREATOR || roleName === Role.DONOR || roleName === Role.COMPANY || roleName === Role.ADMIN) {
			return roleName;
		}

		return Role.DONOR;
	}

	private toDomainProvider(provider: string): User['provider'] {
		if (provider === 'GOOGLE' || provider === 'LINKEDIN' || provider === 'LOCAL') {
			return provider;
		}

		return 'LOCAL';
	}
}
