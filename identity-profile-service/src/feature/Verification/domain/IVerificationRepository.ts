import { Verification } from './Verification';

export interface CreateVerificationInput {
	accountId: string;
	type: string;
	documentUrl: string;
	status: string;
	// Datos extraidos del documento (p. ej. universidad, facultad, escuela, nombre).
	// Se guardan en la columna JSON verification.extracted_data.
	extractedData?: Record<string, unknown> | null;
}

export interface IVerificationRepository {
	create(input: CreateVerificationInput): Promise<Verification>;
	findLatestByAccountId(accountId: string): Promise<Verification | null>;
}
