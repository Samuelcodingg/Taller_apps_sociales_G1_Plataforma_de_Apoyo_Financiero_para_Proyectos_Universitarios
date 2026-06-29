// DTOs de entrada/salida del dominio Profile.
import { Profile } from '../domain/Profile';

export interface SocialNetworkInput {
	platform: string;
	link: string;
}

export interface UpdateProfileInput {
	names?: string;
	surnames?: string;
	biography?: string | null;
	birthDate?: string | null; // ISO date (yyyy-mm-dd)
	photoUrl?: string | null;
	countryId?: string | null;
	institutionId?: string | null;
	socialNetworks?: SocialNetworkInput[];
}

export interface ProfileDTO {
	id: string;
	accountId: string;
	names: string;
	surnames: string;
	birthDate: string | null;
	biography: string | null;
	photoUrl: string | null;
	country: { id: string; name: string | null } | null;
	institution: { id: string; name: string } | null;
	socialNetworks: Array<{ id: string; platform: string; link: string }>;
	university: string | null;
	school: string | null;
	updatedAt: string;
}

export const toProfileDTO = (profile: Profile): ProfileDTO => ({
	id: profile.id,
	accountId: profile.accountId,
	names: profile.names,
	surnames: profile.surnames,
	birthDate: profile.birthDate ? profile.birthDate.toISOString().slice(0, 10) : null,
	biography: profile.biography,
	photoUrl: profile.photoUrl,
	country: profile.country,
	institution: profile.institution,
	socialNetworks: profile.socialNetworks,
	university: profile.university,
	school: profile.school,
	updatedAt: profile.updatedAt.toISOString(),
});
