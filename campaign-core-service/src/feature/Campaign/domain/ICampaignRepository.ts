import {
	CampaignDetailDTO,
	CampaignSummaryDTO,
	CampaignUpdateDTO,
	CommentDTO,
	CreateCampaignData,
	InteractionResultDTO,
	InteractionType,
} from '../application/dtos';

export interface EditCampaignFields {
	title?: string;
	description?: string;
	goalAmount?: number;
	endDate?: Date;
	status?: string;
}

export interface ICampaignRepository {
	// Crea la campaña con sus categorias y multimedia. Devuelve el detalle.
	create(data: CreateCampaignData): Promise<CampaignDetailDTO>;

	// Lista todas las campañas (resumen) ordenadas por fecha de creacion desc.
	listSummaries(): Promise<CampaignSummaryDTO[]>;

	// Detalle completo de una campaña por id, o null si no existe. Si se pasa
	// viewerId, incluye que interacciones tiene ese usuario con la campaña.
	getDetail(id: string, viewerId?: string | null): Promise<CampaignDetailDTO | null>;

	// Resumenes de campañas con las que una cuenta tiene cierta interaccion
	// (favoritos, seguidas, interes).
	listSummariesByInteraction(accountId: string, type: string): Promise<CampaignSummaryDTO[]>;

	// Devuelve el id del creador de la campaña, o null si no existe.
	getOwnerId(id: string): Promise<string | null>;

	// Edita los campos indicados y devuelve el detalle actualizado.
	update(id: string, fields: EditCampaignFields): Promise<CampaignDetailDTO>;

	// Crea una actualizacion (campaign_update) con foto opcional y la devuelve.
	addUpdate(
		campaignId: string,
		title: string | null,
		message: string,
		imageUrl: string | null,
	): Promise<CampaignUpdateDTO>;

	// Crea un comentario (o respuesta si parentId) y lo devuelve.
	addComment(
		campaignId: string,
		accountId: string,
		content: string,
		parentId: string | null,
	): Promise<CommentDTO>;

	// LIKE: alterna (toggle). SHARE: registra siempre. Devuelve conteos.
	toggleInteraction(
		campaignId: string,
		accountId: string,
		type: InteractionType,
	): Promise<InteractionResultDTO>;
}
