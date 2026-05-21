// src/api/bazarConsignantesService.js
// CRUD de consignantes do módulo Bazar + resumo agregado.
// Endpoint base: /bazar/consignantes
import api from "./axiosConfig";

export const bazarConsignantesService = {
  /**
   * Lista paginada com busca por nome/telefone e flag opcional para incluir resumo.
   * @param {object} params
   * @param {string} [params.busca]           — texto livre (nome ou telefone)
   * @param {boolean} [params.incluirResumo]  — embed resumo (pendente, em estoque, vendidas)
   * @param {number} [params.pagina]
   * @param {number} [params.tamanho]
   * @returns {Promise<{ consignantes: Array, totalPaginas: number, totalRegistros: number }>}
   */
  listar: async ({ busca, incluirResumo, pagina, tamanho } = {}) => {
    const params = new URLSearchParams();
    if (busca) params.append("busca", busca);
    if (incluirResumo) params.append("incluirResumo", "true");
    if (pagina != null) params.append("pagina", String(pagina));
    if (tamanho != null) params.append("tamanho", String(tamanho));
    const qs = params.toString();
    const response = await api.get(
      qs ? `/bazar/consignantes?${qs}` : "/bazar/consignantes",
    );
    return response.data;
  },

  /** Lista os consignantes mais recentes (usado nos chips de atalho do hub). */
  listarRecentes: async (limite = 6) => {
    const response = await api.get(
      `/bazar/consignantes/recentes?limite=${limite}`,
    );
    return response.data;
  },

  /** Resumo geral do módulo (cards do hub + alerta). */
  getResumoGeral: async () => {
    const response = await api.get("/bazar/consignantes/resumo");
    return response.data;
  },

  /** Detalhes de um consignante + resumo individual (embed). */
  getById: async (id) => {
    const response = await api.get(`/bazar/consignantes/${id}`);
    return response.data;
  },

  /** Resumo isolado de um consignante (pendente, em estoque, vendidas, devolvidas). */
  getResumo: async (id) => {
    const response = await api.get(`/bazar/consignantes/${id}/resumo`);
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post("/bazar/consignantes", payload);
    return response.data;
  },

  update: async (id, payload) => {
    const { id: _omit, ...body } = payload;
    const response = await api.put(`/bazar/consignantes/${id}`, body);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/bazar/consignantes/${id}`);
    return response.data;
  },
};

export default bazarConsignantesService;
