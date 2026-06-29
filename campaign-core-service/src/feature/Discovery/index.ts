// Raiz de Composicion del vertical slice Discovery (feed + tendencias).
import { Router } from 'express';
import { HttpController } from './entrypoints/HttpController';
import { DiscoveryRepository } from './infrastructure/DiscoveryRepository';
import { GetPersonalizedFeed } from './application/GetPersonalizedFeed';
import { GetTrending } from './application/GetTrending';
import { RecordView } from './application/RecordView';
import { createAuthMiddleware, createOptionalAuthMiddleware } from '../../shared/http/authMiddleware';
import { JwtVerifier } from '../../shared/security/JwtVerifier';

const router = Router();

const repository = new DiscoveryRepository();
const jwtVerifier = new JwtVerifier();

const getFeed = new GetPersonalizedFeed(repository);
const getTrending = new GetTrending(repository);
const recordView = new RecordView(repository);

const controller = new HttpController(getFeed, getTrending, recordView);

const authenticate = createAuthMiddleware(jwtVerifier);
const optionalAuth = createOptionalAuthMiddleware(jwtVerifier);

// Feed personalizado del donante (requiere sesion).
router.get('/feed', authenticate, (req, res) => controller.feed(req, res));
// Tendencias (publico).
router.get('/trending', (req, res) => controller.trending(req, res));
// Registrar clic/vista de una campaña (auth opcional).
router.post('/campaigns/:id/view', optionalAuth, (req, res) => controller.view(req, res));

export { router as discoveryRouter };
