import { CampaignSummaryDTO } from '../../Campaign/application/dtos';

export interface ScoredCampaign extends CampaignSummaryDTO {
	score: number; // afinidad (feed) o indice de viralidad (tendencias)
	// Por que se recomienda esta campaña, redactado por el LLM. Solo viene en el
	// feed personalizado, y solo cuando lo sirve ai-analytics-service: el
	// fallback heuristico no sabe justificar sus recomendaciones.
	reason?: string | null;
}

export interface IDiscoveryRepository {
	// Feed personalizado para un donante segun su historial e intereses.
	getPersonalizedFeed(accountId: string, limit: number): Promise<ScoredCampaign[]>;

	// Campañas en tendencia segun el indice de viralidad.
	getTrending(limit: number): Promise<ScoredCampaign[]>;

	// Registra un clic/vista de una campaña (para personalizar el feed).
	recordView(campaignId: string, accountId: string | null): Promise<void>;
}
