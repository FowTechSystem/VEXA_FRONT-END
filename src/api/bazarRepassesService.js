// src/api/bazarRepassesService.js
// Repasses — registro financeiro do que a loja deve / pagou ao consignante.
// Endpoint base: /bazar/repasses
import api from "./axiosConfig";

export const bazarRepassesService = {
  /**
   * Aba "Pendentes": consignantes com peças vendidas sem repasse pago.
   * @returns {Promise<Array<{
   *   consignante: { id, nome, telefone },
   *   pecas: Array,
   *   total: number
   * }>>}
   */
  listarPendentes: async () => {
    const response = await api.get("/bazar/repasses/pendentes");
    return response.data;
  },

  /**
   * Aba "Histórico" — lista todos os repasses já gerados.
   * @param {object} params
   * @param {string} [params.status]         — pendente | pago
   * @param {number} [params.consignanteId]
   * @param {string} [params.dataInicio]     — YYYY-MM-DD
   * @param {string} [params.dataFim]        — YYYY-MM-DD
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
    const response = await api.get(
      s ? `/bazar/repasses?${s}` : "/bazar/repasses",
    );
    return response.data;
  },

  /** Detalhe de um repasse específico (com lista de peças associadas). */
  getById: async (id) => {
    const response = await api.get(`/bazar/repasses/${id}`);
    return response.data;
  },

  /**
   * Peças vendidas pendentes de repasse para um consignante específico
   * (usado para popular o modal "Gerar repasse").
   */
  getPecasPendentes: async (consignanteId) => {
    const response = await api.get(
      `/bazar/consignantes/${consignanteId}/repasses/pendentes`,
    );
    return response.data;
  },

  /**
   * Cria um novo repasse.
   * @param {object} payload
   * @param {number} payload.consignanteId
   * @param {number[]} payload.pecasIds       — peças que entram no repasse
   * @param {string} payload.formaPagamento   — Dinheiro | PIX | Transferência | Outro
   * @param {string} [payload.observacao]
   */
  create: async (payload) => {
    const response = await api.post("/bazar/repasses", payload);
    return response.data;
  },

  /** Marca um repasse como pago. */
  marcarComoPago: async (id) => {
    const response = await api.put(`/bazar/repasses/${id}/pagar`);
    return response.data;
  },

  /** Cancela um repasse pendente (libera as peças). */
  cancelar: async (id) => {
    const response = await api.delete(`/bazar/repasses/${id}`);
    return response.data;
  },
};

export default bazarRepassesService;
