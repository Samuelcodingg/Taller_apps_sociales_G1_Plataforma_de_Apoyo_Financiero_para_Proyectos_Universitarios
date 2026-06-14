const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
	private constructor(private readonly value: string) {}

	static create(rawEmail: string): Email {
		const normalizedEmail = rawEmail.trim().toLowerCase();

		if (!EMAIL_REGEX.test(normalizedEmail)) {
			throw new Error('El correo electronico no tiene un formato valido.');
		}

		return new Email(normalizedEmail);
	}

	toString(): string {
		return this.value;
	}
}
