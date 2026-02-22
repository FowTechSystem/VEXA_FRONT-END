// src/api/permissoesService.js
import api from "./axiosConfig";

/**
 * Lista permissões disponíveis para mapear toggles → permissaoIds.
 * @returns {Promise<Array<{ id: number, nome: string, codigo: string }>>}
 */
export async function listarPermissoes() {
  const response = await api.get("/permissoes");
  const data = response.data;
  return Array.isArray(data) ? data : data.permissoes || data.items || [];
}
