import type { RouteObject } from "react-router-dom";

// Carga las rutas de cada microfrontend. Si un remote está caído, la app sigue
// funcionando sin esas rutas (degradación, no pantalla en blanco).
const load = async (name: string, importer: () => Promise<{ default: RouteObject[] }>) => {
  try {
    return (await importer()).default;
  } catch (error) {
    console.error(`[shell] no se pudo cargar el microfrontend "${name}"`, error);
    return [] as RouteObject[];
  }
};

export const loadRemoteRoutes = async (): Promise<RouteObject[]> => {
  const groups = await Promise.all([
    load("mf-auth", () => import("mf_auth/routes")),
    load("mf-campaigns", () => import("mf_campaigns/routes")),
    load("mf-donations", () => import("mf_donations/routes")),
    load("mf-admin", () => import("mf_admin/routes")),
  ]);

  return groups.flat();
};
