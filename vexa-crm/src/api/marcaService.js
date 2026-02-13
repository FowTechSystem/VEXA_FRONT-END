import api from "./axiosConfig";

export const MarcaService = {
  listarPaginado: async ({ filtro, valor, pagina, tamanho }) => {
    const params = new URLSearchParams();
    if (filtro) params.append("filtro", filtro);
    if (valor) params.append("valor", valor);
    params.append("pagina", pagina);
    params.append("tamanho", tamanho);

    const response = await api.get(`/marcas?${params.toString()}`);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/marcas");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/marcas/${id}`);
    return response.data;
  },

  create: async (marca) => {
    const response = await api.post("/marcas", marca);
    return response.data;
  },

  update: async (id, marca) => {
    const { id: _, ...marcaData } = marca;
    const response = await api.put(`/marcas/${id}`, marcaData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/marcas/${id}`);
    return response.data;
  },
};
