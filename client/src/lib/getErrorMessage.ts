import { isFetchBaseQueryError } from "./apiError";

export const getErrorMessage = (error: unknown): string => {
  if (isFetchBaseQueryError(error)) {
    return error.data.message ?? "Error del servidor";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Error inesperado";
};
