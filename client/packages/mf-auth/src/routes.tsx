import type { RouteObject } from "react-router-dom";
import { RequireAuth } from "@/routes/guards";
import Auth from "@/pages/Auth";
import Perfil from "@/pages/Perfil";
import Validation from "@/pages/Validation";

// Rutas que este microfrontend aporta al shell (identidad y perfil).
const routes: RouteObject[] = [
  { path: "/auth", element: <Auth /> },
  { path: "/auth/validation", element: <Validation /> },
  {
    element: <RequireAuth />,
    children: [{ path: "/profile", element: <Perfil /> }],
  },
];

export default routes;
