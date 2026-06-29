import { Role } from './Role';

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'LINKEDIN';

export interface User {
	id: string;
	email: string;
	passwordHash: string | null;
	role: Role;
	provider: AuthProvider;
	providerId: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface PublicUser {
	id: string;
	email: string;
	role: Role;
	provider: AuthProvider;
	createdAt: Date;
	// Datos del perfil que se devuelven al crear la cuenta (donante). Opcionales
	// porque otros flujos (login, creador) no los incluyen aqui.
	names?: string;
	lastNames?: string;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface AuthResult extends AuthTokens {
	user: PublicUser;
}

export interface CreateLocalUserInput {
	email: string;
	passwordHash: string;
	role: Role;
	// Nombres y apellidos para inicializar el perfil (se usan en el registro de
	// donante). Si no se envian, el perfil se crea con valores vacios.
	names?: string;
	surnames?: string;
}

export interface OAuthProfile {
	email: string;
	providerId: string;
}

export interface CreateOAuthUserInput {
	email: string;
	provider: Exclude<AuthProvider, 'LOCAL'>;
	providerId: string;
	role: Role;
}

export const toPublicUser = (user: User): PublicUser => ({
	id: user.id,
	email: user.email,
	role: user.role,
	provider: user.provider,
	createdAt: user.createdAt,
});
