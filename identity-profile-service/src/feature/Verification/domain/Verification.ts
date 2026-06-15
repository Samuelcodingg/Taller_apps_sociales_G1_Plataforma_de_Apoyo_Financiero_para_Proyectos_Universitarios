// Entidad de dominio Verification (KYC).
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Verification {
	id: string;
	accountId: string | null;
	type: string;
	status: string;
	documentUrl: string;
	rejectionReason: string | null;
	reviewedAt: Date | null;
	createdAt: Date;
}
