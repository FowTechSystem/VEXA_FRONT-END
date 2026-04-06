/**
 * URL base da API para o axios (único ponto de decisão).
 *
 * Desenvolvimento: padrão `/api` → proxy do Vite (vite.config.js) para o backend.
 * Produção (recomendado): `/api` no mesmo host/protocolo da página → Nginx faz
 * proxy reverso para o container/API interna (evita Mixed Content em HTTPS).
 *
 * Opcional:
 * - VITE_API_BASE_URL — URL completa até /api (ex.: https://api.outrodominio.com/api)
 * - VITE_API_URL — host sem /api no final (ex.: https://sistemavexa.com)
 *
 * Não use http:// + IP em builds servidos em HTTPS: o navegador bloqueia (Mixed Content).
 */
export function resolveApiBaseURL() {
  const full = import.meta.env.VITE_API_BASE_URL?.trim();
  if (full) return full.replace(/\/$/, "");
  const host = import.meta.env.VITE_API_URL?.trim();
  if (host) return `${host.replace(/\/$/, "")}/api`;
  return "/api";
}

export const apiBaseURL = resolveApiBaseURL();

if (import.meta.env.PROD && /^http:\/\//i.test(apiBaseURL)) {
  console.warn(
    "[VEXA] A base da API usa HTTP em URL absoluta; em site HTTPS isso causa Mixed Content. " +
      "Remova VITE_API_URL/VITE_API_BASE_URL ou use apenas `/api` (proxy no Nginx) ou `https://...`.",
  );
}
