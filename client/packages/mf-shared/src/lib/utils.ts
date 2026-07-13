import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitialsNames = (
  names: string | undefined,
  lastNames: string | undefined,
) => {
  const firstInitial = names ? names[0] : "J";
  const lastInitial = lastNames ? lastNames[0] : "D";
  return `${firstInitial}${lastInitial}`;
};
