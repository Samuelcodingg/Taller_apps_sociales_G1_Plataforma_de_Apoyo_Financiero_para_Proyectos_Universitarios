// src/feature/Auth/index.ts (o AuthRouter.ts)
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

// 1. Instanciar Infraestructura (Adaptadores Secundarios)
const authRepository = new AuthRepository();
const bcryptService = new BcryptService();
const jwtService = new JwtService();
// (Si usas Prisma, aquí le pasarías la instancia de PrismaClient al AuthRepository)

// 2. Instanciar Casos de Uso inyectando los puertos (El Núcleo)
const loginUser = new LoginUser(authRepository, bcryptService, jwtService);
const registerCreator = new RegisterCreator(authRepository, bcryptService, jwtService);
const registerDonor = new RegisterDonor(authRepository, bcryptService, jwtService);
const refreshToken = new RefreshToken(authRepository, jwtService);

// 3. Instanciar el Controlador (Adaptador Primario)
const authController = new HttpController(loginUser, registerCreator, registerDonor, refreshToken);

// 4. Definir las rutas HTTP y conectarlas a los métodos del controlador
router.post('/login', (req, res) => authController.login(req, res));
router.post('/register/creator', (req, res) => authController.registerCreator(req, res));
router.post('/register/donor', (req, res) => authController.registerDonor(req, res));
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res));

// Exportamos solo el router hacia el exterior
export { router as authRouter };