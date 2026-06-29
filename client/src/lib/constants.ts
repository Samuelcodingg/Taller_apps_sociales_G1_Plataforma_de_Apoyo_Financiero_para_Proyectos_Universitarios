import {
  Home,
  Search,
  PlusCircle,
  User,
  LayoutDashboard,
  LogIn,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

// Usa VITE_API_URL si esta definida (p. ej. .env.local con http://localhost:3000
// para desarrollo); si no, cae al backend desplegado en AWS.
// IMPORTANTE: se usa `||` (no `??`) a proposito: en CI la variable puede llegar
// como cadena vacia "" cuando no esta configurada, y "" debe caer al default
// (de lo contrario baseUrl queda vacio y las peticiones van al propio dominio).
export const BASE_SERVER_URL =
  import.meta.env.VITE_API_URL ||
  "https://ywf61bjrme.execute-api.us-east-2.amazonaws.com";

// Campaign Core Service (microservicio aparte). En dev apunta a localhost:3001
// via VITE_CAMPAIGN_API_URL; si no, al API Gateway desplegado de campaign-core.
export const BASE_CAMPAIGN_URL =
  import.meta.env.VITE_CAMPAIGN_API_URL ||
  "https://6rexq35702.execute-api.us-east-2.amazonaws.com";

// Funding & Payment Service. En dev apunta a localhost:3002 via
// VITE_FUNDING_API_URL; si no, al API Gateway desplegado de funding-payment.
export const BASE_FUNDING_URL =
  import.meta.env.VITE_FUNDING_API_URL ||
  "https://2w9335vf6f.execute-api.us-east-2.amazonaws.com";
export const ACCOUNT_TYPES = ["CREATOR", "DONOR"] as const;
export const ROLES = [...ACCOUNT_TYPES, "ADMIN"] as const;

export const SIDEBAR_MAIN = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Explorar", url: "/explorar", icon: Search },
  { title: "Tendencias", url: "/tendencias", icon: Sparkles },
];

export const SIDEBAR_CREATOR = [
  { title: "Crear campaña", url: "/crear", icon: PlusCircle },
  { title: "Mi panel", url: "/dashboard", icon: LayoutDashboard },
  { title: "Mi perfil", url: "/profile", icon: User },
];

export const SIDEBAR_DONOR = [
  { title: "Mis donaciones", url: "/donations", icon: LayoutDashboard },
  { title: "Mi perfil", url: "/profile", icon: User },
];

export const SIDEBAR_ACCOUNT = [
  { title: "Registro / Inicio de sesión", url: "/auth", icon: LogIn },
  // { title: "Iniciar sesión", url: "/login", icon: LogIn },
];

export const SIDEBAR_ADMIN = [
  { title: "Administración", url: "/admin", icon: ShieldCheck },
];
