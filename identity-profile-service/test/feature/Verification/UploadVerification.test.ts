import { UploadVerification } from '../../../src/feature/Verification/application/UploadVerification';
import { ValidationError } from '../../../src/shared/errors';
import {
	CreateVerificationInput,
	IVerificationRepository,
} from '../../../src/feature/Verification/domain/IVerificationRepository';
import {
	IVerificationEventPublisher,
	VerificationRequestedEvent,
} from '../../../src/feature/Verification/domain/IVerificationEventPublisher';
import { Verification } from '../../../src/feature/Verification/domain/Verification';

class CapturingVerificationRepository implements IVerificationRepository {
	public lastInput?: CreateVerificationInput;

	async create(input: CreateVerificationInput): Promise<Verification> {
		this.lastInput = input;
		return {
			id: 'ver-1',
			accountId: input.accountId,
			type: input.type,
			status: input.status,
			documentUrl: input.documentUrl,
			rejectionReason: null,
			reviewedAt: null,
			createdAt: new Date('2026-06-15T00:00:00.000Z'),
		};
	}

	async findLatestByAccountId(): Promise<Verification | null> {
		return null;
	}
}

describe('UploadVerification', () => {
	it('crea una verificacion PENDING con tipo KYC por defecto', async () => {
		const repo = new CapturingVerificationRepository();
		const useCase = new UploadVerification(repo);

		const dto = await useCase.execute('account-1', { documentUrl: ' https://s3/doc.pdf ' });

		expect(repo.lastInput).toEqual({
			accountId: 'account-1',
			type: 'KYC',
			documentUrl: 'https://s3/doc.pdf',
			status: 'PENDING',
		});
		expect(dto.status).toBe('PENDING');
	});

	it('respeta un tipo explicito', async () => {
		const repo = new CapturingVerificationRepository();
		const useCase = new UploadVerification(repo);

		await useCase.execute('account-1', { documentUrl: 'https://x', type: 'ADDRESS' });

		expect(repo.lastInput?.type).toBe('ADDRESS');
	});

	it('rechaza una URL de documento vacia', async () => {
		const useCase = new UploadVerification(new CapturingVerificationRepository());

		await expect(useCase.execute('account-1', { documentUrl: '   ' })).rejects.toBeInstanceOf(
			ValidationError,
		);
	});

	it('publica el evento de verificacion con los tres datos clave', async () => {
		const repo = new CapturingVerificationRepository();
		const published: VerificationRequestedEvent[] = [];
		const publisher: IVerificationEventPublisher = {
			async publishVerificationRequested(event) {
				published.push(event);
			},
		};
		const useCase = new UploadVerification(repo, publisher);

		const dto = await useCase.execute('account-1', { documentUrl: 'https://x/doc.pdf' });

		expect(published).toEqual([
			{ verificationId: dto.id, accountId: 'account-1', documentUrl: 'https://x/doc.pdf' },
		]);
	});

	it('devuelve 201 (no falla) aunque la publicacion en SQS falle', async () => {
		const repo = new CapturingVerificationRepository();
		const publisher: IVerificationEventPublisher = {
			async publishVerificationRequested() {
				throw new Error('fallo de red SQS');
			},
		};
		const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const useCase = new UploadVerification(repo, publisher);

		const dto = await useCase.execute('account-1', { documentUrl: 'https://x/doc.pdf' });

		expect(dto.status).toBe('PENDING');
		expect(errorSpy).toHaveBeenCalled();
		errorSpy.mockRestore();
	});
});
