import { Verification } from '../domain/Verification';

export interface UploadVerificationInput {
	documentUrl: string;
	type?: string;
}

export interface VerificationDTO {
	id: string;
	type: string;
	status: string;
	documentUrl: string;
	rejectionReason: string | null;
	reviewedAt: string | null;
	createdAt: string;
}

export interface VerificationStatusDTO {
	status: string;
	type: string | null;
	rejectionReason: string | null;
	reviewedAt: string | null;
	createdAt: string | null;
}

export const toVerificationDTO = (v: Verification): VerificationDTO => ({
	id: v.id,
	type: v.type,
	status: v.status,
	documentUrl: v.documentUrl,
	rejectionReason: v.rejectionReason,
	reviewedAt: v.reviewedAt ? v.reviewedAt.toISOString() : null,
	createdAt: v.createdAt.toISOString(),
});
