/**
 * =============================================================================
 * AUTH SERVICE - Ponto de Integração para o Backend
 * =============================================================================
 *
 * O BACKEND DEVE IMPLEMENTAR:
 *
 * POST /api/auth/login
 *   Body: { email: string, password: string }
 *   Success 200: { token: string, user?: { id, nome, email, perfil } }
 *   Error 401: { message: "Credenciais inválidas" }
 *   Error 500: { message: "Erro interno" }
 *
 * O token retornado será enviado automaticamente no header Authorization
 * em todas as requisições (já configurado no axiosConfig.js).
 *
 * O backend deve validar o token em cada requisição protegida.
 * =============================================================================
 */

import api from "./axiosConfig";

const AUTH_KEY = "isAuthenticated";
const TOKEN_KEY = "token";
const USER_EMAIL_KEY = "userEmail";
const USER_DATA_KEY = "userData";

export const authService = {
  /**
   * Faz login no backend.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, user?: object}>}
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
   * Remove todos os dados de autenticação.
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    sessionStorage.removeItem(AUTH_KEY);
  },

  /**
   * Verifica se o usuário está autenticado.
   * Requer token E flag de autenticação.
   */
  isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    const hasAuth =
      localStorage.getItem(AUTH_KEY) === "true" ||
      sessionStorage.getItem(AUTH_KEY) === "true";
    return !!(token && hasAuth);
  },

  /**
   * Retorna o token atual (para uso em interceptors, etc).
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
};
