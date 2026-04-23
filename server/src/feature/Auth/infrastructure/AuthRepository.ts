import { Account as PrismaAccount, PrismaClient, Role as PrismaRole } from '.prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IAuthRepository, StoreRefreshTokenInput } from '../domain/IAuthRepository';
import { CreateLocalUserInput, CreateOAuthUserInput, User } from '../domain/User';

export class AuthRepository implements IAuthRepository {
	private readonly prisma: PrismaClient;

	constructor(prismaClient?: PrismaClient) {
		this.prisma = prismaClient ?? new PrismaClient();
	}

	async findByEmail(email: string): Promise<User | null> {
		const account = await this.prisma.account.findUnique({
			where: { email },
		});

		return account ? this.toDomainUser(account) : null;
	}

	async findById(userId: string): Promise<User | null> {
		const id = Number(userId);
		if (Number.isNaN(id)) {
			return null;
		}

		const account = await this.prisma.account.findUnique({
			where: { id },
		});

		return account ? this.toDomainUser(account) : null;
	}

	async createLocalUser(input: CreateLocalUserInput): Promise<User> {
		const createdAccount = await this.prisma.account.create({
			data: {
				email: input.email,
				password: input.passwordHash,
				role: input.role as PrismaRole,
				emailVerified: false,
			},
		});

		return this.toDomainUser(createdAccount);
	}

	async createOAuthUser(input: CreateOAuthUserInput): Promise<User> {
		const createdAccount = await this.prisma.account.create({
			data: {
				email: input.email,
				password: '',
				role: input.role as PrismaRole,
				emailVerified: true,
			},
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

		const id = Number(rawUserId);
		if (Number.isNaN(id)) {
			return null;
		}

		const account = await this.prisma.account.findUnique({
			where: { id },
		});

		return account ? this.toDomainUser(account) : null;
	}

	async revokeRefreshToken(token: string): Promise<void> {
		void token;
	}

	private toDomainUser(account: PrismaAccount): User {
		return {
			id: String(account.id),
			email: account.email,
			passwordHash: account.password,
			role: account.role as User['role'],
			provider: 'LOCAL',
			providerId: null,
			createdAt: account.createdAt,
			updatedAt: account.createdAt,
		};
	}
}
