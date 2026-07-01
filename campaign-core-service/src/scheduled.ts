import type { Context } from 'aws-lambda';
import { DiscoveryRepository } from './feature/Discovery/infrastructure/DiscoveryRepository';

// Handler programado (EventBridge schedule). Recalcula el indice de viralidad de
// forma PERIODICA y persiste el snapshot en campaign_metrics, sin depender de que
// alguien abra la seccion de Tendencias.
export const recomputeTrending = async (_event: unknown, context: Context) => {
	context.callbackWaitsForEmptyEventLoop = false;
	const repo = new DiscoveryRepository();
	const top = await repo.getTrending(50);
	console.log(`[cron] indice de viralidad recalculado para ${top.length} campañas`);
	return { ok: true, count: top.length };
};
