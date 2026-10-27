import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // In development the client runs on Vite (5173) and the API on
    // Express (3000). This sends every /api request on to Express.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
