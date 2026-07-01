// Entidad de dominio Profile y sus tipos de salida publicos.
export interface SocialNetwork {
	id: string;
	platform: string;
	link: string;
}

export interface ProfileCountry {
	id: string;
	name: string | null;
}

export interface ProfileInstitution {
	id: string;
	name: string;
}

export interface Profile {
	id: string;
	accountId: string;
	names: string;
	surnames: string;
	birthDate: Date | null;
	biography: string | null;
	photoUrl: string | null;
	yapeQrUrl: string | null;
	countryId: string | null;
	institutionId: string | null;
	updatedAt: Date;
	country: ProfileCountry | null;
	institution: ProfileInstitution | null;
	socialNetworks: SocialNetwork[];
	// Datos academicos extraidos del reporte de matricula (verification.extracted_data).
	university: string | null;
	school: string | null;
}
