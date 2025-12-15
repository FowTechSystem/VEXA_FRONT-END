// src/api/axiosConfig.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:5001/api", // HTTP, não HTTPS
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // adicione timeout
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
      config.method.toUpperCase(),
      config.url,
      config.data
    );
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Interceptor de resposta para debug
api.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("❌ Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
