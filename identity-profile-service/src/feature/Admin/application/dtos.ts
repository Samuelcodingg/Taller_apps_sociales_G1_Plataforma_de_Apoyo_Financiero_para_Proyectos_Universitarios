// DTOs del panel de administracion.

export interface ListUsersQuery {
	search?: string;
	type?: string; // CREATOR | DONOR | ADMIN
	sort?: 'newest' | 'oldest';
}

export interface AdminUserListItemDTO {
	id: string;
	email: string;
	names: string;
	surnames: string;
	role: string;
	createdAt: string;
	lastLoginAt: string | null;
}

export interface AdminCampaignDTO {
	id: string;
	title: string;
	status: string;
	goalAmount: number;
	currentAmount: number;
	createdAt: string;
}

export interface AdminDonationDTO {
	id: string;
	amount: number;
	campaignTitle: string | null;
	status: string;
	isAnonymous: boolean;
	createdAt: string;
}

export interface AdminUserDetailDTO extends AdminUserListItemDTO {
	campaigns: AdminCampaignDTO[];
	donations: AdminDonationDTO[];
}

export interface CreateUserData {
	email: string;
	passwordHash: string;
	role: string;
	names?: string;
	surnames?: string;
}

// ---------- Proyectos (campañas) ----------
export interface ListCampaignsQuery {
	search?: string;
	status?: string; // DRAFT | ACTIVE | FINISHED
	sort?: 'newest' | 'oldest';
}

export interface AdminCampaignListItemDTO {
	id: string;
	title: string;
	status: string;
	goalAmount: number;
	currentAmount: number;
	categories: string[];
	creatorId: string | null;
	creatorName: string;
	creatorEmail: string | null;
	donorsCount: number;
	createdAt: string;
	endDate: string;
}

export interface AdminCampaignDetailDTO extends AdminCampaignListItemDTO {
	description: string;
	donations: AdminDonationDTO[];
}

export interface UpdateCampaignData {
	title?: string;
	description?: string;
	status?: string;
	goalAmount?: number;
}
