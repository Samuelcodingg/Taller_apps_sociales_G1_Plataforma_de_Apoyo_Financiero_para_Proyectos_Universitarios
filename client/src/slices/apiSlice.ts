import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "" }),
  endpoints: (builder) => ({
    // POST: Registrar un usuario
    registerUser: builder.mutation<{}, any>({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
    }),

    // POST: Iniciar sesión
    loginUser: builder.mutation<{}, any>({
      query: (data) => ({
        url: "",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useRegisterUserMutation, useLoginUserMutation } = apiSlice;
