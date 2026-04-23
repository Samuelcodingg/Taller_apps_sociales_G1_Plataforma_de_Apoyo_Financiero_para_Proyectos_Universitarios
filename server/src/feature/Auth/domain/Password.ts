export interface IPasswordService {
	hash(plainPassword: string): Promise<string>;
	compare(plainPassword: string, hashedPassword: string): Promise<boolean>;
}

export class Password {
	private constructor(private readonly value: string) {}

	static create(rawPassword: string): Password {
		const trimmedPassword = rawPassword.trim();

		if (trimmedPassword.length < 8) {
			throw new Error('La contrasena debe tener al menos 8 caracteres.');
		}

		return new Password(trimmedPassword);
	}

	toString(): string {
		return this.value;
	}
}
