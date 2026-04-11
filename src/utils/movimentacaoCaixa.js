/**
 * Normalização de linhas do GET /caixa/resumo para a UI (Movimentações, resumo do caixa, etc.).
 * Evita tratar despesas/lançamentos manuais como "venda" quando o backend omite ou erra o tipo.
 */

const ENTRADA_ALIASES = new Set([
  "entrada_lucro",
  "entrada_manual",
  "entrada",
  "receita",
  "lucro",
  "credito_manual",
  "income",
]);

const SAIDA_ALIASES = new Set([
  "saida_despesa",
  "saida_manual",
  "saida",
  "despesa",
  "expense",
  "debito_manual",
  "pagamento_manual",
]);

/** Descrições típicas de despesa manual quando a API ainda envia tipo "venda" sem código de venda. */
const DESPESA_NA_DESCRICAO =
  /(?:^|[\s,])(?:pagamento\s+de|pagar\s+|despesa|conta\s+de|aluguel|energia|água|agua|\bluz\b|internet|imposto|fornecedor|salários?|marketing\b)(?:\s|$|[,.])/i;

const RECEITA_NA_DESCRICAO =
  /(?:recebimento|rendimento|\blucro\b|entrada\s+manual|ajuste\s+positivo|outras\s+receitas)/i;

const PARECE_CODIGO_VENDA = /vnd[-\s#]|venda\s*#\s*\d/i;

function naturezaParaTipoRaw(natureza) {
  const n = String(natureza ?? "").trim().toLowerCase();
  if (!n) return "";
  if (["saida", "s", "debito", "d", "expense", "negativo"].includes(n)) return "saida_manual";
  if (["entrada", "e", "credito", "c", "income", "positivo"].includes(n)) return "entrada_manual";
  return "";
}

/**
 * @param {object} m - item bruto da API (camelCase ou PascalCase)
 * @returns {"venda"|"compra"|"entrada"|"saida"}
 */
export function resolverTipoMovimentacaoLinha(m) {
  const desc = String(m.descricao ?? m.Descricao ?? "").trim();
  const descLower = desc.toLowerCase();

  const vendaId = m.vendaId ?? m.VendaId;
  const valorNum = Number(m.valor ?? m.Valor ?? m.valorTotal ?? m.ValorTotal ?? 0) || 0;

  let raw = String(m.tipo ?? m.Tipo ?? "").trim().toLowerCase();

  const nat = m.natureza ?? m.Natureza ?? m.sentido ?? m.Sentido ?? m.fluxo ?? m.Fluxo;
  if (!raw) {
    raw = naturezaParaTipoRaw(nat);
  }
  if (!raw && valorNum < 0) {
    raw = "saida_manual";
  }
  if (!raw) {
    raw = "venda";
  }

  let tipo;
  if (raw === "compra" || raw === "purchase") tipo = "compra";
  else if (raw === "venda" || raw === "sale") tipo = "venda";
  else if (ENTRADA_ALIASES.has(raw)) tipo = "entrada";
  else if (SAIDA_ALIASES.has(raw)) tipo = "saida";
  else tipo = "venda";

  const semVendaId = vendaId == null;
  if (tipo === "venda" && semVendaId && !PARECE_CODIGO_VENDA.test(descLower)) {
    if (DESPESA_NA_DESCRICAO.test(desc)) tipo = "saida";
    else if (RECEITA_NA_DESCRICAO.test(descLower)) tipo = "entrada";
  }

  return tipo;
}

/**
 * @param {"venda"|"compra"|"entrada"|"saida"} tipo
 * @param {number} valorBruto
 */
export function valorMovimentacaoAssinado(tipo, valorBruto) {
  const n = Number(valorBruto) || 0;
  if (tipo === "compra" || tipo === "saida") return -Math.abs(n);
  return Math.abs(n);
}
