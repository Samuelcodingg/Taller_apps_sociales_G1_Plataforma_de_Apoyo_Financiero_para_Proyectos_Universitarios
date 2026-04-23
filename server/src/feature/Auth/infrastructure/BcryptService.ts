import bcrypt from 'bcryptjs';
import { IPasswordService } from '../domain/Password';

export class BcryptService implements IPasswordService {
	private readonly saltRounds = 12;

	async hash(plainPassword: string): Promise<string> {
		return bcrypt.hash(plainPassword, this.saltRounds);
	}

	async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
		return bcrypt.compare(plainPassword, hashedPassword);
	}
}
