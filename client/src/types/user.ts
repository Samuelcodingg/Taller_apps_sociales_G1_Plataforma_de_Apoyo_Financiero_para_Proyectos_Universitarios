export type User = {
  id: number;
  name: string;
  role: Role;
  email: string;
} | null;

export type Role = "creator" | "donor" | "admin";

export type AccountType = Exclude<Role, "admin">;
