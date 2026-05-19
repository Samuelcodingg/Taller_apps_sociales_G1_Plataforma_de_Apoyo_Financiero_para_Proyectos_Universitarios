import { ROLES } from "@/lib/constants";

export type User = {
  id: number;
  name: string;
  role: Role;
  email: string;
} | null;

export type Role = (typeof ROLES)[number];

export type AccountType = Exclude<Role, "admin">;
