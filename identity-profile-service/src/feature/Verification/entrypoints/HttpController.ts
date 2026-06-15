import { Request, Response } from 'express';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../../../shared/errors';
import { UploadVerification } from '../application/UploadVerification';
import { GetVerificationStatus } from '../application/GetVerificationStatus';
import { UploadVerificationInput } from '../application/dtos';

export class HttpController {
	constructor(
		private readonly uploadVerification: UploadVerification,
		private readonly getVerificationStatus: GetVerificationStatus,
	) {}

	async upload(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = this.requireAccountId(req);
			const input = (req.body ?? {}) as UploadVerificationInput;
			const verification = await this.uploadVerification.execute(accountId, input);
			return res.status(201).json(verification);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async status(req: Request, res: Response): Promise<Response> {
		try {
			const accountId = this.requireAccountId(req);
			const result = await this.getVerificationStatus.execute(accountId);
			return res.status(200).json(result);
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
