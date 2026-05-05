import React, { useContext, useState } from "react";
import { createContext } from "react";

type User = {
  id: number;
  name: string;
  rol: "creator" | "donor" | "admin";
} | null;

type AuthContextType = {
  user: User;
  login: () => Promise<any>;
  logout: () => Promise<any>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  // const [user, setUser] = useState<User>({
  //   id: 1,
  //   name: "Jhunior",
  //   rol: "creator",
  // });

  const login = async () => {
    try {
    } catch (error) {}
  };

  const logout = async () => {
    try {
    } catch (error) {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
