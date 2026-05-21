// src/api/bazarSacolasService.js
// Sacolas — agrupam peças trazidas pelo mesmo consignante em uma entrega.
// Endpoint base: /bazar/sacolas
import api from "./axiosConfig";

export const bazarSacolasService = {
  /**
   * Lista as sacolas de um consignante, opcionalmente com resumo agregado de cada uma
   * (total, disponíveis, vendidas, devolvidas, valor de venda e de repasse).
   */
  listarPorConsignante: async (consignanteId, { incluirResumo = true } = {}) => {
    const params = new URLSearchParams();
    if (incluirResumo) params.append("incluirResumo", "true");
    const qs = params.toString();
    const response = await api.get(
      qs
        ? `/bazar/consignantes/${consignanteId}/sacolas?${qs}`
        : `/bazar/consignantes/${consignanteId}/sacolas`,
    );
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/bazar/sacolas/${id}`);
    return response.data;
  },

  /**
   * Cria uma sacola com várias peças em lote.
   * @param {object} payload
   * @param {number} payload.consignanteId
   * @param {string} [payload.observacao]
   * @param {Array<{
   *   descricao: string,
   *   tamanho: string,
   *   cor: string,
   *   valorCompra: number,
   *   valorVenda: number
   * }>} payload.pecas
   * @returns {Promise<{ id: number, pecas: Array<{ id: number }> }>}
   */
  create: async (payload) => {
    const response = await api.post("/bazar/sacolas", payload);
    return response.data;
  },

  /**
   * Anexa fotos (até 3) à peça depois do create.
   * O backend espera multipart com campo "files".
   */
  uploadFotosPeca: async (pecaId, files) => {
    const formData = new FormData();
    (Array.isArray(files) ? files : Array.from(files || [])).forEach((f) =>
      formData.append("files", f),
    );
    const response = await api.post(
      `/bazar/pecas/${pecaId}/fotos`,
      formData,
      {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        transformRequest: [
          (data, headers) => {
            if (data instanceof FormData) {
              delete headers["Content-Type"];
            }
            return data;
          },
        ],
      },
    );
    return response.data;
  },

  /**
   * Devolve todas as peças disponíveis de uma sacola em lote.
   * Backend deve recusar se houver peça vendida na sacola (regra de negócio).
   */
  devolverTudo: async (sacolaId) => {
    const response = await api.put(`/bazar/sacolas/${sacolaId}/devolver`);
    return response.data;
  },
};

export default bazarSacolasService;
