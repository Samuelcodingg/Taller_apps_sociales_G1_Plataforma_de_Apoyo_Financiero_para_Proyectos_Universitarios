import { User } from "@/types/user";
import React, { useContext, useState } from "react";
import { createContext } from "react";

type AuthContextType = {
  user: User;
  login: ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => Promise<any>;
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
  //   email: "jhunior@unmsm.edu.pe",
  // });

  const login = async ({ email, password }) => {
    try {
      const response = await fetch(
        `http://localhost:3000/users?email=${email}&password=${password}`,
      );

      if (!response.ok) {
        throw new Error("Ocurrió un problema al iniciar sesión");
      }

      const userData = await response.json();

      // Si existe un usuario
      if (userData.length > 0) {
        console.log("Login correcto: ", userData[0]);

        const user = {
          ...userData[0],
        };

        delete user.password;

        setUser(user as User);

        alert("Inicio de sesión exitoso");
      } else {
        console.log("Credenciales incorrectas");
        alert("Ocurrió un problema al iniciar sesión ...");
      }
    } catch (error) {
      console.error(error.message);
    }
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
