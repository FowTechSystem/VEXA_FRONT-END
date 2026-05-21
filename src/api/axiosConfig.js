// src/api/axiosConfig.js
// Base URL: src/config/apiBase.js (produção: /api no mesmo host HTTPS — ver docs/CONTRATO-API-FRONT-BACKEND.md).
// Autenticação: Authorization: Bearer <token>. Multi-tenancy dev: X-Empresa-Id (admin); não enviar empresaId no body/query.
import axios from "axios";
import { apiBaseURL } from "../config/apiBase";
import { isDevAdminUser } from "../constants/devAdmin";
import { notifyAuthChanged } from "../utils/authEvents";

const TOKEN_KEY = "token";
const AUTH_KEY = "isAuthenticated";
const USER_EMAIL_KEY = "userEmail";
const USER_DATA_KEY = "userData";

const EMPRESA_ATIVA_KEY = "empresaAtiva";

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(EMPRESA_ATIVA_KEY);
  sessionStorage.removeItem(AUTH_KEY);
  notifyAuthChanged();
};

/**
 * ID da empresa para o header X-Empresa-Id (somente conta dev).
 * Prioridade: empresa escolhida em "Entrar em empresa" → empresaId do usuário logado.
 */
export function resolveEmpresaIdForRequest() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_DATA_KEY) || "{}");
    if (!isDevAdminUser(user)) return null;

    const raw = localStorage.getItem(EMPRESA_ATIVA_KEY);
    const empresa = raw ? JSON.parse(raw) : null;
    if (empresa?.id != null) return empresa.id;

    const fromUser = user.empresaId ?? user.EmpresaId;
    return fromUser != null ? fromUser : null;
  } catch {
    return null;
  }
}

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Dev: contexto de empresa (obrigatório na API de produção para listagens)
    const empresaId = resolveEmpresaIdForRequest();
    if (
      empresaId != null &&
      !/auth\/(login|forgot-password|reset-password)/i.test(config.url || "")
    ) {
      config.headers["X-Empresa-Id"] = String(empresaId);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (import.meta.env.DEV && error.response?.status === 400) {
      const body = error.response?.data;
      const preview =
        typeof body === "string"
          ? body.slice(0, 200)
          : body?.message ?? body?.Message ?? body?.mensagem ?? JSON.stringify(body)?.slice(0, 200);
      console.warn("[VEXA API 400]", error.config?.method, error.config?.url, preview);
    }
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const isPublicAuth =
        /auth\/(login|forgot-password|reset-password)/i.test(url);
      if (!isPublicAuth) {
        clearAuth();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
