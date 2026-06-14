import express from 'express'
import cors from 'cors'
import { identityProfileRouter } from './feature/IdentityProfile';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend funcionando' });
});

app.use('/api/auth', identityProfileRouter);

export { app };
