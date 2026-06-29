// Raiz de Composicion del vertical slice Funding (donaciones + pagos).
import { Router } from 'express';
import { HttpController } from './entrypoints/HttpController';
import { FundingRepository } from './infrastructure/FundingRepository';
import { SimulatedPaymentGateway } from './infrastructure/SimulatedPaymentGateway';
import { RegisterDonation } from './application/RegisterDonation';
import { HandlePaymentWebhook } from './application/HandlePaymentWebhook';
import { GetCampaignProgress } from './application/GetCampaignProgress';
import { GetMyDonations } from './application/GetMyDonations';
import { GetMyNotifications } from './application/GetMyNotifications';
import { MarkNotificationsRead } from './application/MarkNotificationsRead';
import { createAuthMiddleware, createOptionalAuthMiddleware } from '../../shared/http/authMiddleware';
import { JwtVerifier } from '../../shared/security/JwtVerifier';

const router = Router();

// 1. Adaptadores Driven.
const repository = new FundingRepository();
const gateway = new SimulatedPaymentGateway();
const jwtVerifier = new JwtVerifier();

// 2. Casos de Uso.
const registerDonation = new RegisterDonation(repository, gateway);
const handleWebhook = new HandlePaymentWebhook(repository);
const getProgress = new GetCampaignProgress(repository);
const getMyDonations = new GetMyDonations(repository);
const getMyNotifications = new GetMyNotifications(repository);
const markNotificationsRead = new MarkNotificationsRead(repository);

// 3. Entrypoint.
const controller = new HttpController(
	registerDonation,
	handleWebhook,
	getProgress,
	getMyDonations,
	getMyNotifications,
	markNotificationsRead,
);

// 4. Middlewares de auth.
const optionalAuth = createOptionalAuthMiddleware(jwtVerifier);
const authenticate = createAuthMiddleware(jwtVerifier);

// 5. Rutas HTTP.
router.post('/donations', optionalAuth, (req, res) => controller.donate(req, res));
router.get('/me/donations', authenticate, (req, res) => controller.myDonations(req, res));
router.get('/me/notifications', authenticate, (req, res) => controller.notifications(req, res));
router.post('/me/notifications/read', authenticate, (req, res) => controller.readNotifications(req, res));
router.post('/payments/webhook', (req, res) => controller.webhook(req, res));
router.post('/payments/:transactionId/confirm', (req, res) => controller.confirm(req, res));
router.get('/campaigns/:id/progress', (req, res) => controller.progress(req, res));

export { router as fundingRouter };
