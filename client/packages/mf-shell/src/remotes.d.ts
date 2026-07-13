// Módulos servidos en runtime por Module Federation (no existen en disco).
declare module "mf_auth/routes" {
  import type { RouteObject } from "react-router-dom";
  const routes: RouteObject[];
  export default routes;
}
declare module "mf_campaigns/routes" {
  import type { RouteObject } from "react-router-dom";
  const routes: RouteObject[];
  export default routes;
}
declare module "mf_donations/routes" {
  import type { RouteObject } from "react-router-dom";
  const routes: RouteObject[];
  export default routes;
}
declare module "mf_admin/routes" {
  import type { RouteObject } from "react-router-dom";
  const routes: RouteObject[];
  export default routes;
}
