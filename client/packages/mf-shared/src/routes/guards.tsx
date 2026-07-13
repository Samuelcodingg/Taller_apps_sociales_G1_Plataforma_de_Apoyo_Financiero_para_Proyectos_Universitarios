import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import ProtectedRoute from "./ProtectedRoute";

// Guards que usan los microfrontends para declarar sus rutas protegidas sin
// depender del shell: leen el auth del store compartido (mf-shared/state).
export const RequireAuth = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  return <ProtectedRoute isAllowed={!!user} />;
};

export const RequireRole = ({ role }: { role: "CREATOR" | "DONOR" | "ADMIN" }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  return <ProtectedRoute isAllowed={!!user && user.role === role} />;
};
