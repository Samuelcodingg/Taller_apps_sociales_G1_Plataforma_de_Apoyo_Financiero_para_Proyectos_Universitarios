import express from 'express'
import cors from 'cors'
import { authRouter } from './feature/Auth';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend funcionando' });
});

app.use('/api/auth', authRouter);

export { app };