/**
 * Autenticação — alinhado ao backend ASP.NET Core (CRMVEXA).
 *
 * Contrato: POST /api/Auth/login, JSON camelCase { email, password }.
 * Resposta 200: { token, user } (aceita também Token/User se vier PascalCase).
 * Demais chamadas: Authorization: Bearer <token> (axiosConfig).
 *
 * Detalhes: docs/CONTRATO-API-FRONT-BACKEND.md
 */

import api from "./axiosConfig";
import { notifyAuthChanged } from "../utils/authEvents";

const AUTH_KEY = "isAuthenticated";
const TOKEN_KEY = "token";
const USER_EMAIL_KEY = "userEmail";
const USER_DATA_KEY = "userData";

/** Normaliza resposta do login (camelCase padrão; fallback PascalCase). */
function normalizeLoginResponse(data) {
  if (!data || typeof data !== "object") return { token: undefined, user: undefined };
  const token = data.token ?? data.Token;
  const user = data.user ?? data.User ?? undefined;
  return { ...data, token, user };
}

export const authService = {
  /**
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ token?: string, user?: object }>}
   */
  async login(email, password) {
    const trimmedEmail = String(email ?? "").trim();
    const response = await api.post("/Auth/login", {
      email: trimmedEmail,
      password: String(password ?? ""),
    });
    const data = normalizeLoginResponse(response.data);

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_KEY, "true");
      sessionStorage.setItem(AUTH_KEY, "true");
      localStorage.setItem(USER_EMAIL_KEY, trimmedEmail);
      const apiUser = data.user ?? data.User;
      const merged =
        apiUser && typeof apiUser === "object"
          ? {
              ...apiUser,
              email: apiUser.email ?? apiUser.Email ?? trimmedEmail,
            }
          : { email: trimmedEmail };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(merged));
      notifyAuthChanged();
    }

    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    notifyAuthChanged();
  },

  getUsuario() {
    try {
      const raw = localStorage.getItem(USER_DATA_KEY);
      let u = raw ? JSON.parse(raw) : {};
      if (!u || typeof u !== "object") u = {};
      const loginEmail = localStorage.getItem(USER_EMAIL_KEY);
      if (loginEmail && !(u.email ?? u.Email)) {
        u = { ...u, email: loginEmail };
      }
      return u;
    } catch {
      return {};
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    const hasAuth =
      localStorage.getItem(AUTH_KEY) === "true" ||
      sessionStorage.getItem(AUTH_KEY) === "true";
    return !!(token && hasAuth);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
};
