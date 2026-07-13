import type { RouteObject } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

// Rutas propias del shell + las que aportan los microfrontends.
const App = ({ remoteRoutes }: { remoteRoutes: RouteObject[] }) =>
  useRoutes([
    { path: "/", element: <Index /> },
    ...remoteRoutes,
    { path: "*", element: <NotFound /> },
  ]);

export default App;
