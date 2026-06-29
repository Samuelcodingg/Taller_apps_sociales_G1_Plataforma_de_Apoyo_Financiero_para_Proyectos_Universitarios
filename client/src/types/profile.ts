// Espejo del ProfileDTO que devuelve el back en GET /api/profile/me.
export type ProfileResponse = {
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
};

// Cuerpo aceptado por PUT /api/profile/me (todos los campos son opcionales).
export type UpdateProfileRequest = {
  names?: string;
  surnames?: string;
  biography?: string | null;
  birthDate?: string | null; // ISO yyyy-mm-dd
  socialNetworks?: Array<{ platform: string; link: string }>;
};

