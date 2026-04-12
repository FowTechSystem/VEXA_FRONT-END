// src/api/produtosService.js
import api from "./axiosConfig";

export const produtosService = {
  /**
   * Upload da imagem do produto (edição), mesmo padrão de clientes/usuários.
   * Multipart com campo "file"; não definir Content-Type manualmente.
   */
  uploadFoto: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/produtos/upload-foto", formData, {
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
    });
    return response.data;
  },

  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.pagina != null) queryParams.append("pagina", params.pagina);
    if (params.tamanho != null) queryParams.append("tamanho", params.tamanho);
    const url = queryParams.toString() ? `/produtos?${queryParams}` : "/produtos";
    const response = await api.get(url);

    // A API retorna um objeto GetListaProdutosResponse
    // Vamos extrair a lista de produtos
    const data = response.data;
    if (data && typeof data === "object") {
      // Tentar diferentes propriedades possíveis
      const produtos = data.produtos || data.Produtos || data.items || data.data || data;
      return Array.isArray(produtos) ? produtos : [];
    }

    return Array.isArray(data) ? data : [];
  },

  create: async (produto) => {
    const response = await api.post("/produtos", produto);
    return response.data;
  },

  update: async (id, produto) => {
    const response = await api.put(`/produtos/${id}`, produto);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/produtos/${id}`);
    return response.data;
  },
};
