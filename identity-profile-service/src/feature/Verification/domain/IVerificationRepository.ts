import { Verification } from './Verification';

export interface CreateVerificationInput {
	accountId: string;
	type: string;
	documentUrl: string;
	status: string;
}

export interface IVerificationRepository {
	create(input: CreateVerificationInput): Promise<Verification>;
	findLatestByAccountId(accountId: string): Promise<Verification | null>;
}
