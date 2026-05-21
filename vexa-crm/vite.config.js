// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "https://localhost:5001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("❌ Proxy error:", err);
          });
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("🚀 Proxying:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("✅ Received:", proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
});
