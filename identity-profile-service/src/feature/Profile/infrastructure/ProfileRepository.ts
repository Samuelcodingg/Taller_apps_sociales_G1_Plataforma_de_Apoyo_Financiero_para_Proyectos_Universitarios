import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../../shared/errors';
import { databaseAdapterConfig } from '../../../shared/config';
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

		const adapter = new PrismaMariaDb(databaseAdapterConfig());
		this.prisma = new PrismaClient({ adapter });
	}

	async findByAccountId(accountId: string): Promise<Profile | null> {
		const profile = await this.prisma.profile.findFirst({
			where: { accountId },
			...profileWithRelations,
		});

		if (!profile) return null;

		const extracted = await this.getExtractedAcademic(accountId);
		return this.toDomain(profile, extracted);
	}

	// Lee la universidad y la escuela de la ultima verificacion con datos extraidos
	// (verification.extracted_data) del usuario.
	private async getExtractedAcademic(
		accountId: string,
	): Promise<{ university: string | null; school: string | null }> {
		const verifications = await this.prisma.verification.findMany({
			where: { id_account: accountId },
			orderBy: { created_at: 'desc' },
			take: 10,
		});
		const withData = verifications.find((v) => v.extracted_data);
		const data = (withData?.extracted_data ?? {}) as Record<string, unknown>;
		// Acepta tanto las llaves que escribe identity (university/school) como las
		// que escribe el servicio de IA en español (universidad/escuela).
		const pick = (...keys: string[]): string | null => {
			for (const k of keys) {
				const v = data[k];
				if (typeof v === 'string' && v.trim()) return v;
			}
			return null;
		};
		return {
			university: pick('university', 'universidad'),
			school: pick('school', 'escuela'),
		};
	}

	async updateByAccountId(accountId: string, fields: UpdateProfileFields): Promise<Profile> {
		const profile = await this.prisma.$transaction(async (tx) => {
			const existing = await tx.profile.findFirst({ where: { accountId } });
			if (!existing) {
				throw new NotFoundError('El perfil del usuario no existe.');
			}

			// Resolucion del pais por nombre (find-or-create) si se envio countryName.
			// undefined => no se toca; null => se limpia; texto => se resuelve/crea.
			let resolvedCountryId = fields.countryId;
			if (fields.countryName !== undefined) {
				if (fields.countryName === null) {
					resolvedCountryId = null;
				} else {
					const found = await tx.country.findFirst({ where: { name: fields.countryName } });
					resolvedCountryId = found
						? found.id_country
						: (
								await tx.country.create({
									data: { id_country: randomUUID(), name: fields.countryName },
								})
							).id_country;
				}
			}

			await tx.profile.update({
				where: { id: existing.id },
				data: {
					names: fields.names,
					surnames: fields.surnames,
					biography: fields.biography,
					photoUrl: fields.photoUrl,
					yapeQrUrl: fields.yapeQrUrl,
					birthDate: fields.birthDate,
					id_country: resolvedCountryId,
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

		const extracted = await this.getExtractedAcademic(accountId);
		return this.toDomain(profile, extracted);
	}

	private toDomain(
		row: ProfileWithRelations,
		extracted: { university: string | null; school: string | null } = {
			university: null,
			school: null,
		},
	): Profile {
		return {
			id: row.id,
			accountId: row.accountId,
			names: row.names,
			surnames: row.surnames,
			birthDate: row.birthDate,
			biography: row.biography,
			photoUrl: row.photoUrl,
			yapeQrUrl: row.yapeQrUrl,
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
			university: extracted.university,
			school: extracted.school,
		};
	}
}
