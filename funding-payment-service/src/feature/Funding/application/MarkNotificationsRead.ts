import { IFundingRepository } from '../domain/IFundingRepository';

export class MarkNotificationsRead {
	constructor(private readonly repository: IFundingRepository) {}

	// Marca como leidas todas las notificaciones (o las indicadas) del usuario.
	execute(accountId: string, ids?: string[]): Promise<void> {
		return this.repository.markNotificationsRead(accountId, ids);
	}
}
