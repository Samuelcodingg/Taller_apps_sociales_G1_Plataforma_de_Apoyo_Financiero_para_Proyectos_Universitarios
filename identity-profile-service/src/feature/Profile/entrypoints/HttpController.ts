import { Request, Response } from 'express';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../../shared/errors';
import { GetMyProfile } from '../application/GetMyProfile';
import { UpdateMyProfile } from '../application/UpdateMyProfile';
import { UpdateProfileInput } from '../application/dtos';

export class HttpController {
	constructor(
		private readonly getMyProfile: GetMyProfile,
		private readonly updateMyProfile: UpdateMyProfile,
	) {}

	async getMe(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = this.requireAccountId(req);
			const profile = await this.getMyProfile.execute(accountId);
			return res.status(200).json(profile);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async updateMe(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = this.requireAccountId(req);
			const input = (req.body ?? {}) as UpdateProfileInput;
			const profile = await this.updateMyProfile.execute(accountId, input);
			return res.status(200).json(profile);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	private requireAccountId(req: Request): string {
		const accountId = req.auth?.userId;
		if (!accountId) {
			throw new UnauthorizedError('No se pudo identificar al usuario autenticado.');
		}
		return accountId;
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
