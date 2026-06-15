import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../../shared/errors';
import { assertDatabaseUrl } from '../../../shared/config';
import { IProfileRepository, UpdateProfileFields } from '../domain/IProfileRepository';
import { Profile } from '../domain/Profile';

// El perfil siempre se carga con sus relaciones (pais, institucion, redes sociales).
const profileWithRelations = Prisma.validator<Prisma.ProfileDefaultArgs>()({
	include: { country: true, institution: true, social_network: true },
});

type ProfileWithRelations = Prisma.ProfileGetPayload<typeof profileWithRelations>;

export class ProfileRepository implements IProfileRepository {
	private readonly prisma: PrismaClient;

	constructor(prismaClient?: PrismaClient) {
		if (prismaClient) {
			this.prisma = prismaClient;
			return;
		}

		const databaseUrl = assertDatabaseUrl();
		const adapter = new PrismaMariaDb(databaseUrl);
		this.prisma = new PrismaClient({ adapter });
	}

	async findByAccountId(accountId: string): Promise<Profile | null> {
		const profile = await this.prisma.profile.findFirst({
			where: { accountId },
			...profileWithRelations,
		});

		return profile ? this.toDomain(profile) : null;
	}

	async updateByAccountId(accountId: string, fields: UpdateProfileFields): Promise<Profile> {
		const profile = await this.prisma.$transaction(async (tx) => {
			const existing = await tx.profile.findFirst({ where: { accountId } });
			if (!existing) {
				throw new NotFoundError('El perfil del usuario no existe.');
			}

			await tx.profile.update({
				where: { id: existing.id },
				data: {
					names: fields.names,
					surnames: fields.surnames,
					biography: fields.biography,
					photoUrl: fields.photoUrl,
					birthDate: fields.birthDate,
					id_country: fields.countryId,
					id_institution: fields.institutionId,
					updated_at: new Date(),
				},
			});

			// Estrategia de reemplazo total de redes sociales si se enviaron.
			if (fields.socialNetworks) {
				await tx.social_network.deleteMany({ where: { id_profile: existing.id } });
				if (fields.socialNetworks.length > 0) {
					await tx.social_network.createMany({
						data: fields.socialNetworks.map((sn) => ({
							id_social_media: randomUUID(),
							id_profile: existing.id,
							platform: sn.platform,
							link: sn.link,
						})),
					});
				}
			}

			const updated = await tx.profile.findUniqueOrThrow({
				where: { id: existing.id },
				...profileWithRelations,
			});

			return updated;
		});

		return this.toDomain(profile);
	}

	private toDomain(row: ProfileWithRelations): Profile {
		return {
			id: row.id,
			accountId: row.accountId,
			names: row.names,
			surnames: row.surnames,
			birthDate: row.birthDate,
			biography: row.biography,
			photoUrl: row.photoUrl,
			countryId: row.id_country,
			institutionId: row.id_institution,
			updatedAt: row.updated_at,
			country: row.country
				? { id: row.country.id_country, name: row.country.name }
				: null,
			institution: row.institution
				? { id: row.institution.id, name: row.institution.name }
				: null,
			socialNetworks: row.social_network.map((sn) => ({
				id: sn.id_social_media,
				platform: sn.platform,
				link: sn.link,
			})),
		};
	}
}
