// Raiz de Composicion del vertical slice Campaign.
import { Router } from 'express';
import multer from 'multer';
import { HttpController } from './entrypoints/HttpController';
import { CampaignRepository } from './infrastructure/CampaignRepository';
import { createMediaStorage } from './infrastructure/mediaStorageFactory';
import { CreateCampaign } from './application/CreateCampaign';
import { ListCampaigns } from './application/ListCampaigns';
import { GetCampaign } from './application/GetCampaign';
import { EditCampaign } from './application/EditCampaign';
import { AddUpdate } from './application/AddUpdate';
import { AddComment } from './application/AddComment';
import { ToggleInteraction } from './application/ToggleInteraction';
import { ListMyInteractions } from './application/ListMyInteractions';
import { createAuthMiddleware, createOptionalAuthMiddleware } from '../../shared/http/authMiddleware';
import { JwtVerifier } from '../../shared/security/JwtVerifier';

const router = Router();

// 1. Adaptadores Driven (infraestructura).
const campaignRepository = new CampaignRepository();
const mediaStorage = createMediaStorage();
const jwtVerifier = new JwtVerifier();

// 2. Casos de Uso (application).
const createCampaign = new CreateCampaign(campaignRepository, mediaStorage);
const listCampaigns = new ListCampaigns(campaignRepository);
const getCampaign = new GetCampaign(campaignRepository);
const editCampaign = new EditCampaign(campaignRepository);
const addUpdate = new AddUpdate(campaignRepository, mediaStorage);
const addComment = new AddComment(campaignRepository);
const toggleInteraction = new ToggleInteraction(campaignRepository);
const listMyInteractions = new ListMyInteractions(campaignRepository);

// 3. Adaptador Driving (entrypoint).
const controller = new HttpController(
	createCampaign,
	listCampaigns,
	getCampaign,
	editCampaign,
	addUpdate,
	addComment,
	toggleInteraction,
	listMyInteractions,
);

// 4. Middlewares de autenticacion.
const authenticate = createAuthMiddleware(jwtVerifier);
const optionalAuth = createOptionalAuthMiddleware(jwtVerifier);

// 5. Parser multipart en memoria para la imagen/video (limite 25 MB).
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// 6. Rutas HTTP.
router.post('/', authenticate, upload.any(), (req, res) => controller.create(req, res));
router.get('/', (req, res) => controller.list(req, res));
// Campañas con las que el usuario interactua (favoritos/seguidas/interes).
router.get('/me/interactions', authenticate, (req, res) => controller.myInteractions(req, res));
// Detalle: auth OPCIONAL para saber que interacciones tiene el visor.
router.get('/:id', optionalAuth, (req, res) => controller.getById(req, res));
// Edicion (solo dueño) y actualizaciones (solo dueño).
router.put('/:id', authenticate, (req, res) => controller.edit(req, res));
router.post('/:id/updates', authenticate, upload.any(), (req, res) => controller.createUpdate(req, res));
// Comentarios/respuestas e interacciones (likes/shares) para usuarios autenticados.
router.post('/:id/comments', authenticate, (req, res) => controller.createComment(req, res));
router.post('/:id/interactions', authenticate, (req, res) => controller.interact(req, res));

export { router as campaignRouter };
