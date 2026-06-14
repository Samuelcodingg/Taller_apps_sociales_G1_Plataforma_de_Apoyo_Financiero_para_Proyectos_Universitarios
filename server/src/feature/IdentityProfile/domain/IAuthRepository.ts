import { CreateLocalUserInput, CreateOAuthUserInput, User } from './User';

export interface StoreRefreshTokenInput {
	userId: string;
	token: string;
	expiresAt: Date;
}

export interface IAuthRepository {
	findByEmail(email: string): Promise<User | null>;
	findById(userId: string): Promise<User | null>;
	createLocalUser(input: CreateLocalUserInput): Promise<User>;
	createOAuthUser(input: CreateOAuthUserInput): Promise<User>;
	storeRefreshToken(input: StoreRefreshTokenInput): Promise<void>;
	findUserByRefreshToken(token: string): Promise<User | null>;
	revokeRefreshToken(token: string): Promise<void>;
}
