import express from 'express'
import cors from 'cors'
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { authRouter } from './feature/Auth';

const app = express();

app.use(cors());
app.use(express.json());

const openApiPath = path.resolve(process.cwd(), 'openapi.json');
let openApiSpec: Record<string, unknown> | null = null;

try {
    const rawSpec = fs.readFileSync(openApiPath, 'utf-8');
    openApiSpec = JSON.parse(rawSpec) as Record<string, unknown>;
} catch (error) {
    console.warn('OpenAPI spec not loaded:', error);
}

if (openApiSpec) {
    app.get('/api/docs.json', (req, res) => res.json(openApiSpec));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
}

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend funcionando' });
});

app.use('/api/auth', authRouter);

export { app };