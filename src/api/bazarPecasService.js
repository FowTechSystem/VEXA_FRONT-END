// src/api/bazarPecasService.js
// Peças individuais do Bazar (consignadas). Cada peça é única (quantidade sempre 1).
// Endpoint base: /bazar/pecas
import api from "./axiosConfig";

export const bazarPecasService = {
  /**
   * Lista peças com filtros.
   * @param {object} params
   * @param {number} [params.consignanteId]
   * @param {number} [params.sacolaId]
   * @param {string} [params.status]       — disponivel | vendida | devolvida
   * @param {string} [params.dataInicio]   — YYYY-MM-DD
   * @param {string} [params.dataFim]      — YYYY-MM-DD
   * @param {number} [params.pagina]
   * @param {number} [params.tamanho]
   */
  listar: async (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        qs.append(k, String(v));
      }
    });
    const s = qs.toString();
    const response = await api.get(s ? `/bazar/pecas?${s}` : "/bazar/pecas");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/bazar/pecas/${id}`);
    return response.data;
  },

  /**
   * Atualiza dados de uma peça (somente quando ainda está disponível).
   * O backend deve recusar edição se a peça estiver vendida ou em repasse.
   */
  update: async (id, payload) => {
    const { id: _omit, ...body } = payload;
    const response = await api.put(`/bazar/pecas/${id}`, body);
    return response.data;
  },

  /** Marca uma peça como devolvida (status → devolvida, dataDevolucao = hoje). */
  devolver: async (id) => {
    const response = await api.put(`/bazar/pecas/${id}/devolver`);
    return response.data;
  },

  /** Remove uma peça (somente se nunca foi vendida nem entrou em repasse). */
  delete: async (id) => {
    const response = await api.delete(`/bazar/pecas/${id}`);
    return response.data;
  },
};

export default bazarPecasService;
