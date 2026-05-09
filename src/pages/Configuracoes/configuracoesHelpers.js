/** Tokens visuais da tela Configurações (alinhado ao guia VEXA ERP). */
export const VEX = {
  bgBase: "#1a1f2e",
  bgSidebar: "#141824",
  bgCard: "#212638",
  bgCardHover: "#2a3050",
  bgInput: "#2a3050",
  border: "rgba(255, 255, 255, 0.08)",
  borderActive: "rgba(255, 255, 255, 0.18)",
  yellow: "#f5c518",
  yellowSoft: "rgba(245, 197, 24, 0.12)",
  textPrimary: "#ffffff",
  textSecondary: "#8b92a5",
  textMuted: "#555e75",
  success: "#22c55e",
  successSoft: "rgba(34, 197, 94, 0.12)",
  danger: "#ef4444",
  dangerSoft: "rgba(239, 68, 68, 0.12)",
  warning: "#f59e0b",
  warningSoft: "rgba(245, 158, 11, 0.12)",
  info: "#3b82f6",
  infoSoft: "rgba(59, 130, 246, 0.12)",
  purpleSoft: "rgba(139, 92, 246, 0.12)",
  purple: "#8b5cf6",
  cyanSoft: "rgba(6, 182, 212, 0.12)",
  cyan: "#06b6d4",
  radiusCard: "12px",
  radiusInput: "8px",
};

/** Badge por texto de perfil (exibição na lista). */
export function badgeStyleForPerfil(perfil) {
  const p = String(perfil || "").toLowerCase();
  if (p.includes("admin")) return { bg: VEX.infoSoft, color: VEX.info, label: perfil || "Administrador" };
  if (p.includes("gerente")) return { bg: VEX.yellowSoft, color: VEX.yellow, label: perfil || "Gerente" };
  if (p.includes("vendedor")) return { bg: VEX.successSoft, color: VEX.success, label: perfil || "Vendedor" };
  if (p.includes("caixa")) return { bg: VEX.purpleSoft, color: VEX.purple, label: perfil || "Operador de Caixa" };
  if (p.includes("estoquista")) return { bg: VEX.cyanSoft, color: VEX.cyan, label: perfil || "Estoquista" };
  if (p.includes("financeiro")) return { bg: VEX.dangerSoft, color: VEX.danger, label: perfil || "Financeiro" };
  if (p.includes("suporte")) return { bg: VEX.purpleSoft, color: VEX.purple, label: perfil || "Suporte" };
  return { bg: "rgba(255,255,255,0.06)", color: VEX.textSecondary, label: perfil || "—" };
}

const R = {
  full: { level: "full", level_label: "Total", hint: "" },
  own: { level: "own", level_label: "Apenas próprias", hint: "" },
  lim10: { level: "limited", level_label: "Até 10% (parâmetro)", hint: "Limitado pelo parâmetro do sistema" },
  none: { level: "none", level_label: "Sem acesso", hint: "" },
};

export function getPermissionsMatrixForPerfil(perfilRaw) {
  const p = String(perfilRaw || "").toLowerCase();
  const isAdmin = p.includes("admin");
  const isGerente = p.includes("gerente");
  const isVendedor = p.includes("vendedor");
  const isCaixa = p.includes("caixa");
  const isEstoque = p.includes("estoquista");
  const isFin = p.includes("financeiro");

  const pick = (map) => {
    if (isAdmin) return map.admin ?? R.full;
    if (isGerente) return map.gerente ?? R.full;
    if (isVendedor) return map.vendedor ?? R.none;
    if (isCaixa) return map.caixa ?? R.none;
    if (isEstoque) return map.estoquista ?? R.none;
    if (isFin) return map.financeiro ?? R.none;
    return map.default ?? R.none;
  };

  const vendas = [
    { permission_key: "sale_register", label: "Registrar venda", ...pick({ admin: R.full, gerente: R.full, vendedor: R.full, caixa: R.full, default: R.none }) },
    { permission_key: "sale_cancel", label: "Cancelar venda", ...pick({ admin: R.full, gerente: R.full, vendedor: R.own, default: R.none }) },
    { permission_key: "sale_discount", label: "Aplicar desconto", ...pick({ admin: R.full, gerente: R.full, vendedor: R.lim10, default: R.none }) },
    { permission_key: "sale_history", label: "Ver histórico de vendas", ...pick({ admin: R.full, gerente: R.full, vendedor: R.own, caixa: R.own, default: R.none }) },
  ];

  const caixa = [
    { permission_key: "cash_open", label: "Abrir / fechar caixa", ...pick({ admin: R.full, gerente: R.full, caixa: R.full, default: R.none }) },
    { permission_key: "cash_suprimento", label: "Suprimento e sangria", ...pick({ admin: R.full, gerente: R.full, caixa: R.full, default: R.none }) },
  ];

  const estoque = [
    { permission_key: "stock_view", label: "Consultar estoque", ...pick({ admin: R.full, gerente: R.full, estoquista: R.full, vendedor: R.full, default: R.none }) },
    { permission_key: "stock_adjust", label: "Ajustar inventário", ...pick({ admin: R.full, gerente: R.full, estoquista: R.full, default: R.none }) },
  ];

  const compras = [
    { permission_key: "purchase_create", label: "Registrar compra", ...pick({ admin: R.full, gerente: R.full, estoquista: R.full, financeiro: R.full, default: R.none }) },
  ];

  const rel = [
    { permission_key: "reports_view", label: "Visualizar relatórios", ...pick({ admin: R.full, gerente: R.full, financeiro: R.full, default: R.none }) },
  ];

  const wrap = (module, rows) =>
    rows.map((row) => ({
      permission_key: row.permission_key,
      label: row.label,
      module,
      level: row.level,
      level_label: row.level_label,
      hint: row.hint || "",
    }));

  return [
    { module: "VENDAS", rows: wrap("VENDAS", vendas) },
    { module: "CAIXA", rows: wrap("CAIXA", caixa) },
    { module: "ESTOQUE", rows: wrap("ESTOQUE", estoque) },
    { module: "COMPRAS", rows: wrap("COMPRAS", compras) },
    { module: "RELATÓRIOS", rows: wrap("RELATÓRIOS", rel) },
  ];
}
