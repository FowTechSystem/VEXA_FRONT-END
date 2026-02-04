// src/api/axiosConfig.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:5001/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true, // ✅ IMPORTANTE: Necessário para CORS com credentials
});

// Interceptor de requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // DEBUG: Ver requisições no console
    console.log(
      "🚀 Request:",
      config.method?.toUpperCase(), // ✅ Adicionei ?. para evitar erro
      config.url,
      config.data || config.params, // ✅ Mostrar params também
    );
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.status, response.data);
    return response;
  },
  (error) => {
    // ✅ Mensagens mais detalhadas
    if (error.code === "ECONNABORTED") {
      console.error("❌ Timeout: Backend não respondeu em 30 segundos");
    } else if (error.code === "ERR_NETWORK") {
      console.error(
        "❌ Network Error: Verifique se o backend está rodando ou se há problema de CORS",
      );
    } else if (error.response) {
      console.error("❌ Response Error:", {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      });
    } else {
      console.error("❌ Error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
