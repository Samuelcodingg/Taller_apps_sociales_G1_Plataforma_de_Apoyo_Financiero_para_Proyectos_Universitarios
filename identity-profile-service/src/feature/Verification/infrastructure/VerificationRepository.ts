import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { randomUUID } from 'node:crypto';
import { databaseAdapterConfig } from '../../../shared/config';
import {
	CreateVerificationInput,
	IVerificationRepository,
} from '../domain/IVerificationRepository';
import { Verification } from '../domain/Verification';

type VerificationRow = {
	id_verification: string;
	id_account: string | null;
	type: string;
	status: string;
	document_url: string;
	rejection_reason: string | null;
	reviewed_at: Date | null;
	created_at: Date;
};

export class VerificationRepository implements IVerificationRepository {
	private readonly prisma: PrismaClient;

	constructor(prismaClient?: PrismaClient) {
		if (prismaClient) {
			this.prisma = prismaClient;
			return;
		}

		const adapter = new PrismaMariaDb(databaseAdapterConfig());
		this.prisma = new PrismaClient({ adapter });
	}

	async create(input: CreateVerificationInput): Promise<Verification> {
		const created = await this.prisma.verification.create({
			data: {
				id_verification: randomUUID(),
				id_account: input.accountId,
				type: input.type,
				status: input.status,
				document_url: input.documentUrl,
				extracted_data: input.extractedData
					? (input.extractedData as object)
					: undefined,
				created_at: new Date(),
			},
		});

		return this.toDomain(created);
	}

	async findLatestByAccountId(accountId: string): Promise<Verification | null> {
		const latest = await this.prisma.verification.findFirst({
			where: { id_account: accountId },
			orderBy: { created_at: 'desc' },
		});

		return latest ? this.toDomain(latest) : null;
	}

	private toDomain(row: VerificationRow): Verification {
		return {
			id: row.id_verification,
			accountId: row.id_account,
			type: row.type,
			status: row.status,
			documentUrl: row.document_url,
			rejectionReason: row.rejection_reason,
			reviewedAt: row.reviewed_at,
			createdAt: row.created_at,
		};
	}
}
