import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // deployments/testnet.json lives in the repo root, one level up.
  server: { fs: { allow: [".."] } },
  build: { target: "es2022", chunkSizeWarningLimit: 1500 },
  test: { environment: "node", include: ["src/**/*.test.js"] },
});
