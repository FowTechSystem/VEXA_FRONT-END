/**
 * =============================================================================
 * AUTH SERVICE - Ponto de Integração para o Backend (Multi-tenancy)
 * =============================================================================
 *
 * O BACKEND DEVE IMPLEMENTAR:
 *
 * POST /api/auth/login
 *   Body: { email: string, password: string }
 *   Success 200: {
 *     token: string,
 *     user: { id, empresaId, nome, email, perfil [, empresaNome ] }
 *   }
 *   Error 401: { message: "Credenciais inválidas" }
 *   Error 500: { message: "Erro interno" }
 *
 * Multi-tenancy:
 * - O backend retorna user.empresaId no login; o frontend guarda o user completo.
 * - Todas as requisições autenticadas enviam apenas: Authorization: Bearer <token>.
 * - NÃO envie empresaId no body (POST/PUT) nem na query (GET); o backend usa o token.
 * =============================================================================
 */

import api from "./axiosConfig";

const AUTH_KEY = "isAuthenticated";
const TOKEN_KEY = "token";
const USER_EMAIL_KEY = "userEmail";
const USER_DATA_KEY = "userData";

export const authService = {
  /**
   * Faz login no backend. Guarda token e user (com empresaId).
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user?: { id, empresaId, nome, email, perfil } }>}
   */
  async login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const data = response.data;

    if (data.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_KEY, "true");
      sessionStorage.setItem(AUTH_KEY, "true");
      localStorage.setItem(USER_EMAIL_KEY, email);
      if (data.user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
      }
    }

    return data;
  },

  /**
   * Remove token e user (logout). Próximo login trará dados novos.
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  },

  /**
   * Retorna o usuário logado (com empresaId). {} se não houver.
   * @returns {{ id?: number, empresaId?: number, nome?: string, email?: string, perfil?: string, empresaNome?: string }}
   */
  getUsuario() {
    try {
      const raw = localStorage.getItem(USER_DATA_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  /**
   * Verifica se o usuário está autenticado.
   */
  isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    const hasAuth =
      localStorage.getItem(AUTH_KEY) === "true" ||
      sessionStorage.getItem(AUTH_KEY) === "true";
    return !!(token && hasAuth);
  },

  /**
   * Retorna o token atual (usado no header Authorization).
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
};
