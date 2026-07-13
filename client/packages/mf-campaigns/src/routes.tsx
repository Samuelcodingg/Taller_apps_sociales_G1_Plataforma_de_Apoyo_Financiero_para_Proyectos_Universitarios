import type { RouteObject } from "react-router-dom";
import { RequireAuth, RequireRole } from "@/routes/guards";
import Campana from "@/pages/Campana";
import Crear from "@/pages/Crear";
import Dashboard from "@/pages/Dashboard";
import Explorar from "@/pages/Explorar";
import Guardados from "@/pages/Guardados";
import Tendencias from "@/pages/Tendencias";

// Rutas del dominio de campañas (campaign-core-service).
const routes: RouteObject[] = [
  { path: "/explorar", element: <Explorar /> },
  { path: "/tendencias", element: <Tendencias /> },
  { path: "/campana/:id", element: <Campana /> },
  {
    element: <RequireAuth />,
    children: [{ path: "/guardados", element: <Guardados /> }],
  },
  {
    element: <RequireRole role="CREATOR" />,
    children: [
      { path: "/crear", element: <Crear /> },
      { path: "/dashboard", element: <Dashboard /> },
    ],
  },
];

export default routes;
