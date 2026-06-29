import { validateMatricula } from '../../../src/feature/Verification/domain/MatriculaValidation';

// Texto representativo de un reporte de matricula valido (formato real SUM-UNMSM).
const validText = `REPORTE DE MATRICULA
Código de Matrícula : 21200261
Apellidos y Nombres : LINARES MOSTACERO DIEGO SALVADOR
Periodo Académico : 2026-1
Situación : Regular Matrícula Vía Web | 21/04/2026 17:12:39
Asignaturas matriculadas: 6 Créditos matriculados: 18.0`;

describe('validateMatricula', () => {
	it('acepta un reporte valido y extrae periodo, fecha, asignaturas y nombre', () => {
		const info = validateMatricula(validText);
		expect(info).toEqual({
			period: '2026-1',
			enrollmentDate: '21/04/2026',
			subjectCount: 6,
			fullName: 'Linares Mostacero Diego Salvador',
			surnames: 'Linares Mostacero',
			names: 'Diego Salvador',
			faculty: null,
			school: null,
		});
	});

	it('rechaza un PDF que no es un reporte de matricula', () => {
		expect(() => validateMatricula('documento cualquiera sin datos de matricula')).toThrow(
			/no corresponde a un reporte de matricula/i,
		);
	});

	it('rechaza un periodo academico distinto de 2026-1', () => {
		expect(() => validateMatricula(validText.replace('2026-1', '2025-2'))).toThrow(
			/periodo academico debe ser 2026-1/i,
		);
	});

	it('rechaza una fecha de matricula via web que no es del 2026', () => {
		expect(() => validateMatricula(validText.replace('21/04/2026', '21/04/2025'))).toThrow(
			/anio 2026/i,
		);
	});

	it('rechaza cuando hay una sola asignatura matriculada', () => {
		expect(() =>
			validateMatricula(validText.replace('matriculadas: 6', 'matriculadas: 1')),
		).toThrow(/mas de una asignatura/i);
	});

	it('es tolerante a acentos y saltos de linea', () => {
		const messy = validText.replace(/\n/g, '   \n  ');
		expect(() => validateMatricula(messy)).not.toThrow();
	});
});
