// src/api/vendasService.js
import api from "./axiosConfig";

export const vendasService = {
  // Listar todas as vendas
  getAll: async () => {
    const response = await api.get("/vendas");
    return response.data;
  },

  // Obter venda por ID
  getById: async (id) => {
    const response = await api.get(`/vendas/${id}`);
    return response.data;
  },

  // Criar nova venda
  create: async (venda) => {
    const response = await api.post("/vendas", venda);
    return response.data;
  },

  // Cancelar venda (ao invés de deletar)
  cancelar: async (id, motivo) => {
    const response = await api.post(`/vendas/${id}/cancelar`, { motivo });
    return response.data;
  },
};
