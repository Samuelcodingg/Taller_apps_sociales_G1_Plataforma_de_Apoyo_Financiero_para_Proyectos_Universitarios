import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthTokenPayload, ITokenService } from '../domain/ITokenService';
import { config } from '../../../shared/config';

export class JwtService implements ITokenService {
	private readonly accessSecret = config.jwt.accessSecret;

	private readonly refreshSecret = config.jwt.refreshSecret;

	private readonly accessTtlSeconds = config.jwt.accessTtlSeconds;

	private readonly refreshTtlSeconds = config.jwt.refreshTtlSeconds;

	issueTokens(payload: AuthTokenPayload) {
		const accessToken = jwt.sign(payload, this.accessSecret, {
			expiresIn: this.accessTtlSeconds,
		});

		const refreshToken = jwt.sign(payload, this.refreshSecret, {
			expiresIn: this.refreshTtlSeconds,
		});

		return { accessToken, refreshToken };
	}

	verifyRefreshToken(token: string): AuthTokenPayload {
		const decoded = jwt.verify(token, this.refreshSecret) as JwtPayload;

		if (!decoded.userId || !decoded.email || !decoded.role) {
			throw new Error('El refresh token no contiene datos validos.');
		}

		return {
			userId: String(decoded.userId),
			email: String(decoded.email),
			role: decoded.role as AuthTokenPayload['role'],
		};
	}

	getRefreshTokenExpiryDate(): Date {
		return new Date(Date.now() + this.refreshTtlSeconds * 1000);
	}
}
