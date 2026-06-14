import { Role } from './Role';
import { AuthTokens } from './User';

export interface AuthTokenPayload {
	userId: string;
	email: string;
	role: Role;
}

export interface ITokenService {
	issueTokens(payload: AuthTokenPayload): AuthTokens;
	verifyRefreshToken(token: string): AuthTokenPayload;
	getRefreshTokenExpiryDate(): Date;
}
