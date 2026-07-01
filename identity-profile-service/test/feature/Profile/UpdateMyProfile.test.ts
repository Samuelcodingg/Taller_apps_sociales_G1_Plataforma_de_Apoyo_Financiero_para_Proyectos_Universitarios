import { UpdateMyProfile } from '../../../src/feature/Profile/application/UpdateMyProfile';
import { ValidationError } from '../../../src/shared/errors';
import {
	IProfileRepository,
	UpdateProfileFields,
} from '../../../src/feature/Profile/domain/IProfileRepository';
import { Profile } from '../../../src/feature/Profile/domain/Profile';

class CapturingProfileRepository implements IProfileRepository {
	public lastFields?: UpdateProfileFields;

	async findByAccountId(): Promise<Profile | null> {
		throw new Error('not used');
	}

	async updateByAccountId(accountId: string, fields: UpdateProfileFields): Promise<Profile> {
		this.lastFields = fields;
		return {
			id: 'profile-1',
			accountId,
			names: fields.names ?? 'Diego',
			surnames: fields.surnames ?? 'Linares',
			birthDate: fields.birthDate ?? null,
			biography: fields.biography ?? null,
			photoUrl: fields.photoUrl ?? null,
			countryId: fields.countryId ?? null,
			institutionId: fields.institutionId ?? null,
			updatedAt: new Date('2026-06-15T00:00:00.000Z'),
			country: null,
			institution: null,
			university: null,
			school: null,
			yapeQrUrl: null,
			socialNetworks: (fields.socialNetworks ?? []).map((sn, i) => ({
				id: `sn-${i}`,
				platform: sn.platform,
				link: sn.link,
			})),
		};
	}
}

describe('UpdateMyProfile', () => {
	it('normaliza campos y delega al repositorio', async () => {
		const repo = new CapturingProfileRepository();
		const useCase = new UpdateMyProfile(repo);

		const dto = await useCase.execute('account-1', {
			names: '  Diego  ',
			biography: 'Hola',
			birthDate: '1999-05-20',
			socialNetworks: [{ platform: ' LINKEDIN ', link: ' https://x ' }],
		});

		expect(repo.lastFields?.names).toBe('Diego');
		expect(repo.lastFields?.birthDate).toBeInstanceOf(Date);
		expect(repo.lastFields?.socialNetworks).toEqual([{ platform: 'LINKEDIN', link: 'https://x' }]);
		expect(dto.socialNetworks).toHaveLength(1);
	});

	it('rechaza nombres vacios', async () => {
		const useCase = new UpdateMyProfile(new CapturingProfileRepository());

		await expect(useCase.execute('account-1', { names: '   ' })).rejects.toBeInstanceOf(
			ValidationError,
		);
	});

	it('rechaza fechas de nacimiento invalidas', async () => {
		const useCase = new UpdateMyProfile(new CapturingProfileRepository());

		await expect(
			useCase.execute('account-1', { birthDate: 'no-es-fecha' }),
		).rejects.toBeInstanceOf(ValidationError);
	});

	it('rechaza redes sociales mal formadas', async () => {
		const useCase = new UpdateMyProfile(new CapturingProfileRepository());

		await expect(
			// @ts-expect-error: probamos entrada invalida en runtime
			useCase.execute('account-1', { socialNetworks: [{ platform: 'X' }] }),
		).rejects.toBeInstanceOf(ValidationError);
	});
});
