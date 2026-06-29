import { Request, Response } from 'express';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../../shared/errors';
import { CreateCampaign } from '../application/CreateCampaign';
import { ListCampaigns } from '../application/ListCampaigns';
import { GetCampaign } from '../application/GetCampaign';
import { EditCampaign } from '../application/EditCampaign';
import { AddUpdate } from '../application/AddUpdate';
import { AddComment } from '../application/AddComment';
import { ToggleInteraction } from '../application/ToggleInteraction';
import { ListMyInteractions } from '../application/ListMyInteractions';
import { InteractionType } from '../application/dtos';

export class HttpController {
	constructor(
		private readonly createCampaign: CreateCampaign,
		private readonly listCampaigns: ListCampaigns,
		private readonly getCampaign: GetCampaign,
		private readonly editCampaign: EditCampaign,
		private readonly addUpdate: AddUpdate,
		private readonly addComment: AddComment,
		private readonly toggleInteraction: ToggleInteraction,
		private readonly listMyInteractions: ListMyInteractions,
	) {}

	async myInteractions(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = req.auth?.userId;
			if (!accountId) {
				throw new UnauthorizedError('No se pudo identificar al usuario autenticado.');
			}
			const type = String(req.query.type ?? 'BOOKMARK');
			const campaigns = await this.listMyInteractions.execute(accountId, type);
			return res.status(200).json(campaigns);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async create(req: Request, res: Response): Promise<Response> {
		try {
			const creatorId = req.auth?.userId;
			if (!creatorId) {
				throw new UnauthorizedError('No se pudo identificar al usuario autenticado.');
			}

			const { title, description, goalAmount, endDate, status } = req.body as {
				title?: string;
				description?: string;
				goalAmount?: string;
				endDate?: string;
				status?: string;
			};

			// El archivo puede llegar bajo cualquier nombre de campo: tomamos el primero.
			const files = (req.files as Express.Multer.File[] | undefined) ?? [];
			const file = files[0];

			const campaign = await this.createCampaign.execute({
				creatorId,
				title: title ?? '',
				description: description ?? '',
				goalAmount: Number(goalAmount),
				endDate: endDate ?? '',
				status,
				media: file
					? { buffer: file.buffer, mimetype: file.mimetype, originalName: file.originalname }
					: undefined,
			});

			return res.status(201).json(campaign);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async list(req: Request, res: Response): Promise<Response> {
		try {
			const campaigns = await this.listCampaigns.execute();
			return res.status(200).json(campaigns);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async getById(req: Request, res: Response): Promise<Response> {
		try {
			const campaign = await this.getCampaign.execute(
				String(req.params.id),
				req.auth?.userId ?? null,
			);
			return res.status(200).json(campaign);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async edit(req: Request, res: Response): Promise<Response> {
		try {
			const requesterId = req.auth?.userId;
			if (!requesterId) {
				throw new UnauthorizedError('No se pudo identificar al usuario autenticado.');
			}
			const { title, description, goalAmount, endDate, status } = req.body as Record<
				string,
				unknown
			>;
			const campaign = await this.editCampaign.execute({
				id: String(req.params.id),
				requesterId,
				title: title as string | undefined,
				description: description as string | undefined,
				goalAmount: goalAmount === undefined ? undefined : Number(goalAmount),
				endDate: endDate as string | undefined,
				status: status as string | undefined,
			});
			return res.status(200).json(campaign);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async createUpdate(req: Request, res: Response): Promise<Response> {
		try {
			const requesterId = req.auth?.userId;
			if (!requesterId) {
				throw new UnauthorizedError('No se pudo identificar al usuario autenticado.');
			}
			const { title, message } = req.body as { title?: string; message?: string };
			const files = (req.files as Express.Multer.File[] | undefined) ?? [];
			const file = files[0];
			const update = await this.addUpdate.execute({
				campaignId: String(req.params.id),
				requesterId,
				title,
				message: message ?? '',
				image: file
					? { buffer: file.buffer, mimetype: file.mimetype, originalName: file.originalname }
					: undefined,
			});
			return res.status(201).json(update);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async createComment(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = req.auth?.userId;
			if (!accountId) {
				throw new UnauthorizedError('No se pudo identificar al usuario autenticado.');
			}
			const { content, parentId } = req.body as { content?: string; parentId?: string | null };
			const comment = await this.addComment.execute({
				campaignId: String(req.params.id),
				accountId,
				content: content ?? '',
				parentId: parentId ?? null,
			});
			return res.status(201).json(comment);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async interact(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = req.auth?.userId;
			if (!accountId) {
				throw new UnauthorizedError('No se pudo identificar al usuario autenticado.');
			}
			const { type } = req.body as { type?: string };
			const result = await this.toggleInteraction.execute({
				campaignId: String(req.params.id),
				accountId,
				type: String(type).toUpperCase() as InteractionType,
			});
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
