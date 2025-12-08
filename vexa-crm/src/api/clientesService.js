// src/api/clientesService.js
import api from "./axiosConfig";

export const clientesService = {
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
    const response = await api.put(`/clientes/${id}`, cliente);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },
};
