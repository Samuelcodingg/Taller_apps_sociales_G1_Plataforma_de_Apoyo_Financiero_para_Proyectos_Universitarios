import { ROLES } from "@/lib/constants";
import { AuthProvider } from "./auth";

export type User = {
  id: string;
  names: string;
  lastNames: string;
  email: string;
  role: Role;
  university?: string;
  major?: string;
  birthDate?: string;
  country?: string;
  provider: AuthProvider;
  createdAt: string;
} | null;

export type Role = (typeof ROLES)[number];
export type AccountType = Exclude<Role, "ADMIN">;
