// src/feature/IdentityProfile/index.ts
// Raiz de Composicion del vertical slice IdentityProfile.
// Ensambla manualmente las dependencias (sin contenedor de DI) y expone
// un Router de Express ya cableado hacia el exterior.
import { Router } from 'express';
import multer from 'multer';
import { HttpController } from './entrypoints/HttpController';
import { AuthRepository } from './infrastructure/AuthRepository';
import { BcryptService } from './infrastructure/BcryptService';
import { JwtService } from './infrastructure/JwtService';
import { LoginUser } from './application/LoginUser';
import { RegisterCreator } from './application/RegisterCreator';
import { RegisterDonor } from './application/RegisterDonor';
import { RefreshToken } from './application/RefreshToken';
import { ConflictError, UnauthorizedError, ValidationError } from '../../shared/errors';
import { VerificationRepository } from '../Verification/infrastructure/VerificationRepository';
import { SqsVerificationEventPublisher } from '../Verification/infrastructure/SqsVerificationEventPublisher';
import { S3DocumentStorage } from '../Verification/infrastructure/S3DocumentStorage';
import { UploadVerification } from '../Verification/application/UploadVerification';

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

// 4b. Subida del documento KYC: parser multipart en memoria (limite 10 MB) y
// cableado del caso de uso de verificacion + almacenamiento en S3. Permite que
// el registro de un CREATOR llegue como multipart/form-data con el PDF adjunto.
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
});
const documentStorage = new S3DocumentStorage();
const verificationRepository = new VerificationRepository();
const verificationPublisher = new SqsVerificationEventPublisher();
const uploadVerification = new UploadVerification(verificationRepository, verificationPublisher);

// Registro de CREATOR + (opcional) verificacion KYC en una sola llamada.
// Acepta tanto application/json (sin documento) como multipart/form-data con el
// archivo adjunto. Si viene archivo, lo sube a S3 y crea la verificacion PENDING.
const registerCreatorHandler = async (
	req: import('express').Request,
	res: import('express').Response,
): Promise<import('express').Response> => {
	try {
		const { email, password } = req.body as { email?: string; password?: string };
		if (typeof email !== 'string' || typeof password !== 'string') {
			throw new ValidationError('Debes enviar email y password como texto.');
		}

		const authResult = await registerCreator.execute({ email, password });

		// El archivo puede llegar bajo cualquier nombre de campo: tomamos el primero.
		const files = (req.files as Express.Multer.File[] | undefined) ?? [];
		const document = files[0];

		let verification = null;
		if (document) {
			const accountId = authResult.user.id;
			const documentUrl = await documentStorage.uploadAndGetDownloadUrl({
				accountId,
				buffer: document.buffer,
				contentType: document.mimetype,
				originalName: document.originalname,
			});
			verification = await uploadVerification.execute(accountId, { documentUrl, type: 'KYC' });
		}

		return res.status(201).json({ ...authResult, verification });
	} catch (error) {
		if (error instanceof ValidationError) {
			return res.status(400).json({ message: error.message });
		}
		if (error instanceof ConflictError) {
			return res.status(409).json({ message: error.message });
		}
		if (error instanceof UnauthorizedError) {
			return res.status(401).json({ message: error.message });
		}
		const message = error instanceof Error ? error.message : 'Error interno del servidor.';
		return res.status(500).json({ message });
	}
};

// 4. Rutas HTTP conectadas a los metodos del controlador.
router.post('/login', (req, res) => identityProfileController.login(req, res));
router.post('/register/creator', upload.any(), registerCreatorHandler);
router.post('/register/donor', (req, res) => identityProfileController.registerDonor(req, res));
router.post('/refresh-token', (req, res) => identityProfileController.refreshToken(req, res));

// Exportamos solo el router ya configurado.
export { router as identityProfileRouter };
