import api from "./axiosConfig";

export const FornecedorService = {
  listarPaginado: async ({ filtro, valor, pagina, tamanho }) => {
    const params = new URLSearchParams();
    if (filtro) params.append("filtro", filtro);
    if (valor) params.append("valor", valor);
    params.append("pagina", pagina);
    params.append("tamanho", tamanho);

    const response = await api.get(`/fornecedores?${params.toString()}`);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/fornecedores");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/fornecedores/${id}`);
    return response.data;
  },

  create: async (fornecedor) => {
    const response = await api.post("/fornecedores", fornecedor);
    return response.data;
  },

  update: async (id, fornecedor) => {
    const { id: _, ...fornecedorData } = fornecedor;
    const response = await api.put(`/fornecedores/${id}`, fornecedorData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/fornecedores/${id}`);
    return response.data;
  },
};
