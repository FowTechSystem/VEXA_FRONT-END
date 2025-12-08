// src/api/axiosConfig.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7000/api", // Coloque a porta da sua API C#
  headers: {
    "Content-Type": "application/json",
  },
});

// Adicionar token de autenticação se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
