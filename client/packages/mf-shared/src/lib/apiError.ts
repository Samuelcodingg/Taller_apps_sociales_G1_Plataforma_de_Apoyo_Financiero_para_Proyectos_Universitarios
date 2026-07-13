import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { ApiErrorResponse } from "@/types/api";

export const isFetchBaseQueryError = (
  error: unknown,
): error is FetchBaseQueryError & {
  data: ApiErrorResponse;
} => {
  return typeof error === "object" && error !== null && "data" in error;
};
