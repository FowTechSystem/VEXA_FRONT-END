// src/api/condicionalService.js
// Condicional: reserva do estoque, conta como venda.
// Ao devolver: produto volta ao estoque e valor é removido dos cálculos de venda.
import api from "./axiosConfig";

export const condicionalService = {
  listar: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.pagina != null) queryParams.append("pagina", params.pagina);
    if (params.tamanho != null) queryParams.append("tamanho", params.tamanho);
    if (params.pendente != null) queryParams.append("pendente", params.pendente);
    if (params.clienteId != null) queryParams.append("clienteId", params.clienteId);
    if (params.dataInicio) queryParams.append("dataInicio", params.dataInicio);
    if (params.dataFim) queryParams.append("dataFim", params.dataFim);
    const url = queryParams.toString() ? `/condicional?${queryParams}` : "/condicional";
    const response = await api.get(url);
    return response.data;
  },

  criar: async (condicional) => {
    const response = await api.post("/condicional", condicional);
    return response.data;
  },

  devolver: async (id) => {
    const response = await api.post(`/condicional/${id}/devolver`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/condicional/${id}`);
    return response.data;
  },
};
