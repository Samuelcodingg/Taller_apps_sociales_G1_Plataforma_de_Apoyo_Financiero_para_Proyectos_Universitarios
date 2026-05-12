export type User = {
  id: number;
  name: string;
  rol: "creator" | "donor" | "admin";
  email: string;
} | null;
