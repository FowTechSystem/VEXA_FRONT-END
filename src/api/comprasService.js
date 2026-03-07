// src/api/comprasService.js
import api from "./axiosConfig";

export const comprasService = {
  // Listar todas as compras
  getAll: async () => {
    const response = await api.get("/compras");
    return response.data;
  },

  // Obter compra por ID
  getById: async (id) => {
    const response = await api.get(`/compras/${id}`);
    return response.data;
  },

  // Criar nova compra
  create: async (compra) => {
    const response = await api.post("/compras", compra);
    return response.data;
  },

  // Atualizar compra
  update: async (id, compra) => {
    const response = await api.put(`/compras/${id}`, compra);
    return response.data;
  },

  // Deletar compra
  delete: async (id) => {
    const response = await api.delete(`/compras/${id}`);
    return response.data;
  },
};
