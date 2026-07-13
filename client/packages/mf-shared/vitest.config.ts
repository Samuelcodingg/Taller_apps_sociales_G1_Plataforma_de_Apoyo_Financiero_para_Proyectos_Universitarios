import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@/store/store", replacement: path.resolve(__dirname, "src/state/store.ts") },
      { find: "@/slices/apiSlice", replacement: path.resolve(__dirname, "src/state/apiSlice.ts") },
      { find: "@/slices/authSlice", replacement: path.resolve(__dirname, "src/state/authSlice.ts") },
      { find: "@/services/baseQuery", replacement: path.resolve(__dirname, "src/state/baseQuery.ts") },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
