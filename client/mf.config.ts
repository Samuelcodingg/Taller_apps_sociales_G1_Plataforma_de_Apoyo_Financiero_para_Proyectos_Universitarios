// Configuración compartida por todos los microfrontends.
// Aquí viven el mapa de puertos/remotes, los alias `@/...` y la lista de
// dependencias que DEBEN ser singleton en runtime (React, el router y Redux).
import path from "path";

export const PORTS = {
  shell: 8080,
  shared: 5001,
  auth: 5002,
  campaigns: 5003,
  donations: 5004,
  admin: 5005,
} as const;

// En despliegue, cada remote se sube al mismo bucket bajo /mf/<nombre>/ y la
// URL llega por env (p. ej. VITE_MF_AUTH_URL=/mf/auth/assets/remoteEntry.js).
// Se usa `||` y no `??` porque en CI la variable puede llegar como "".
const remoteUrl = (name: keyof typeof PORTS) =>
  process.env[`VITE_MF_${name.toUpperCase()}_URL`] ||
  `http://localhost:${PORTS[name]}/assets/remoteEntry.js`;

/** Remotes que consume el shell (el host de los microfrontends). */
export const shellRemotes = () => ({
  mf_shared: remoteUrl("shared"),
  mf_auth: remoteUrl("auth"),
  mf_campaigns: remoteUrl("campaigns"),
  mf_donations: remoteUrl("donations"),
  mf_admin: remoteUrl("admin"),
});

/** Todo microfrontend (y el shell) consume el estado desde mf-shared. */
export const sharedStateRemote = () => ({ mf_shared: remoteUrl("shared") });

/**
 * Singletons: si se duplican, se rompe todo.
 * - react/react-dom: dos copias => "invalid hook call".
 * - react-redux: el Provider del shell no llegaría al contexto del remote.
 * - @reduxjs/toolkit: RTK Query necesita UNA sola instancia de apiSlice.
 * - react-router-dom: un único contexto de navegación para toda la app.
 */
export const federationShared = {
  react: { singleton: true, requiredVersion: false },
  "react-dom": { singleton: true, requiredVersion: false },
  "react-redux": { singleton: true, requiredVersion: false },
  "@reduxjs/toolkit": { singleton: true, requiredVersion: false },
  "react-router-dom": { singleton: true, requiredVersion: false },
} as const;

const sharedSrc = path.resolve(__dirname, "packages/mf-shared/src");

/**
 * Alias de un microfrontend:
 * - el estado (store/slices/baseQuery) se redirige a un shim que lo toma del
 *   remote `mf_shared/state` => una sola instancia de store y de apiSlice;
 * - el resto de `@/...` (ui, lib, types, hooks) se resuelve al *código fuente*
 *   de mf-shared (se empaqueta en cada MFE; no tiene estado, no pasa nada);
 * - lo demás cae al `src` del propio microfrontend.
 */
export const mfAliases = (appDir: string) => {
  const stateShim = path.resolve(appDir, "src/state-remote.ts");
  return [
    { find: "@/store/store", replacement: stateShim },
    { find: "@/slices/apiSlice", replacement: stateShim },
    { find: "@/slices/authSlice", replacement: stateShim },
    { find: "@/services/baseQuery", replacement: stateShim },
    { find: "@/components", replacement: path.join(sharedSrc, "components") },
    { find: "@/hooks", replacement: path.join(sharedSrc, "hooks") },
    { find: "@/lib", replacement: path.join(sharedSrc, "lib") },
    { find: "@/schemas", replacement: path.join(sharedSrc, "schemas") },
    { find: "@/types", replacement: path.join(sharedSrc, "types") },
    { find: "@/assets", replacement: path.join(sharedSrc, "assets") },
    { find: "@/routes", replacement: path.join(sharedSrc, "routes") },
    { find: "@/index.css", replacement: path.join(sharedSrc, "index.css") },
    { find: "@", replacement: path.resolve(appDir, "src") },
  ];
};

/** Config de build común: los remotes exponen módulos ESM. */
export const mfBuild = {
  target: "esnext",
  minify: false,
  cssCodeSplit: false,
  modulePreload: false,
} as const;
