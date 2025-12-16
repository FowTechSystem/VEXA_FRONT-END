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

  // Método para upload de foto
  uploadFoto: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/clientes/upload-foto", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get("/clientes");
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
