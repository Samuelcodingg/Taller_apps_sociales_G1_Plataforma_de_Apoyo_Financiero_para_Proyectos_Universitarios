import c1 from "@/assets/campaign-1.jpg";
import c2 from "@/assets/campaign-2.jpg";
import c3 from "@/assets/campaign-3.jpg";
import c4 from "@/assets/campaign-4.jpg";

export type Campaign = {
  id: string;
  title: string;
  description: string;
  image: string;
  goal: number;
  raised: number;
  donors: number;
  deadline: string;
  university: string;
  faculty: string;
  categories: string[];
  status: "borrador" | "activa" | "finalizada";
  creator: { name: string; verified: boolean; avatar?: string };
  trending: number;
};

export const campaigns: Campaign[] = [
  {
    id: "1",
    title: "Huerto urbano universitario",
    description:
      "Transformar un espacio en desuso del campus en un huerto comunitario sostenible.",
    image: c1,
    goal: 8000,
    raised: 5420,
    donors: 142,
    deadline: "2025-06-30",
    university: "Universidad Nacional",
    faculty: "Ingeniería Ambiental",
    categories: ["Sostenibilidad", "Comunidad"],
    status: "activa",
    creator: { name: "María Fernández", verified: true },
    trending: 92,
  },
  {
    id: "2",
    title: "Robots educativos para colegios rurales",
    description:
      "Diseñamos kits de robótica accesibles para escuelas con bajos recursos.",
    image: c2,
    goal: 15000,
    raised: 11200,
    donors: 318,
    deadline: "2025-07-15",
    university: "PUCP",
    faculty: "Ingeniería Mecatrónica",
    categories: ["Tecnología", "Educación"],
    status: "activa",
    creator: { name: "Carlos Mendoza", verified: true },
    trending: 98,
  },
  {
    id: "3",
    title: "Biblioteca móvil para mi barrio",
    description:
      "Una biblioteca itinerante que llevará libros a niños de zonas periféricas.",
    image: c3,
    goal: 5000,
    raised: 1850,
    donors: 64,
    deadline: "2025-08-01",
    university: "Universidad Nacional",
    faculty: "Educación",
    categories: ["Educación", "Cultura"],
    status: "activa",
    creator: { name: "Lucía Ramos", verified: true },
    trending: 71,
  },
  {
    id: "4",
    title: "Documental: voces del altiplano",
    description:
      "Cortometraje documental sobre saberes ancestrales andinos.",
    image: c4,
    goal: 12000,
    raised: 9800,
    donors: 207,
    deadline: "2025-05-20",
    university: "UNMSM",
    faculty: "Comunicaciones",
    categories: ["Cultura", "Arte"],
    status: "activa",
    creator: { name: "Andrés Quispe", verified: true },
    trending: 88,
  },
];

export const allCategories = [
  "Sostenibilidad",
  "Tecnología",
  "Educación",
  "Cultura",
  "Arte",
  "Comunidad",
  "Salud",
  "Investigación",
];

export const universities = [
  "Universidad Nacional",
  "PUCP",
  "UNMSM",
  "UPC",
  "UNI",
];

export type Donation = {
  id: string;
  donor: string;
  amount: number;
  anonymous: boolean;
  date: string;
  message?: string;
};

export const recentDonations: Donation[] = [
  { id: "d1", donor: "Sofía P.", amount: 50, anonymous: false, date: "hace 2h", message: "¡Mucho éxito!" },
  { id: "d2", donor: "Anónimo", amount: 200, anonymous: true, date: "hace 5h" },
  { id: "d3", donor: "Diego R.", amount: 30, anonymous: false, date: "hace 1d", message: "Gran iniciativa." },
  { id: "d4", donor: "Anónimo", amount: 100, anonymous: true, date: "hace 1d" },
  { id: "d5", donor: "Valentina S.", amount: 75, anonymous: false, date: "hace 2d", message: "¡Vamos!" },
];

export const updates = [
  {
    id: "u1",
    date: "12 abr 2025",
    title: "Llegamos al 60% de la meta",
    body: "Gracias a todos. Ya empezamos la compra de materiales y comenzamos obras la próxima semana.",
  },
  {
    id: "u2",
    date: "5 abr 2025",
    title: "Primer taller con voluntarios",
    body: "Organizamos el primer encuentro con voluntarios del campus. Compartimos plan y cronograma.",
  },
];

export const comments = [
  { id: "c1", author: "Pedro M.", date: "hace 3h", body: "¡Increíble proyecto, sigan así!" },
  { id: "c2", author: "Ana L.", date: "hace 1d", body: "¿Cómo puedo ser voluntaria?" },
  { id: "c3", author: "Tomás G.", date: "hace 2d", body: "Compartido con mi grupo de amigos 💪" },
];
