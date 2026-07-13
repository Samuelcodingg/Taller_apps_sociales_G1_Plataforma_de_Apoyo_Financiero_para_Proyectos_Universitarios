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

// Microfrontend "donations": expone sus rutas al shell y consume el estado
// (store + apiSlice) desde el remote mf-shared.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "mf_donations",
      filename: "remoteEntry.js",
      exposes: { "./routes": "./src/routes.tsx" },
      remotes: sharedStateRemote(),
      shared: federationShared,
    }),
  ],
  resolve: { alias: mfAliases(__dirname) },
  server: { port: PORTS.donations, strictPort: true },
  preview: { port: PORTS.donations, strictPort: true, cors: true },
  build: mfBuild,
});
