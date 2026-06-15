// Raiz de Composicion del vertical slice Verification (KYC).
import { Router } from 'express';
import { HttpController } from './entrypoints/HttpController';
import { VerificationRepository } from './infrastructure/VerificationRepository';
import { UploadVerification } from './application/UploadVerification';
import { GetVerificationStatus } from './application/GetVerificationStatus';
import { JwtService } from '../IdentityProfile/infrastructure/JwtService';
import { createAuthMiddleware } from '../../shared/http/authMiddleware';

const router = Router();

// 1. Adaptadores Driven (infraestructura).
const verificationRepository = new VerificationRepository();
const jwtService = new JwtService();

// 2. Casos de Uso (application).
const uploadVerification = new UploadVerification(verificationRepository);
const getVerificationStatus = new GetVerificationStatus(verificationRepository);

// 3. Adaptador Driving (entrypoint).
const controller = new HttpController(uploadVerification, getVerificationStatus);

// 4. Middleware de autenticacion compartido.
const authenticate = createAuthMiddleware(jwtService);

// 5. Rutas HTTP.
router.post('/upload', authenticate, (req, res) => controller.upload(req, res));
router.get('/status', authenticate, (req, res) => controller.status(req, res));

export { router as verificationRouter };
