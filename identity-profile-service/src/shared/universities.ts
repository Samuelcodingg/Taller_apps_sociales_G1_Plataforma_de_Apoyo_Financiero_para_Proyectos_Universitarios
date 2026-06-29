// Mapa de dominio de correo institucional -> nombre de universidad. El nombre de
// la universidad NO viene en la capa de texto del reporte de matricula (es el
// logo), asi que se deriva del dominio del correo con el que se registra.
const UNIVERSITY_BY_DOMAIN: Record<string, string> = {
	'unmsm.edu.pe': 'Universidad Nacional Mayor de San Marcos',
	'pucp.edu.pe': 'Pontificia Universidad Catolica del Peru',
	'uni.edu.pe': 'Universidad Nacional de Ingenieria',
	'upc.edu.pe': 'Universidad Peruana de Ciencias Aplicadas',
	'usil.pe': 'Universidad San Ignacio de Loyola',
	'ulima.edu.pe': 'Universidad de Lima',
	'unfv.edu.pe': 'Universidad Nacional Federico Villarreal',
};

// Devuelve el nombre de la universidad segun el dominio del correo, o null si no
// se reconoce el dominio.
export const universityFromEmail = (email: string): string | null => {
	const at = email.lastIndexOf('@');
	if (at < 0) return null;
	const domain = email.slice(at + 1).trim().toLowerCase();
	return UNIVERSITY_BY_DOMAIN[domain] ?? null;
};
