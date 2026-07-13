// Superficie pública del estado compartido (expuesta por Module Federation).
export { store } from "./store";
export type { RootState, AppDispatch } from "./store";
export { setCredentials, logout, authReducer } from "./authSlice";
export { baseQuery, baseQueryWithReauth } from "./baseQuery";
export * from "./apiSlice";
