import api from "./axiosConfig";

/**
 * Parâmetros para listagem com paginação e busca (backend devolve totalRegistros/totalPaginas).
 * @param {Object} params
 * @param {number} [params.pagina=1]
 * @param {number} [params.tamanho=10]
 * @param {string} [params.valor] - termo de busca (nome, email ou perfil)
 * @param {string} [params.filtro] - "nome" | "email" | "login" | "cargo" (opcional; se omitido, busca em nome)
 */
export const usuariosService = {
  /**
   * Upload da foto do usuário (edição), espelhando o fluxo de clientes.
   * Multipart campo "file"; não definir Content-Type manualmente (boundary do axios).
   */
  uploadFoto: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/usuarios/upload-foto", formData, {
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

  /**
   * Listar usuários com paginação e busca.
   * Retorna o objeto completo da API: { usuarios, totalRegistros, totalPaginas, paginaAtual, tamanhoPagina }
   * para o front exibir "Mostrando 1 a 10 de 50" e habilitar os botões de página.
   */
  getAll: async (params = {}) => {
    const { pagina = 1, tamanho = 10, valor, filtro } = params;

    // Monta os parâmetros da query
    const queryParams = {
      pagina,
      tamanho,
    };

    // Adiciona valor apenas se não for vazio/undefined
    if (valor !== undefined && valor.trim() !== "") {
      queryParams.valor = valor.trim();
    }

    // Adiciona filtro apenas se fornecido
    if (filtro) {
      queryParams.filtro = filtro;
    }

    const response = await api.get("/usuarios", { params: queryParams });
    const data = response.data;

    return {
      usuarios: data.usuarios || [],
      totalRegistros: data.totalRegistros ?? 0,
      totalPaginas: data.totalPaginas ?? 0,
      paginaAtual: data.paginaAtual ?? pagina,
      tamanhoPagina: data.tamanhoPagina ?? tamanho,
    };
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

  // Atualizar usuario
  update: async (id, usuario) => {
    const response = await api.put(`/usuarios/${id}`, usuario);
    return response.data;
  },

  // Cancelar usuario (ao invés de deletar)
  cancelar: async (id, motivo) => {
    const response = await api.post(`/usuarios/${id}/cancelar`, { motivo });
    return response.data;
  },
};
