// src/api/axiosConfig.js
// Multi-tenancy: envie apenas Authorization: Bearer <token>. Não envie empresaId no body nem na query.
import axios from "axios";

const TOKEN_KEY = "token";
const AUTH_KEY = "isAuthenticated";
const USER_EMAIL_KEY = "userEmail";
const USER_DATA_KEY = "userData";

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  sessionStorage.removeItem(AUTH_KEY);
};

const api = axios.create({
  baseURL: "/api",
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
