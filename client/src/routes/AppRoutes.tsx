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
import MyDonations from "@/pages/MyDonations";
import Login from "@/pages/LoginPrueba";
import { ROLES } from "@/lib/constants";

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/register" element={<Auth />} />
      {/* No se está usando en otro lado a <Validacion /> */}
      <Route path="/register/validation" element={<Validacion />} />
      <Route path="/login" element={<Login />} />
      <Route path="/explorar" element={<Explorar />} />
      <Route path="/tendencias" element={<Tendencias />} />
      <Route path="/campana/:id" element={<Campana />} />
      <Route element={<ProtectedRoute isAllowed={!!user} />}>
        <Route path="/perfil" element={<Perfil />} />
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
