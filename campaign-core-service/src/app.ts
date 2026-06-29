import express from 'express';
import cors from 'cors';
import { campaignRouter } from './feature/Campaign';
import { discoveryRouter } from './feature/Discovery';
import { LocalMediaStorage } from './feature/Campaign/infrastructure/LocalMediaStorage';

const app = express();

app.use(cors());
app.use(express.json());

// Sirve la multimedia de campañas guardada localmente cuando no hay S3 (dev).
app.use(LocalMediaStorage.PUBLIC_PATH, express.static(LocalMediaStorage.UPLOAD_DIR));

app.get('/api/health', (req, res) => {
	res.status(200).json({ status: 'OK', message: 'Campaign Core Service funcionando' });
});

app.use('/api/discovery', discoveryRouter);
app.use('/api/campaigns', campaignRouter);

export { app };
