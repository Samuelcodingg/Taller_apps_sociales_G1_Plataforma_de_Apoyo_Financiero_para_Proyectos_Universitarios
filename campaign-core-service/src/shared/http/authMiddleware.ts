// Shared Kernel: middleware de autenticacion para rutas protegidas.
// Extrae y valida el access token (Bearer) y expone el payload en req.auth.
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedPayload {
	userId: string;
	email: string;
	role: string;
}

// Puerto minimo que necesita el middleware: verificar un access token.
// JwtService (ITokenService) lo satisface sin acoplar a una feature concreta.
export interface IAccessTokenVerifier {
	verifyAccessToken(token: string): AuthenticatedPayload;
}

export const createAuthMiddleware = (verifier: IAccessTokenVerifier) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		const header = req.headers.authorization;

		if (!header || !header.startsWith('Bearer ')) {
			res.status(401).json({ message: 'Token de acceso requerido.' });
			return;
		}

		const token = header.slice('Bearer '.length).trim();

		try {
			req.auth = verifier.verifyAccessToken(token);
			next();
		} catch {
			res.status(401).json({ message: 'Token de acceso invalido o expirado.' });
		}
	};
};

// Auth OPCIONAL: si hay token valido expone req.auth; si no, continua sin auth.
export const createOptionalAuthMiddleware = (verifier: IAccessTokenVerifier) => {
	return (req: Request, _res: Response, next: NextFunction): void => {
		const header = req.headers.authorization;
		if (header && header.startsWith('Bearer ')) {
			const token = header.slice('Bearer '.length).trim();
			try {
				req.auth = verifier.verifyAccessToken(token);
			} catch {
				// token invalido -> no autenticado.
			}
		}
		next();
	};
};
