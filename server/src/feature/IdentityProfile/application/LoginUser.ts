import { UnauthorizedError, ValidationError } from './Errors';
import { IAuthRepository } from '../domain/IAuthRepository';
import { IPasswordService, Password } from '../domain/Password';
import { ITokenService } from '../domain/ITokenService';
import { Email } from '../domain/Email';
import { AuthResult, toPublicUser } from '../domain/User';

export interface LoginUserInput {
	email: string;
	password: string;
}

export class LoginUser {
	constructor(
		private readonly authRepository: IAuthRepository,
		private readonly passwordService: IPasswordService,
		private readonly tokenService: ITokenService,
	) {}

	async execute(input: LoginUserInput): Promise<AuthResult> {
		try {
			const email = Email.create(input.email).toString();
			const plainPassword = Password.create(input.password).toString();

			const user = await this.authRepository.findByEmail(email);
			if (!user || !user.passwordHash) {
				throw new UnauthorizedError('Credenciales invalidas.');
			}

			const passwordMatches = await this.passwordService.compare(plainPassword, user.passwordHash);
			if (!passwordMatches) {
				throw new UnauthorizedError('Credenciales invalidas.');
			}

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

			throw new ValidationError('No se pudo autenticar el usuario.');
		}
	}
}
