import { GetMyProfile } from '../../../src/feature/Profile/application/GetMyProfile';
import { NotFoundError } from '../../../src/shared/errors';
import {
	IProfileRepository,
	UpdateProfileFields,
} from '../../../src/feature/Profile/domain/IProfileRepository';
import { Profile } from '../../../src/feature/Profile/domain/Profile';

const buildProfile = (overrides: Partial<Profile> = {}): Profile => ({
	id: 'profile-1',
	accountId: 'account-1',
	names: 'Diego',
	surnames: 'Linares',
	birthDate: new Date('1999-05-20T00:00:00.000Z'),
	biography: 'Estudiante',
	photoUrl: null,
	countryId: 'country-1',
	institutionId: 'inst-1',
	updatedAt: new Date('2026-06-15T00:00:00.000Z'),
	country: { id: 'country-1', name: 'Peru' },
	institution: { id: 'inst-1', name: 'UNI' },
	socialNetworks: [{ id: 'sn-1', platform: 'LINKEDIN', link: 'https://x' }],
	...overrides,
});

class FakeProfileRepository implements IProfileRepository {
	constructor(private profile: Profile | null) {}
	async findByAccountId(): Promise<Profile | null> {
		return this.profile;
	}
	async updateByAccountId(_accountId: string, _fields: UpdateProfileFields): Promise<Profile> {
		throw new Error('not used');
	}
}

describe('GetMyProfile', () => {
	it('devuelve el perfil mapeado a DTO cuando existe', async () => {
		const useCase = new GetMyProfile(new FakeProfileRepository(buildProfile()));

		const dto = await useCase.execute('account-1');

		expect(dto.names).toBe('Diego');
		expect(dto.birthDate).toBe('1999-05-20');
		expect(dto.country).toEqual({ id: 'country-1', name: 'Peru' });
		expect(dto.socialNetworks).toHaveLength(1);
	});

	it('lanza NotFoundError cuando el perfil no existe', async () => {
		const useCase = new GetMyProfile(new FakeProfileRepository(null));

		await expect(useCase.execute('account-1')).rejects.toBeInstanceOf(NotFoundError);
	});
});
