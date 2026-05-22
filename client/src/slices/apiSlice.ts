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
import { createApi } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    registerCreator: builder.mutation<
      RegisterCreatorResponse,
      RegisterCreatorRequest
    >({
      query: (data) => {
        const formData = new FormData();

        formData.append("names", data.names);
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("accountType", data.accountType);
        formData.append("document", data.document);

        return {
          url: "/api/auth/register/creator",
          method: "POST",
          body: formData,
        };
      },
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
  useLoginUserMutation,
  useRefreshTokenMutation,
} = apiSlice;
