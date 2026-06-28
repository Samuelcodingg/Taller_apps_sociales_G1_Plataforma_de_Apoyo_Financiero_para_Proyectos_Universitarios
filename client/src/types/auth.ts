import { AccountType, User } from "./user";

export type AuthState = {
  user: User | null;
  accessToken: string | null;
};

export type AuthProvider = "LOCAL" | "GOOGLE";

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type RefreshResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type RegisterDonorRequest = {
  // accountType: AccountType;
  names: string;
  lastNames: string;
  email: string;
  password: string;
};

export type RegisterDonorResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type RegisterCreatorRequest = {
  // accountType: AccountType;
  email: string;
  password: string;
  document: File;
};

export type RegisterCreatorResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};
