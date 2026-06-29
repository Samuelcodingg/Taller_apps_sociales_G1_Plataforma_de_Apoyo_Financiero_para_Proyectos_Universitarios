// Devuelve una descripcion en español de cuanto tiempo paso desde `date`.
// p. ej. "hace 5 minutos", "hace 2 horas", "hace 3 dias".
export const relativeTimeEs = (date: Date, now: Date = new Date()): string => {
	const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

	if (seconds < 60) return 'hace unos segundos';

	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;

	const days = Math.floor(hours / 24);
	if (days < 30) return `hace ${days} ${days === 1 ? 'dia' : 'dias'}`;

	const months = Math.floor(days / 30);
	if (months < 12) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;

	const years = Math.floor(months / 12);
	return `hace ${years} ${years === 1 ? 'año' : 'años'}`;
};
