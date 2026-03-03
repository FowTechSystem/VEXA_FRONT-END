// src/api/produtosService.js
import api from "./axiosConfig";

export const produtosService = {
  getAll: async () => {
    const response = await api.get("/produtos");

    // A API retorna um objeto GetListaProdutosResponse
    // Vamos extrair a lista de produtos
    const data = response.data;
    if (data && typeof data === "object") {
      // Tentar diferentes propriedades possíveis
      const produtos = data.produtos || data.items || data.data || data;
      console.log("Produtos extraídos:", produtos);
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
