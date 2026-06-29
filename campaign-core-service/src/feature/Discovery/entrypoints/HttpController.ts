import { Request, Response } from 'express';
import { UnauthorizedError, ValidationError, NotFoundError } from '../../../shared/errors';
import { GetPersonalizedFeed } from '../application/GetPersonalizedFeed';
import { GetTrending } from '../application/GetTrending';
import { RecordView } from '../application/RecordView';

export class HttpController {
	constructor(
		private readonly getFeed: GetPersonalizedFeed,
		private readonly getTrending: GetTrending,
		private readonly recordView: RecordView,
	) {}

	async feed(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = req.auth?.userId;
			if (!accountId) {
				throw new UnauthorizedError('Inicia sesion para ver tu feed personalizado.');
			}
			const limit = Number(req.query.limit ?? 9);
			return res.status(200).json(await this.getFeed.execute(accountId, limit));
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async trending(req: Request, res: Response): Promise<Response> {
		try {
			const limit = Number(req.query.limit ?? 9);
			return res.status(200).json(await this.getTrending.execute(limit));
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async view(req: Request, res: Response): Promise<Response> {
		try {
			await this.recordView.execute(String(req.params.id), req.auth?.userId ?? null);
			return res.status(204).send();
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	private handleError(res: Response, error: unknown): Response {
		if (error instanceof ValidationError) return res.status(400).json({ message: error.message });
		if (error instanceof UnauthorizedError) return res.status(401).json({ message: error.message });
		if (error instanceof NotFoundError) return res.status(404).json({ message: error.message });
		const message = error instanceof Error ? error.message : 'Error interno del servidor.';
		return res.status(500).json({ message });
	}
}
