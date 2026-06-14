import { IAuthRepository } from '../domain/IAuthRepository';
import { ITokenService } from '../domain/ITokenService';
import { AuthResult, toPublicUser } from '../domain/User';
import { UnauthorizedError, ValidationError } from './Errors';

export interface RefreshTokenInput {
	refreshToken: string;
}

export class RefreshToken {
	constructor(
		private readonly authRepository: IAuthRepository,
		private readonly tokenService: ITokenService,
	) {}

	async execute(input: RefreshTokenInput): Promise<AuthResult> {
		try {
			const payload = this.tokenService.verifyRefreshToken(input.refreshToken);

			const user = await this.authRepository.findUserByRefreshToken(input.refreshToken);
			if (!user || user.id !== payload.userId) {
				throw new UnauthorizedError('Refresh token invalido o expirado.');
			}

			await this.authRepository.revokeRefreshToken(input.refreshToken);

			const tokens = this.tokenService.issueTokens({
				userId: user.id,
				email: user.email,
				role: user.role,
			});

			await this.authRepository.storeRefreshToken({
				userId: user.id,
				token: tokens.refreshToken,
				expiresAt: this.tokenService.getRefreshTokenExpiryDate(),
			});

			return {
				user: toPublicUser(user),
				...tokens,
			};
		} catch (error) {
			if (error instanceof UnauthorizedError) {
				throw error;
			}

			if (error instanceof Error) {
				throw new ValidationError(error.message);
			}

			throw new ValidationError('No se pudo renovar el token.');
		}
	}
}
