// Raiz de Composicion del vertical slice Admin (panel de administracion).
import { Router, Request, Response, NextFunction } from 'express';
import { AdminRepository } from './infrastructure/AdminRepository';
import { AdminHttpController } from './entrypoints/HttpController';
import { JwtService } from '../IdentityProfile/infrastructure/JwtService';
import { BcryptService } from '../IdentityProfile/infrastructure/BcryptService';
import { createAuthMiddleware } from '../../shared/http/authMiddleware';

const router = Router();

// 1. Adaptadores.
const adminRepository = new AdminRepository();
const jwtService = new JwtService();
const passwordService = new BcryptService();

// 2. Controlador.
const controller = new AdminHttpController(adminRepository, passwordService);

// 3. Middlewares: autenticacion + autorizacion por rol ADMIN.
const authenticate = createAuthMiddleware(jwtService);
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
	if (req.auth?.role !== 'ADMIN') {
		res.status(403).json({ message: 'Acceso restringido a administradores.' });
		return;
	}
	next();
};

// 4. Rutas (todas protegidas y solo para ADMIN).
router.get('/users', authenticate, requireAdmin, (req, res) => controller.listUsers(req, res));
router.get('/users/:id', authenticate, requireAdmin, (req, res) => controller.getUser(req, res));
router.post('/users', authenticate, requireAdmin, (req, res) => controller.createUser(req, res));
router.put('/users/:id', authenticate, requireAdmin, (req, res) => controller.updateUser(req, res));
router.delete('/users/:id', authenticate, requireAdmin, (req, res) =>
	controller.deleteUser(req, res),
);

export { router as adminRouter };
