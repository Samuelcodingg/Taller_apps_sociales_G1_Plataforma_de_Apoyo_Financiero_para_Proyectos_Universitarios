// Categorizacion automatica (NLP ligero por palabras clave). A partir del titulo
// y la descripcion sugiere 1-3 categorias. No depende de servicios externos: es
// una funcion pura del dominio, facil de testear. En produccion podria
// reemplazarse por el servicio de IA sin cambiar el resto del codigo.

const KEYWORDS: Record<string, string[]> = {
	Educación: ['educa', 'aprendiz', 'escuela', 'colegio', 'beca', 'curso', 'taller', 'biblioteca', 'estudiante'],
	Tecnología: ['tecnolog', 'software', 'app', 'robot', 'innovaci', 'digital', 'datos', 'inteligencia artificial', 'ia ', 'web', 'hardware'],
	Salud: ['salud', 'medic', 'hospital', 'enfermer', 'mental', 'nutrici', 'clinic', 'psicolog'],
	'Medio Ambiente': ['ambient', 'ecolog', 'sosten', 'recicla', 'verde', 'huerto', 'arbol', 'energia', 'clima', 'agua', 'planta'],
	Cultura: ['cultura', 'arte', 'music', 'teatro', 'danza', 'cine', 'pintura', 'literatura', 'festival'],
	Deporte: ['deporte', 'futbol', 'basquet', 'atlet', 'gimnas', 'maraton', 'torneo'],
	Comunidad: ['comunidad', 'social', 'vecin', 'volunt', 'inclus', 'solidari', 'donaci', 'ayuda'],
	Emprendimiento: ['emprend', 'negocio', 'startup', 'empresa', 'comerci', 'producto', 'mercado'],
	Investigación: ['investiga', 'cientif', 'ciencia', 'tesis', 'laboratorio', 'estudio', 'experiment'],
};

const DEFAULT_CATEGORY = 'General';
const MAX_CATEGORIES = 3;

// Normaliza: minusculas y sin tildes.
const normalize = (text: string): string =>
	text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();

export const categorize = (title: string, description: string): string[] => {
	const text = normalize(`${title} ${description}`);

	const scored = Object.entries(KEYWORDS)
		.map(([category, words]) => {
			const score = words.reduce(
				(acc, word) => acc + (text.includes(normalize(word)) ? 1 : 0),
				0,
			);
			return { category, score };
		})
		.filter((c) => c.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, MAX_CATEGORIES)
		.map((c) => c.category);

	return scored.length > 0 ? scored : [DEFAULT_CATEGORY];
};
