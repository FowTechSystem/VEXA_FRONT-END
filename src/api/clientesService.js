// src/api/clientesService.js
import api from "./axiosConfig";

export const clientesService = {
  listarPaginado: async ({ filtro, valor, pagina, tamanho }) => {
    const params = new URLSearchParams();
    if (filtro) params.append("filtro", filtro);
    if (valor) params.append("valor", valor);
    params.append("pagina", pagina);
    params.append("tamanho", tamanho);

    const response = await api.get(`/clientes?${params.toString()}`);
    return response.data;
  },

  /**
   * Upload da foto do cliente (edição).
   * Envia multipart com campo "file". Não definir Content-Type manualmente: o axios precisa
   * incluir o boundary; o default "application/json" da instância é removido no transformRequest.
   */
  uploadFoto: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/clientes/upload-foto", formData, {
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
    const url = queryParams.toString() ? `/clientes?${queryParams}` : "/clientes";
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  create: async (cliente) => {
    const response = await api.post("/clientes", cliente);
    return response.data;
  },

  update: async (id, cliente) => {
    const { id: _, ...clienteData } = cliente;

    const response = await api.put(`/clientes/${id}`, clienteData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },
};
