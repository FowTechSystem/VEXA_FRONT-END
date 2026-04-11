// src/api/caixaService.js
// Resumo do Caixa: entradas (vendas bruta), saídas (compras), saldo e grid de movimentações
import api from "./axiosConfig";

export const caixaService = {
  /**
   * Retorna resumo do caixa e movimentações (vendas + compras) do período.
   * @param {string} dataInicio - ISO date (YYYY-MM-DD)
   * @param {string} dataFim - ISO date (YYYY-MM-DD)
   * @returns {Promise<{ totalEntradas, totalSaidas, saldoAtual, totalEntradasMenosSaldo, movimentacoes }>}
   */
  getResumo: async (dataInicio, dataFim) => {
    const params = new URLSearchParams();
    if (dataInicio) params.append("dataInicio", dataInicio);
    if (dataFim) params.append("dataFim", dataFim);
    const url = params.toString() ? `/caixa/resumo?${params.toString()}` : "/caixa/resumo";
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Registra lucro (entrada) ou despesa (saída) manual no caixa.
   * Contrato detalhado: docs/HANDOFF-MOVIMENTACOES-CAIXA-BACKEND.md
   */
  criarMovimentacaoManual: async (payload) => {
    const response = await api.post("/caixa/movimentacoes/manual", payload);
    return response.data;
  },

  /** Remove movimentação manual (não vende/compra do sistema). */
  excluirMovimentacaoManual: async (id) => {
    const response = await api.delete(`/caixa/movimentacoes/${id}`);
    return response.data;
  },
};
