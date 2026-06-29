// DTOs de entrada/salida de la feature Campaign.

// --- Entrada ---
export interface MediaFile {
	buffer: Buffer;
	mimetype: string;
	originalName: string;
}

export interface CreateCampaignInput {
	creatorId: string;
	title: string;
	description: string;
	goalAmount: number;
	endDate: string; // ISO o yyyy-mm-dd
	media?: MediaFile;
	// 'DRAFT' guarda como borrador; cualquier otro valor publica (ACTIVE).
	status?: string;
}

// Datos ya validados que el repositorio persiste.
export interface CreateCampaignData {
	id: string;
	creatorId: string;
	title: string;
	description: string;
	goalAmount: number;
	endDate: Date;
	status: string;
	categories: string[];
	media?: { type: 'IMAGE' | 'VIDEO'; url: string };
}

export interface EditCampaignInput {
	id: string;
	requesterId: string;
	title?: string;
	description?: string;
	goalAmount?: number;
	endDate?: string;
	status?: string;
}

export interface CreateUpdateInput {
	campaignId: string;
	requesterId: string;
	title?: string;
	message: string;
	image?: MediaFile; // foto opcional de la actualizacion
}

export interface CreateCommentInput {
	campaignId: string;
	accountId: string;
	content: string;
	parentId?: string | null;
}

// LIKE/SHARE (reacciones), BOOKMARK (favorito), FOLLOW (seguimiento),
// INTEREST (matchmaking: interes/conexion de empresa o inversionista).
export type InteractionType = 'LIKE' | 'SHARE' | 'BOOKMARK' | 'FOLLOW' | 'INTEREST';

export interface InteractionInput {
	campaignId: string;
	accountId: string;
	type: InteractionType;
}

export interface InteractionResultDTO {
	type: InteractionType;
	active: boolean; // para LIKE: si quedo activo (toggle). SHARE: siempre true.
	likes: number;
	shares: number;
}

// --- Salida ---
export interface CreatorDTO {
	id: string | null;
	name: string; // "Nombres Apellidos"
	university: string | null;
	career: string | null;
	verified: boolean;
}

export interface MediaDTO {
	type: string; // IMAGE | VIDEO
	url: string;
}

export interface CampaignUpdateDTO {
	id: string;
	title: string | null;
	message: string;
	imageUrl: string | null;
	createdAt: string;
}

export interface CommentDTO {
	id: string;
	author: string;
	content: string;
	parentId: string | null;
	createdAt: string;
}

export interface RecentDonationDTO {
	donor: string; // nombre o "Anonimo"
	amount: number;
	donatedAt: string; // ISO
	timeAgo: string; // "hace 2 dias"
}

// Datos basicos compartidos por el resumen y el detalle.
export interface CampaignSummaryDTO {
	id: string;
	title: string;
	description: string;
	goalAmount: number;
	currentAmount: number;
	status: string;
	endDate: string;
	createdAt: string;
	cover: MediaDTO | null;
	categories: string[];
	creator: CreatorDTO;
	donorsCount: number;
	likes: number;
	shares: number;
}

// Detalle completo de una campaña (lo que pide el front en la vista de campaña).
export interface CampaignDetailDTO extends CampaignSummaryDTO {
	media: MediaDTO[];
	updates: CampaignUpdateDTO[];
	comments: CommentDTO[];
	recentDonations: RecentDonationDTO[];
	bookmarks: number;
	follows: number;
	interests: number;
	// Tipos de interaccion que el usuario actual tiene con la campaña (si hay sesion).
	myInteractions: string[];
}
