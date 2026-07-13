// Reglas de negocio para validar que el PDF subido es un REPORTE DE MATRICULA
// valido del periodo academico vigente. Funcion pura sobre el texto extraido del
// PDF; lanza Error con un mensaje claro en la primera regla incumplida (el
// entrypoint lo traduce a HTTP 400). No depende de frameworks ni de la BD.

// Periodo academico exigido para el registro de creadores.
const REQUIRED_PERIOD = { year: 2026, term: 1 };
// Anio en que debe haberse realizado la matricula via web.
const REQUIRED_ENROLLMENT_YEAR = 2026;

// Normaliza el texto: minusculas, sin tildes y con espacios colapsados, para que
// las expresiones regulares no dependan de acentos ni de saltos de linea.
const normalize = (text: string): string =>
	text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.trim();

export interface MatriculaInfo {
	period: string; // p. ej. "2026-1"
	enrollmentDate: string; // p. ej. "21/04/2026"
	subjectCount: number; // p. ej. 6
	fullName: string; // p. ej. "Linares Mostacero Diego Salvador"
	names: string; // p. ej. "Diego Salvador"
	surnames: string; // p. ej. "Linares Mostacero"
	faculty: string | null; // p. ej. "Ingenieria De Sistemas E Informatica"
	school: string | null; // Escuela/carrera, p. ej. "Ingenieria De Software"
}

// Extrae el valor de una linea "Etiqueta : N - Valor" del texto original,
// quitando el codigo numerico inicial y el prefijo "E.P. De" (Escuela Profesional).
const extractLabeled = (rawText: string, label: string): string | null => {
	const match = rawText.match(new RegExp(`${label}\\s*:?\\s*([^\\n\\r]+)`, 'i'));
	if (!match) return null;
	let value = match[1].trim();
	value = value.replace(/^\d+\s*-\s*/, ''); // quita "20 - "
	value = value.replace(/^E\.?\s*P\.?\s+De\s+/i, ''); // quita "E.P. De "
	value = value.trim();
	return value.length > 0 ? value : null;
};

// Convierte un texto en MAYUSCULAS a "Capitalizado Por Palabra".
const toTitleCase = (value: string): string =>
	value
		.toLowerCase()
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

// Separa "APELLIDOS y NOMBRES" segun la convencion peruana: los dos primeros
// tokens son apellidos y el resto son nombres. Si hay menos de 3 tokens, hace un
// reparto razonable para no fallar.
const splitFullName = (fullNameUpper: string): { names: string; surnames: string } => {
	const tokens = fullNameUpper.trim().split(/\s+/).filter(Boolean);
	if (tokens.length === 0) return { names: '', surnames: '' };
	if (tokens.length === 1) return { names: toTitleCase(tokens[0]), surnames: '' };
	if (tokens.length === 2)
		return { names: toTitleCase(tokens[1]), surnames: toTitleCase(tokens[0]) };
	return {
		surnames: toTitleCase(tokens.slice(0, 2).join(' ')),
		names: toTitleCase(tokens.slice(2).join(' ')),
	};
};

export const validateMatricula = (rawText: string): MatriculaInfo => {
	const text = normalize(rawText);

	// 1. Periodo academico: debe ser exactamente 2026-1.
	const periodMatch = text.match(/periodo academico\s*:?\s*(\d{4})\s*-\s*(\d+)/);
	if (!periodMatch) {
		throw new Error(
			'El PDF no corresponde a un reporte de matricula (no se encontro el periodo academico).',
		);
	}
	const year = Number(periodMatch[1]);
	const term = Number(periodMatch[2]);
	if (year !== REQUIRED_PERIOD.year || term !== REQUIRED_PERIOD.term) {
		throw new Error(
			`El periodo academico debe ser ${REQUIRED_PERIOD.year}-${REQUIRED_PERIOD.term}, pero el documento indica ${year}-${term}.`,
		);
	}

	// 2. Fecha de matricula: debe existir y ser del anio 2026. La modalidad
	// ("Via Web", "Presencial", ...) no condiciona la elegibilidad: basta con
	// estar matriculado, asi que aceptamos cualquiera.
	const dateMatch = text.match(/matricula\s+[a-z ]*?\|?\s*(\d{2})\/(\d{2})\/(\d{4})/);
	if (!dateMatch) {
		throw new Error('No se encontro la fecha de matricula en el documento.');
	}
	const enrollmentYear = Number(dateMatch[3]);
	if (enrollmentYear !== REQUIRED_ENROLLMENT_YEAR) {
		throw new Error(
			`La fecha de matricula debe ser del anio ${REQUIRED_ENROLLMENT_YEAR}, pero es del ${enrollmentYear}.`,
		);
	}
	const enrollmentDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;

	// 3. Asignaturas matriculadas: deben ser mas de una.
	const subjectsMatch = text.match(/asignaturas matriculadas\s*:?\s*(\d+)/);
	if (!subjectsMatch) {
		throw new Error('No se encontro el numero de asignaturas matriculadas en el documento.');
	}
	const subjectCount = Number(subjectsMatch[1]);
	if (subjectCount <= 1) {
		throw new Error(
			`Debes tener mas de una asignatura matriculada (el documento indica ${subjectCount}).`,
		);
	}

	// 4. Apellidos y Nombres: se extrae del TEXTO ORIGINAL (no normalizado) para
	// preservar acentos y luego capitalizar. Estos datos se usan para completar
	// el perfil del creador (lo que en produccion haria la IA).
	const nameMatch = rawText.match(/Apellidos\s+y\s+Nombres\s*:?\s*([^\n\r]+)/i);
	const fullNameUpper = nameMatch ? nameMatch[1].trim() : '';
	const { names, surnames } = splitFullName(fullNameUpper);
	const fullName = toTitleCase(fullNameUpper);

	// Facultad y Escuela (carrera) del reporte. La escuela es lo que el usuario ve
	// como "carrera" (p. ej. Ingenieria De Software).
	const facultyRaw = extractLabeled(rawText, 'Facultad');
	const schoolRaw = extractLabeled(rawText, 'Escuela');
	const faculty = facultyRaw ? toTitleCase(facultyRaw) : null;
	const school = schoolRaw ? toTitleCase(schoolRaw) : null;

	return {
		period: `${year}-${term}`,
		enrollmentDate,
		subjectCount,
		fullName,
		names,
		surnames,
		faculty,
		school,
	};
};
