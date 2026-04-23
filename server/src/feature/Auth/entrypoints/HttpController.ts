import { Request, Response } from 'express';
import { LoginUser } from '../application/LoginUser';
import { RegisterCreator } from '../application/RegisterCreator';
import { RegisterDonor } from '../application/RegisterDonor';
import { RefreshToken } from '../application/RefreshToken';
import { ConflictError, UnauthorizedError, ValidationError } from '../application/Errors';

export class HttpController {
	constructor(
		private readonly loginUser: LoginUser,
		private readonly registerCreatorUseCase: RegisterCreator,
		private readonly registerDonorUseCase: RegisterDonor,
		private readonly refreshTokenUseCase: RefreshToken,
	) {}

	async login(req: Request, res: Response): Promise<Response> {
		try {
			const { email, password } = req.body as { email?: string; password?: string };

			if (typeof email !== 'string' || typeof password !== 'string') {
				throw new ValidationError('Debes enviar email y password como texto.');
			}

			const authResult = await this.loginUser.execute({ email, password });
			return res.status(200).json(authResult);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async registerCreator(req: Request, res: Response): Promise<Response> {
		try {
			const { email, password } = req.body as { email?: string; password?: string };

			if (typeof email !== 'string' || typeof password !== 'string') {
				throw new ValidationError('Debes enviar email y password como texto.');
			}

			const authResult = await this.registerCreatorUseCase.execute({ email, password });
			return res.status(201).json(authResult);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async registerDonor(req: Request, res: Response): Promise<Response> {
		try {
			const { email, password } = req.body as { email?: string; password?: string };

			if (typeof email !== 'string' || typeof password !== 'string') {
				throw new ValidationError('Debes enviar email y password como texto.');
			}

			const authResult = await this.registerDonorUseCase.execute({ email, password });
			return res.status(201).json(authResult);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	async refreshToken(req: Request, res: Response): Promise<Response> {
		try {
			const { refreshToken } = req.body as { refreshToken?: string };

			if (typeof refreshToken !== 'string') {
				throw new ValidationError('Debes enviar refreshToken como texto.');
			}

			const authResult = await this.refreshTokenUseCase.execute({ refreshToken });
			return res.status(200).json(authResult);
		} catch (error) {
			return this.handleError(res, error);
		}
	}

	private handleError(res: Response, error: unknown): Response {
		if (error instanceof ValidationError) {
			return res.status(400).json({ message: error.message });
		}

		if (error instanceof ConflictError) {
			return res.status(409).json({ message: error.message });
		}

		if (error instanceof UnauthorizedError) {
			return res.status(401).json({ message: error.message });
		}

		const message = error instanceof Error ? error.message : 'Error interno del servidor.';
		return res.status(500).json({ message });
	}
}
