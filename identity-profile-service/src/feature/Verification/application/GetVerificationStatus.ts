import { IVerificationRepository } from '../domain/IVerificationRepository';
import { VerificationStatusDTO } from './dtos';

export class GetVerificationStatus {
	constructor(private readonly verificationRepository: IVerificationRepository) {}

	async execute(accountId: string): Promise<VerificationStatusDTO> {
		const latest = await this.verificationRepository.findLatestByAccountId(accountId);

		if (!latest) {
			return {
				status: 'NOT_SUBMITTED',
				type: null,
				rejectionReason: null,
				reviewedAt: null,
				createdAt: null,
			};
		}

		return {
			status: latest.status,
			type: latest.type,
			rejectionReason: latest.rejectionReason,
			reviewedAt: latest.reviewedAt ? latest.reviewedAt.toISOString() : null,
			createdAt: latest.createdAt.toISOString(),
		};
	}
}
