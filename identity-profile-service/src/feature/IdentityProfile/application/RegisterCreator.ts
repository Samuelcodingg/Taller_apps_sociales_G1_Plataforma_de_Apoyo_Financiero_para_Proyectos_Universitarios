import { ConflictError, ValidationError } from '../../../shared/errors';
import { IAuthRepository } from '../domain/IAuthRepository';
import { IPasswordService, Password } from '../domain/Password';
import { ITokenService } from '../domain/ITokenService';
import { Email } from '../domain/Email';
import { Role } from '../domain/Role';
import { AuthResult, toPublicUser } from '../domain/User';

export interface RegisterCreatorInput {
	email: string;
	password: string;
	// Nombres y apellidos extraidos del reporte de matricula (en produccion los
	// provee la IA). Opcionales: si no vienen, el perfil queda con valores vacios.
	names?: string;
	surnames?: string;
}

export class RegisterCreator {
	constructor(
		private readonly authRepository: IAuthRepository,
		private readonly passwordService: IPasswordService,
		private readonly tokenService: ITokenService,
	) {}

	async execute(input: RegisterCreatorInput): Promise<AuthResult> {
		try {
			const email = Email.create(input.email).toString();
			const plainPassword = Password.create(input.password).toString();

			const existingUser = await this.authRepository.findByEmail(email);
			if (existingUser) {
				throw new ConflictError('Ya existe una cuenta con ese correo.');
			}

			const passwordHash = await this.passwordService.hash(plainPassword);
			const user = await this.authRepository.createLocalUser({
				email,
				passwordHash,
				role: Role.CREATOR,
				names: input.names,
				surnames: input.surnames,
			});

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
				user: {
					...toPublicUser(user),
					names: input.names ?? '',
					lastNames: input.surnames ?? '',
				},
				...tokens,
			};
		} catch (error) {
			if (error instanceof ConflictError) {
				throw error;
			}

			if (error instanceof Error) {
				throw new ValidationError(error.message);
			}

			throw new ValidationError('No se pudo registrar el creador.');
		}
	}
}
