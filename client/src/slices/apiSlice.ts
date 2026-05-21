import { baseQueryWithReauth } from "@/services/baseQuery";
import {
  AuthResponse,
  LoginRequest,
  RefreshResponse,
  RegisterCreatorRequest,
  RegisterCreatorResponse,
  RegisterDonorRequest,
  RegisterDonorResponse,
} from "@/types/auth";
import {
  ValidateStudentDocumentRequest,
  ValidationResponse,
} from "@/types/validation";
import { createApi } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    registerCreator: builder.mutation<
      RegisterCreatorResponse,
      RegisterCreatorRequest
    >({
      query: (data) => ({
        url: "/api/auth/register/creator",
        method: "POST",
        body: data,
      }),
    }),

    registerDonor: builder.mutation<
      RegisterDonorResponse,
      RegisterDonorRequest
    >({
      query: (data) => ({
        url: "/api/auth/register/donor",
        method: "POST",
        body: data,
      }),
    }),

    validateStudentDocument: builder.mutation<
      ValidationResponse,
      ValidateStudentDocumentRequest
    >({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
    }),

    // Probar esto -> Ya cree un usuario "DONOR" donador@gmail.com | 123456
    loginUser: builder.mutation<AuthResponse, LoginRequest>({
      query: (data) => ({
        url: "/api/auth/login",
        method: "POST",
        body: data,
      }),
    }),

    refreshToken: builder.mutation<RefreshResponse, { refreshToken: string }>({
      query: (data) => ({
        url: "/api/auth/refresh",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useRegisterCreatorMutation,
  useRegisterDonorMutation,
  useValidateStudentDocumentMutation,
  useLoginUserMutation,
  useRefreshTokenMutation,
} = apiSlice;
