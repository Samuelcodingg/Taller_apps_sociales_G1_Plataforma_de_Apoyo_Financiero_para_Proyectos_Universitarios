import { Profile } from './Profile';

export interface UpdateProfileFields {
	names?: string;
	surnames?: string;
	biography?: string | null;
	birthDate?: Date | null;
	photoUrl?: string | null;
	yapeQrUrl?: string | null;
	countryId?: string | null;
	// Nombre del pais; el repositorio lo resuelve/crea y asigna el countryId.
	countryName?: string | null;
	institutionId?: string | null;
	// Si se provee, reemplaza el conjunto completo de redes sociales del perfil.
	socialNetworks?: Array<{ platform: string; link: string }>;
}

export interface IProfileRepository {
	findByAccountId(accountId: string): Promise<Profile | null>;
	updateByAccountId(accountId: string, fields: UpdateProfileFields): Promise<Profile>;
}
