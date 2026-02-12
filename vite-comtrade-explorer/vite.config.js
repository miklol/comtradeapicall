import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "https://comtradeapi.un.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
        secure: true,
      },
      "/files": {
        target: "https://comtradeapi.un.org",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
