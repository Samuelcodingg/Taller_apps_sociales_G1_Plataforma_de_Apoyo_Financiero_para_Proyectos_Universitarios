import { GetVerificationStatus } from '../../../src/feature/Verification/application/GetVerificationStatus';
import { IVerificationRepository } from '../../../src/feature/Verification/domain/IVerificationRepository';
import { Verification } from '../../../src/feature/Verification/domain/Verification';

class FakeVerificationRepository implements IVerificationRepository {
	constructor(private latest: Verification | null) {}
	async create(): Promise<Verification> {
		throw new Error('not used');
	}
	async findLatestByAccountId(): Promise<Verification | null> {
		return this.latest;
	}
}

describe('GetVerificationStatus', () => {
	it('devuelve NOT_SUBMITTED cuando no hay verificaciones', async () => {
		const useCase = new GetVerificationStatus(new FakeVerificationRepository(null));

		const result = await useCase.execute('account-1');

		expect(result.status).toBe('NOT_SUBMITTED');
		expect(result.createdAt).toBeNull();
	});

	it('devuelve el estado de la ultima verificacion', async () => {
		const latest: Verification = {
			id: 'ver-1',
			accountId: 'account-1',
			type: 'KYC',
			status: 'REJECTED',
			documentUrl: 'https://x',
			rejectionReason: 'Documento ilegible',
			reviewedAt: new Date('2026-06-15T10:00:00.000Z'),
			createdAt: new Date('2026-06-15T00:00:00.000Z'),
		};
		const useCase = new GetVerificationStatus(new FakeVerificationRepository(latest));

		const result = await useCase.execute('account-1');

		expect(result.status).toBe('REJECTED');
		expect(result.rejectionReason).toBe('Documento ilegible');
		expect(result.reviewedAt).toBe('2026-06-15T10:00:00.000Z');
	});
});
