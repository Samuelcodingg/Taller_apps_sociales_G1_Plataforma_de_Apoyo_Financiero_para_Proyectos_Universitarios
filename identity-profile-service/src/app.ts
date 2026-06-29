import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express';
import { LocalDocumentStorage } from './feature/Verification/infrastructure/LocalDocumentStorage';
import { identityProfileRouter } from './feature/IdentityProfile';
import { profileRouter } from './feature/Profile';
import { verificationRouter } from './feature/Verification';
import { openapiSpec } from './docs/openapi';

const app = express();

app.use(cors());
app.use(express.json());

// Sirve los documentos KYC guardados localmente cuando no hay S3 (desarrollo).
// La URL devuelta por LocalDocumentStorage apunta a esta ruta estatica.
app.use(LocalDocumentStorage.PUBLIC_PATH, express.static(LocalDocumentStorage.UPLOAD_DIR));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Microservicio Identity profile funcionando' });
});

// Documentacion interactiva de la API (Swagger UI) y especificacion cruda.
app.get('/api/docs.json', (req, res) => res.json(openapiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use('/api/auth', identityProfileRouter);
app.use('/api/profile', profileRouter);
app.use('/api/verification', verificationRouter);

export { app };
