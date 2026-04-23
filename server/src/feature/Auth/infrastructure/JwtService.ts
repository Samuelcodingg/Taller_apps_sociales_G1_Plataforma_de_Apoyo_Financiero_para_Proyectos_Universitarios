import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthTokenPayload, ITokenService } from '../domain/ITokenService';

export class JwtService implements ITokenService {
	private readonly accessSecret = process.env.JWT_ACCESS_SECRET ?? 'local-access-secret';

	private readonly refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'local-refresh-secret';

	private readonly accessTtlSeconds = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900);

	private readonly refreshTtlSeconds = Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 604800);

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
