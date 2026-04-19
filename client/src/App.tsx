import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Validacion from "./pages/Validacion.tsx";
import Perfil from "./pages/Perfil.tsx";
import Explorar from "./pages/Explorar.tsx";
import Tendencias from "./pages/Tendencias.tsx";
import Crear from "./pages/Crear.tsx";
import Campana from "./pages/Campana.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Admin from "./pages/Admin.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/validacion" element={<Validacion />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/tendencias" element={<Tendencias />} />
          <Route path="/crear" element={<Crear />} />
          <Route path="/campana/:id" element={<Campana />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
