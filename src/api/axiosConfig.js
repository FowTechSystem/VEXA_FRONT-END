// src/api/axiosConfig.js
// Multi-tenancy: envie apenas Authorization: Bearer <token>. Não envie empresaId no body nem na query.
import axios from "axios";
import { apiBaseURL } from "../config/apiBase";

const TOKEN_KEY = "token";
const AUTH_KEY = "isAuthenticated";
const USER_EMAIL_KEY = "userEmail";
const USER_DATA_KEY = "userData";

const EMPRESA_ATIVA_KEY = "empresaAtiva";
const DEV_ADMIN_EMAIL = "dev@gmail.com";

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(EMPRESA_ATIVA_KEY);
  sessionStorage.removeItem(AUTH_KEY);
};

function getEmpresaAtivaId() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_DATA_KEY) || "{}");
    if (user.email !== DEV_ADMIN_EMAIL) return null;
    const raw = localStorage.getItem(EMPRESA_ATIVA_KEY);
    const empresa = raw ? JSON.parse(raw) : null;
    return empresa?.id ?? 1;
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
    // Dev entrando em empresa: envia X-Empresa-Id para o backend usar esse contexto
    const empresaId = getEmpresaAtivaId();
    if (empresaId != null && !/auth\/login/i.test(config.url || "")) {
      config.headers["X-Empresa-Id"] = String(empresaId);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = /auth\/login$/i.test(error.config?.url || "");
      if (!isLoginRequest) {
        clearAuth();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
