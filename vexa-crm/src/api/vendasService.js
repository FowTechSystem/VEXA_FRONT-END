// src/api/vendasService.js
import api from "./axiosConfig";

export const vendasService = {
  getAll: async () => {
    const response = await api.get("/vendas");
    return response.data;
  },

  create: async (venda) => {
    const response = await api.post("/vendas", venda);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/vendas/${id}`);
    return response.data;
  },
};
