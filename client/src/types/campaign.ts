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
