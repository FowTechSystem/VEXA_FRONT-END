// src/components/Bazar/bazarHelpers.js
// Funções utilitárias usadas pelas telas do Bazar (formatação, derivadas).

export const formatBRL = (n) =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const formatData = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
};

/** Cor consistente para avatar a partir do nome (mesma fórmula de Clientes/Marcas). */
export const getAvatarColor = (nome) => {
  const colors = [
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#F8F32B",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#14b8a6",
  ];
  const index = nome?.charCodeAt(0) % colors.length || 0;
  return colors[index];
};

export const getInitials = (nome) => {
  if (!nome) return "?";
  const parts = nome.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
};

/** Peças do bazar são sempre quantidade 1 (não fracionam estoque). */
export const QUANTIDADE_PRODUTO_BAZAR = 1;

/** Identifica produto/peça originada do módulo Bazar (consignado). */
export const isProdutoBazar = (produto) => {
  if (!produto) return false;
  const tipo = String(produto.tipo ?? produto.Tipo ?? "").trim().toLowerCase();
  if (tipo === "bazar") return true;
  if (produto.bazarProdutoId != null || produto.bazarPecaId != null) return true;
  if (produto.ehBazar === true || produto.EhBazar === true) return true;
  return false;
};
