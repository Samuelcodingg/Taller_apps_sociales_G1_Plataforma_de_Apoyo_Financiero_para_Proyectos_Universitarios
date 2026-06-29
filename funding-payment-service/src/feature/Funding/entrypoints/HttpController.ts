import { Request, Response } from 'express';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../../shared/errors';
import { config } from '../../../shared/config';
import { RegisterDonation } from '../application/RegisterDonation';
import { HandlePaymentWebhook } from '../application/HandlePaymentWebhook';
import { GetCampaignProgress } from '../application/GetCampaignProgress';
import { GetMyDonations } from '../application/GetMyDonations';
import { GetMyNotifications } from '../application/GetMyNotifications';
import { MarkNotificationsRead } from '../application/MarkNotificationsRead';
import { PaymentStatus } from '../application/dtos';

export class HttpController {
	constructor(
		private readonly registerDonation: RegisterDonation,
		private readonly handleWebhook: HandlePaymentWebhook,
		private readonly getProgress: GetCampaignProgress,
		private readonly getMyDonations: GetMyDonations,
		private readonly getMyNotifications: GetMyNotifications,
		private readonly markNotificationsRead: MarkNotificationsRead,
	) {}

	async notifications(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = req.auth?.userId;
			if (!accountId) throw new UnauthorizedError('No se pudo identificar al usuario.');
			return res.status(200).json(await this.getMyNotifications.execute(accountId));
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async readNotifications(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = req.auth?.userId;
			if (!accountId) throw new UnauthorizedError('No se pudo identificar al usuario.');
			const { ids } = req.body as { ids?: string[] };
			await this.markNotificationsRead.execute(accountId, ids);
			return res.status(200).json({ ok: true });
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async myDonations(req: Request, res: Response): Promise<Response> {
		try {
			const donorId = req.auth?.userId;
			if (!donorId) {
				throw new UnauthorizedError('No se pudo identificar al usuario autenticado.');
			}
			const donations = await this.getMyDonations.execute(donorId);
			return res.status(200).json(donations);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async donate(req: Request, res: Response): Promise<Response> {
		try {
			const { campaignId, amount, isAnonymous, message, paymentMethod } = req.body as {
				campaignId?: string;
				amount?: number;
				isAnonymous?: boolean;
				message?: string;
				paymentMethod?: string;
			};

			if (typeof campaignId !== 'string' || campaignId.length === 0) {
				throw new ValidationError('Debes indicar la campaña (campaignId).');
			}

			// donorId proviene SOLO del token (no del body) para no suplantar donantes.
			const donorId = req.auth?.userId ?? null;

			const result = await this.registerDonation.execute({
				campaignId,
				donorId,
				amount: Number(amount),
				isAnonymous: Boolean(isAnonymous),
				message: message ?? null,
				paymentMethod,
			});

			return res.status(201).json(result);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async webhook(req: Request, res: Response): Promise<Response> {
		try {
			// Verificacion del secreto compartido de la pasarela.
			const provided = req.headers['x-webhook-secret'];
			if (provided !== config.webhookSecret) {
				throw new UnauthorizedError('Firma de webhook invalida.');
			}

			const { transactionId, status } = req.body as {
				transactionId?: string;
				status?: string;
			};

			const result = await this.handleWebhook.execute({
				transactionId: transactionId ?? '',
				status: String(status).toUpperCase() as PaymentStatus,
			});

			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	// Confirmacion desde el cliente al "volver" del checkout de la pasarela
	// SIMULADA (equivale a recibir el webhook COMPLETED). En produccion con una
	// pasarela real, la confirmacion la haria el webhook firmado, no el cliente.
	async confirm(req: Request, res: Response): Promise<Response> {
		try {
			const result = await this.handleWebhook.execute({
				transactionId: String(req.params.transactionId),
				status: 'COMPLETED',
			});
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async progress(req: Request, res: Response): Promise<Response> {
		try {
			const result = await this.getProgress.execute(String(req.params.id));
			return res.status(200).json(result);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	private handleError(res: Response, error: unknown): Response {
		if (error instanceof ValidationError) {
			return res.status(400).json({ message: error.message });
		}
		if (error instanceof UnauthorizedError) {
			return res.status(401).json({ message: error.message });
		}
		if (error instanceof NotFoundError) {
			return res.status(404).json({ message: error.message });
		}
		if (error instanceof ConflictError) {
			return res.status(409).json({ message: error.message });
		}
		const message = error instanceof Error ? error.message : 'Error interno del servidor.';
		return res.status(500).json({ message });
	}
}
