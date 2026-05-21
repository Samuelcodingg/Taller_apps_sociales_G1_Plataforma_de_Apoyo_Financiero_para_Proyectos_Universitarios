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

export const BASE_SERVER_URL =
  "https://ci811iju6g.execute-api.us-east-2.amazonaws.com";
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
  { title: "Mi perfil", url: "/perfil", icon: User },
];

export const SIDEBAR_DONOR = [
  { title: "Mis donaciones", url: "/donations", icon: LayoutDashboard },
  { title: "Mi perfil", url: "/perfil", icon: User },
];

export const SIDEBAR_ACCOUNT = [
  { title: "Registro / Inicio de sesión", url: "/auth", icon: LogIn },
  // { title: "Iniciar sesión", url: "/login", icon: LogIn },
];

export const SIDEBAR_ADMIN = [
  { title: "Administración", url: "/admin", icon: ShieldCheck },
];
