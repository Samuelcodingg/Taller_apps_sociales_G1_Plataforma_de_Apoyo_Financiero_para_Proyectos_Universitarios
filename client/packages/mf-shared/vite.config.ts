import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import federation from "@originjs/vite-plugin-federation";
import { PORTS, federationShared, mfBuild } from "../../mf.config";

// mf-shared cumple dos papeles:
//  1) librería de código fuente (design system, tipos, helpers) que cada MFE
//     importa por alias y empaqueta en su propio bundle — no tiene estado;
//  2) remote de Module Federation que expone `./state`: el store de Redux, el
//     apiSlice de RTK Query y el authSlice. Al venir de un único remote, existe
//     una sola instancia en runtime para el shell y todos los microfrontends.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "mf_shared",
      filename: "remoteEntry.js",
      exposes: { "./state": "./src/state/index.ts" },
      shared: federationShared,
    }),
  ],
  resolve: {
    alias: [
      { find: "@/store/store", replacement: path.resolve(__dirname, "src/state/store.ts") },
      { find: "@/slices/apiSlice", replacement: path.resolve(__dirname, "src/state/apiSlice.ts") },
      { find: "@/slices/authSlice", replacement: path.resolve(__dirname, "src/state/authSlice.ts") },
      { find: "@/services/baseQuery", replacement: path.resolve(__dirname, "src/state/baseQuery.ts") },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
  preview: { port: PORTS.shared, strictPort: true, cors: true },
  build: mfBuild,
});
