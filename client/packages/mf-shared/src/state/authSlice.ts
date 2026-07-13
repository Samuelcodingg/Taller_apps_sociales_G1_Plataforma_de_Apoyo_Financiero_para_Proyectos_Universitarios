import { AuthState } from "@/types/auth";
import { User } from "@/types/user";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: AuthState = {
  user: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      // Borra el refresh token persistido; si no, al refrescar la página el
      // AuthInitializer lo leería y volvería a iniciar sesión.
      try {
        localStorage.removeItem("refreshToken");
      } catch {
        /* entornos sin localStorage */
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
