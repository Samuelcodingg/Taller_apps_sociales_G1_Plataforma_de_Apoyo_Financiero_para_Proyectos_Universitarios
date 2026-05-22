import Admin from "@/pages/Admin";
import Auth from "@/pages/Auth";
import Campana from "@/pages/Campana";
import Crear from "@/pages/Crear";
import Dashboard from "@/pages/Dashboard";
import Explorar from "@/pages/Explorar";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Perfil from "@/pages/Perfil";
import Tendencias from "@/pages/Tendencias";
import Validacion from "@/pages/Validacion";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import MyDonations from "@/pages/MyDonations";
import { ROLES } from "@/lib/constants";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const AppRoutes = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/validation" element={<Validacion />} />
      <Route path="/explorar" element={<Explorar />} />
      <Route path="/tendencias" element={<Tendencias />} />
      <Route path="/campana/:id" element={<Campana />} />
      <Route element={<ProtectedRoute isAllowed={!!user} />}>
        <Route path="/profile" element={<Perfil />} />
      </Route>
      {/* Rutas del usuario "creator" */}
      <Route
        element={
          <ProtectedRoute isAllowed={!!user && user.role === ROLES[0]} />
        }
      >
        <Route path="/crear" element={<Crear />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      {/* Rutas del usuario "donor" */}
      <Route
        element={
          <ProtectedRoute isAllowed={!!user && user.role === ROLES[1]} />
        }
      >
        <Route path="/donations" element={<MyDonations />} />
      </Route>
      {/* Rutas del usuario "admin" */}
      <Route
        element={
          <ProtectedRoute isAllowed={!!user && user.role === ROLES[2]} />
        }
      >
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
