import { NotFoundError, ValidationError } from '../../../shared/errors';
import { ICampaignRepository } from '../domain/ICampaignRepository';
import { CommentDTO, CreateCommentInput } from './dtos';

export class AddComment {
	constructor(private readonly repository: ICampaignRepository) {}

	async execute(input: CreateCommentInput): Promise<CommentDTO> {
		const ownerId = await this.repository.getOwnerId(input.campaignId);
		if (ownerId === null) {
			throw new NotFoundError('La campaña no existe.');
		}

		const content = input.content?.trim() ?? '';
		if (content.length === 0) {
			throw new ValidationError('El comentario no puede estar vacio.');
		}

		return this.repository.addComment(
			input.campaignId,
			input.accountId,
			content,
			input.parentId ?? null,
		);
	}
}
