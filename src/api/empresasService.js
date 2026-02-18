// src/api/empresasService.js
// Cadastro de novas empresas (uso restrito ao usuário dev@gmail.com no backend).
import api from "./axiosConfig";

/**
 * Cadastra uma nova empresa. Backend deve restringir a dev@gmail.com (ou perfil super-admin).
 * @param {{ nome: string, nomeFantasia?: string, cnpj?: string, email?: string, telefone?: string, ativo?: boolean }} empresa
 */
export async function criarEmpresa(empresa) {
  const response = await api.post("/empresas", empresa);
  return response.data;
}

/**
 * Lista empresas (para dev@gmail.com). Backend deve restringir.
 */
export async function listarEmpresas() {
  const response = await api.get("/empresas");
  return response.data;
}
