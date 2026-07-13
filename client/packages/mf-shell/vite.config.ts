import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";
import { componentTagger } from "lovable-tagger";
import { PORTS, federationShared, mfAliases, mfBuild, shellRemotes } from "../../mf.config";

// Shell (host): no tiene lógica de negocio. Monta el layout, crea el Provider
// con el store que viene de mf-shared y compone las rutas que exponen los
// microfrontends de auth, campañas, donaciones y admin.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    federation({
      name: "mf_shell",
      remotes: shellRemotes(),
      shared: federationShared,
    }),
  ].filter(Boolean),
  resolve: { alias: mfAliases(__dirname) },
  server: { host: "::", port: PORTS.shell, strictPort: true, hmr: { overlay: false } },
  preview: { port: PORTS.shell, strictPort: true },
  build: { ...mfBuild, minify: mode !== "development" },
}));
