import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express';
import { identityProfileRouter } from './feature/IdentityProfile';
import { profileRouter } from './feature/Profile';
import { verificationRouter } from './feature/Verification';
import { openapiSpec } from './docs/openapi';

const app = express();

app.use(cors());
app.use(express.json());

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
