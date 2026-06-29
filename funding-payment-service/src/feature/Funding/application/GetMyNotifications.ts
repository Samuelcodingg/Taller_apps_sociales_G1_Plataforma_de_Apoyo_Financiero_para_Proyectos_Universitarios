import { IFundingRepository } from '../domain/IFundingRepository';

export interface NotificationDTO {
	id: string;
	type: string;
	title: string;
	body: string | null;
	entityType: string | null;
	entityId: string | null;
	isRead: boolean;
	createdAt: string;
}

export interface NotificationsResultDTO {
	unread: number;
	items: NotificationDTO[];
}

export class GetMyNotifications {
	constructor(private readonly repository: IFundingRepository) {}

	async execute(accountId: string): Promise<NotificationsResultDTO> {
		const rows = await this.repository.listNotifications(accountId);
		const items = rows.map((n) => ({
			id: n.id,
			type: n.type,
			title: n.title,
			body: n.body,
			entityType: n.entityType,
			entityId: n.entityId,
			isRead: n.isRead,
			createdAt: n.createdAt.toISOString(),
		}));
		return { unread: items.filter((n) => !n.isRead).length, items };
	}
}
