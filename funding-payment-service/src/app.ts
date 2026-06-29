import express from 'express';
import cors from 'cors';
import { fundingRouter } from './feature/Funding';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
	res.status(200).json({ status: 'OK', message: 'Funding & Payment Service funcionando' });
});

app.use('/api', fundingRouter);

export { app };
