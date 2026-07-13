import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";
import {
  PORTS,
  federationShared,
  mfAliases,
  mfBuild,
  sharedStateRemote,
} from "../../mf.config";

// Microfrontend "admin": expone sus rutas al shell y consume el estado
// (store + apiSlice) desde el remote mf-shared.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "mf_admin",
      filename: "remoteEntry.js",
      exposes: { "./routes": "./src/routes.tsx" },
      remotes: sharedStateRemote(),
      shared: federationShared,
    }),
  ],
  resolve: { alias: mfAliases(__dirname) },
  server: { port: PORTS.admin, strictPort: true },
  preview: { port: PORTS.admin, strictPort: true, cors: true },
  build: mfBuild,
});
