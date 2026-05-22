import { useEffect, useState } from "react";
import { useRefreshTokenMutation } from "@/slices/apiSlice";
import { setCredentials } from "@/slices/authSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";
import AuthLoading from "./AuthLoading";

type AuthInitializerProps = {
  children: React.ReactNode;
};

const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [refreshTokenRequest] = useRefreshTokenMutation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          return;
        }

        const response = await refreshTokenRequest({
          refreshToken,
        }).unwrap();

        dispatch(
          setCredentials({
            user: response.user,
            accessToken: response.accessToken,
          }),
        );

        localStorage.setItem("refreshToken", response.refreshToken);
      } catch {
        localStorage.removeItem("refreshToken");
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  if (isLoading) {
    return <AuthLoading />;
  }

  return children;
};

export default AuthInitializer;
