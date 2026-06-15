// Declaration merging: anade `auth` al Request de Express para que las rutas
// protegidas (Profile, Verification) lean el usuario autenticado con tipado.
import { AuthenticatedPayload } from './authMiddleware';

declare global {
	namespace Express {
		interface Request {
			auth?: AuthenticatedPayload;
		}
	}
}

export {};
