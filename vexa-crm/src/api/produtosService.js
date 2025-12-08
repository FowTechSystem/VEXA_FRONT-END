// src/api/produtosService.js
import api from "./axiosConfig";

export const produtosService = {
  getAll: async () => {
    const response = await api.get("/produtos");
    return response.data;
  },

  create: async (produto) => {
    const response = await api.post("/produtos", produto);
    return response.data;
  },

  update: async (id, produto) => {
    const response = await api.put(`/produtos/${id}`, produto);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/produtos/${id}`);
    return response.data;
  },
};
