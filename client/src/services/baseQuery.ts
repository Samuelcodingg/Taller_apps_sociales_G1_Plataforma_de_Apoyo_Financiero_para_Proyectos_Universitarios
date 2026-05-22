import { BASE_SERVER_URL } from "@/lib/constants";
import { logout, setCredentials } from "@/slices/authSlice";
import { RootState } from "@/store/store";
import { RefreshResponse } from "@/types/auth";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { BaseQueryFn, FetchArgs, fetchBaseQuery } from "@reduxjs/toolkit/query";

export const baseQuery = fetchBaseQuery({
  baseUrl: BASE_SERVER_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");

    const refreshResult = await baseQuery(
      {
        url: "/api/auth/refresh-token",
        method: "POST",
        body: {
          refreshToken,
        },
      },
      api,
      extraOptions,
    );

    const refreshData = refreshResult.data as RefreshResponse;

    if (refreshData) {
      api.dispatch(
        setCredentials({
          user: refreshData.user,
          accessToken: refreshData.accessToken,
        }),
      );

      localStorage.setItem("refreshToken", refreshData.refreshToken);

      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};
