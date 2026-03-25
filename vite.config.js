// vite.config.js
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Em dev, `/api` → proxy. Alvo padrão: API local HTTPS (launchSettings).
// Para testar contra a VPS: crie `.env.development` com, por exemplo:
// VITE_DEV_PROXY_TARGET=http://187.77.40.99:8080
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget =
    env.VITE_DEV_PROXY_TARGET?.trim() || "https://localhost:5001";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.log("❌ Proxy error:", err);
            });
            proxy.on("proxyReq", (proxyReq, req) => {
              console.log("🚀 Proxying:", req.method, req.url, "→", proxyTarget);
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              console.log("✅ Received:", proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  };
});
