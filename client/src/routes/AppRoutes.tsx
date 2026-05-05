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
import { useAuth } from "@/contexts/AuthProvider";
import Login from "@/pages/Login";

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      {/* No se está usando en otro lado a <Validacion /> */}
      <Route path="/auth/validacion" element={<Validacion />} />
      <Route path="/login" element={<Login />} />
      <Route path="/explorar" element={<Explorar />} />
      <Route path="/tendencias" element={<Tendencias />} />
      {/* Rutas del usuario "creator" */}
      <Route
        element={
          <ProtectedRoute isAllowed={!!user && user.rol === "creator"} />
        }
      >
        <Route path="/crear" element={<Crear />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
      <Route path="/campana/:id" element={<Campana />} />
      {/* Rutas del usuario "admin" */}
      <Route
        element={<ProtectedRoute isAllowed={!!user && user.rol === "admin"} />}
      >
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
