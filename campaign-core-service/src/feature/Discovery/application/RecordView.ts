import { IDiscoveryRepository } from '../domain/IDiscoveryRepository';

export class RecordView {
	constructor(private readonly repository: IDiscoveryRepository) {}

	// Solo registra el clic si hay un usuario identificado (para personalizar).
	async execute(campaignId: string, accountId: string | null): Promise<void> {
		if (!accountId) return;
		await this.repository.recordView(campaignId, accountId);
	}
}
