// Raiz de Composicion del vertical slice Profile.
import { Router } from 'express';
import { HttpController } from './entrypoints/HttpController';
import { ProfileRepository } from './infrastructure/ProfileRepository';
import { GetMyProfile } from './application/GetMyProfile';
import { UpdateMyProfile } from './application/UpdateMyProfile';
import { JwtService } from '../IdentityProfile/infrastructure/JwtService';
import { createAuthMiddleware } from '../../shared/http/authMiddleware';

const router = Router();

// 1. Adaptadores Driven (infraestructura).
const profileRepository = new ProfileRepository();
const jwtService = new JwtService();

// 2. Casos de Uso (application).
const getMyProfile = new GetMyProfile(profileRepository);
const updateMyProfile = new UpdateMyProfile(profileRepository);

// 3. Adaptador Driving (entrypoint).
const controller = new HttpController(getMyProfile, updateMyProfile);

// 4. Middleware de autenticacion compartido (todas las rutas son protegidas).
const authenticate = createAuthMiddleware(jwtService);

// 5. Rutas HTTP.
router.get('/me', authenticate, (req, res) => controller.getMe(req, res));
router.put('/me', authenticate, (req, res) => controller.updateMe(req, res));

export { router as profileRouter };
