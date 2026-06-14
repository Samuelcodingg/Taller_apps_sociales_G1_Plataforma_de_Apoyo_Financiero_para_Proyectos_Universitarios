// src/feature/IdentityProfile/index.ts
// Raiz de Composicion del vertical slice IdentityProfile.
// Ensambla manualmente las dependencias (sin contenedor de DI) y expone
// un Router de Express ya cableado hacia el exterior.
import { Router } from 'express';
import { HttpController } from './entrypoints/HttpController';
import { AuthRepository } from './infrastructure/AuthRepository';
import { BcryptService } from './infrastructure/BcryptService';
import { JwtService } from './infrastructure/JwtService';
import { LoginUser } from './application/LoginUser';
import { RegisterCreator } from './application/RegisterCreator';
import { RegisterDonor } from './application/RegisterDonor';
import { RefreshToken } from './application/RefreshToken';

const router = Router();

// 1. Adaptadores Driven (infraestructura): implementan los Puertos del dominio.
const authRepository = new AuthRepository();
const bcryptService = new BcryptService();
const jwtService = new JwtService();

// 2. Casos de Uso (application): reciben los puertos por constructor.
const loginUser = new LoginUser(authRepository, bcryptService, jwtService);
const registerCreator = new RegisterCreator(authRepository, bcryptService, jwtService);
const registerDonor = new RegisterDonor(authRepository, bcryptService, jwtService);
const refreshToken = new RefreshToken(authRepository, jwtService);

// 3. Adaptador Driving (entrypoint): recibe los casos de uso por constructor.
const identityProfileController = new HttpController(
	loginUser,
	registerCreator,
	registerDonor,
	refreshToken,
);

// 4. Rutas HTTP conectadas a los metodos del controlador.
router.post('/login', (req, res) => identityProfileController.login(req, res));
router.post('/register/creator', (req, res) => identityProfileController.registerCreator(req, res));
router.post('/register/donor', (req, res) => identityProfileController.registerDonor(req, res));
router.post('/refresh-token', (req, res) => identityProfileController.refreshToken(req, res));

// Exportamos solo el router ya configurado.
export { router as identityProfileRouter };
