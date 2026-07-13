import type { RouteObject } from "react-router-dom";
import { RequireRole } from "@/routes/guards";
import MyDonations from "@/pages/MyDonations";

// Rutas del dominio de donaciones/pagos (funding-payment-service).
const routes: RouteObject[] = [
  {
    element: <RequireRole role="DONOR" />,
    children: [{ path: "/donations", element: <MyDonations /> }],
  },
];

export default routes;
