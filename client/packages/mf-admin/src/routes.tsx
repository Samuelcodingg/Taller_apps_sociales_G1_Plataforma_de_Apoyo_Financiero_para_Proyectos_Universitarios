import type { RouteObject } from "react-router-dom";
import { RequireRole } from "@/routes/guards";
import Admin from "@/pages/Admin";

// Panel de administración.
const routes: RouteObject[] = [
  {
    element: <RequireRole role="ADMIN" />,
    children: [{ path: "/admin", element: <Admin /> }],
  },
];

export default routes;
