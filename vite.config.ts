import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: parseInt(process.env.PORT || "5173"),
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
  experimental: {
    renderBuiltUrl(filename: string) {
      if (filename.includes("manifest.json")) {
        return {
          replace: (code: string) =>
            code.replace(
              /%VITE_PRIMARY_COLOR%/g,
              process.env.VITE_PRIMARY_COLOR || "#000000"
            ),
        };
      }
    },
  },
});
