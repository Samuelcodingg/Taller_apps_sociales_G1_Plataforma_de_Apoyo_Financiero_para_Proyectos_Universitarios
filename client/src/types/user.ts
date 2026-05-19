import { ROLES } from "@/lib/constants";

export type User = {
  id: string;
  name: string;
  role: Role;
  email: string;
} | null;

export type Role = (typeof ROLES)[number];

export type AccountType = Exclude<Role, "ADMIN">;
