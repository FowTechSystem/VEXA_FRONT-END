import api from "./axiosConfig";

export const usuariosService = {
  // Listar todos os usuarios
  getAll: async () => {
    const response = await api.get("/usuarios");
    // Retorna apenas o array de usuários, não o objeto completo
    return response.data.usuarios || [];
  },

  // Obter usuario por ID
  getById: async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  // Criar novo usuario
  create: async (usuario) => {
    const response = await api.post("/usuarios", usuario);
    return response.data;
  },

  // Cancelar usuario (ao invés de deletar)
  cancelar: async (id, motivo) => {
    const response = await api.post(`/usuarios/${id}/cancelar`, { motivo });
    return response.data;
  },
};
