import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedPayload, IAccessTokenVerifier } from '../http/authMiddleware';

// Verifica el access token Bearer usando el MISMO secreto que firma
// identity-profile-service. Satisface el puerto IAccessTokenVerifier del
// middleware de autenticacion compartido.
export class JwtVerifier implements IAccessTokenVerifier {
	private readonly accessSecret = config.jwtAccessSecret;

	verifyAccessToken(token: string): AuthenticatedPayload {
		const decoded = jwt.verify(token, this.accessSecret) as JwtPayload;

		if (!decoded.userId || !decoded.email || !decoded.role) {
			throw new Error('El access token no contiene datos validos.');
		}

		return {
			userId: String(decoded.userId),
			email: String(decoded.email),
			role: String(decoded.role),
		};
	}
}
