// src/api/rolesService.js — lista perfis para selects (GET /roles ou mock).
import api from "./axiosConfig";

export const ROLES_FALLBACK = [
  { id: "admin", name: "admin", label: "Administrador", description: "Acesso total ao sistema." },
  { id: "gerente", name: "gerente", label: "Gerente", description: "Gestão da loja e aprovações." },
  { id: "vendedor", name: "vendedor", label: "Vendedor", description: "Vendas e atendimento." },
  { id: "caixa", name: "caixa", label: "Operador de Caixa", description: "Operações de caixa." },
  { id: "estoquista", name: "estoquista", label: "Estoquista", description: "Entrada e contagem de estoque." },
];

/** Converte role.label para valor usado em usuario.perfil (API atual). */
export function roleLabelToPerfil(label) {
  return label;
}

export async function listRoles() {
  try {
    const res = await api.get("/roles");
    const data = res.data?.data ?? res.data?.roles ?? res.data;
    const arr = Array.isArray(data) ? data : [];
    if (arr.length > 0) return arr;
  } catch {
    /* usa fallback */
  }
  return ROLES_FALLBACK;
}
