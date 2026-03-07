// src/api/vendasService.js
import api from "./axiosConfig";

export const vendasService = {
  // Listar vendas (params opcionais para Dashboard: tamanho=500)
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.pagina != null) queryParams.append("pagina", params.pagina);
    if (params.tamanho != null) queryParams.append("tamanho", params.tamanho);
    const url = queryParams.toString() ? `/vendas?${queryParams}` : "/vendas";
    const response = await api.get(url);
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
