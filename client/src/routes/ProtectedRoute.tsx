import { Navigate, Outlet } from "react-router-dom";

type ProtectedRouteProps = {
  children?: React.ReactNode;
  isAllowed: boolean;
  redirectTo?: string;
};

const ProtectedRoute = ({
  children,
  isAllowed,
  redirectTo = "/",
}: ProtectedRouteProps) => {
  if (!isAllowed) {
    return <Navigate to={redirectTo} />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
