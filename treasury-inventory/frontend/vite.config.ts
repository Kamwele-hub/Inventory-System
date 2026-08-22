import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    // Split heavy vendor chunks so the initial load stays small under
    // low-bandwidth conditions (relevant for county/field offices).
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          scanner: ["@zxing/browser"],
        },
      },
    },
  },
});
