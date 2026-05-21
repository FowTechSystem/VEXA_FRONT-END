import api from "./axiosConfig";

export const CategoriaService = {
  listarPaginado: async ({ filtro, valor, pagina, tamanho }) => {
    const params = new URLSearchParams();
    if (filtro) params.append("filtro", filtro);
    if (valor) params.append("valor", valor);
    params.append("pagina", pagina);
    params.append("tamanho", tamanho);

    const response = await api.get(`/categorias?${params.toString()}`);
    return response.data;
  },

  getAll: async (params = {}) => {
    const pagina = params.pagina ?? 1;
    const tamanho = Math.min(Number(params.tamanho ?? 500) || 500, 500);
    const response = await api.get(
      `/categorias?pagina=${pagina}&tamanho=${tamanho}`,
    );
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/categorias/${id}`);
    return response.data;
  },

  create: async (categoria) => {
    const response = await api.post("/categorias", categoria);
    return response.data;
  },

  update: async (id, categoria) => {
    const { id: _, ...categoriaData } = categoria;
    const response = await api.put(`/categorias/${id}`, categoriaData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/categorias/${id}`);
    return response.data;
  },
};
