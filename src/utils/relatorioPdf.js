// src/utils/relatorioPdf.js
// Gerador de PDFs profissionais para relatórios — paleta VEXA (azul escuro + amarelo neon).
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Paleta VEXA ────────────────────────────────────────────────────────────
const COR_AZUL_ESCURO = [43, 45, 66];       // header escuro
const COR_AZUL_MEDIO = [69, 73, 99];        // sublinha
const COR_AMARELO = [248, 243, 43];          // accent
const COR_AMARELO_SUAVE = [254, 252, 200];   // fundo card
const COR_VERDE = [22, 163, 74];
const COR_VERDE_SUAVE = [220, 252, 231];
const COR_VERMELHO = [220, 38, 38];
const COR_VERMELHO_SUAVE = [254, 226, 226];
const COR_LARANJA = [217, 119, 6];
const COR_LARANJA_SUAVE = [255, 237, 213];
const COR_AZUL_INFO = [37, 99, 235];
const COR_AZUL_INFO_SUAVE = [219, 234, 254];

const COR_TEXTO = [31, 41, 55];
const COR_TEXTO_SECUNDARIO = [107, 114, 128];
const COR_TEXTO_CLARO = [156, 163, 175];
const COR_BORDA = [214, 219, 226];
const COR_BORDA_FORTE = [156, 163, 175];
const COR_FUNDO_CARD = [249, 250, 252];
const COR_FUNDO_ALT = [250, 251, 253];

// ─── Formatadores ───────────────────────────────────────────────────────────
function formatarDataBR(dataStr) {
  if (!dataStr) return "—";
  if (dataStr.includes("/")) return dataStr;
  const [ano, mes, dia] = String(dataStr).split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function formatarNumero(valor) {
  return new Intl.NumberFormat("pt-BR").format(Number(valor) || 0);
}

// ─── Cabeçalho e rodapé ─────────────────────────────────────────────────────
function adicionarCabecalho(doc, titulo, subtitulo, nomeEmpresa = "VEXA") {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Faixa principal azul escura
  doc.setFillColor(...COR_AZUL_ESCURO);
  doc.rect(0, 0, pageWidth, 32, "F");

  // Faixa accent amarela
  doc.setFillColor(...COR_AMARELO);
  doc.rect(0, 32, pageWidth, 3, "F");

  // Logo VEXA (texto estilizado)
  doc.setTextColor(...COR_AMARELO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("VEXA", 14, 15);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("CRM · GESTÃO INTEGRADA", 14, 22);

  // Título centralizado
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(titulo, pageWidth / 2, 15, { align: "center" });
  if (subtitulo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(225, 228, 235);
    doc.text(subtitulo, pageWidth / 2, 22, { align: "center" });
  }

  // Empresa + data à direita
  doc.setTextColor(...COR_AMARELO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(nomeEmpresa || "VEXA", pageWidth - 14, 15, { align: "right" });
  doc.setTextColor(225, 228, 235);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    pageWidth - 14,
    22,
    { align: "right" },
  );
}

function adicionarRodape(doc) {
  const totalPaginas = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    // Linha divisória
    doc.setDrawColor(...COR_BORDA);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    doc.setFontSize(7.5);
    doc.setTextColor(...COR_TEXTO_CLARO);
    doc.setFont("helvetica", "normal");
    doc.text("Documento gerado automaticamente pelo VEXA CRM", 14, pageHeight - 9);
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - 14, pageHeight - 9, {
      align: "right",
    });
  }
}

// ─── Box de filtros/info do relatório ───────────────────────────────────────
function adicionarBoxInfo(doc, linhas, startY) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const boxHeight = 6 + linhas.length * 5;

  doc.setFillColor(...COR_FUNDO_CARD);
  doc.setDrawColor(...COR_BORDA);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, startY, pageWidth - margin * 2, boxHeight, 2, 2, "FD");

  let y = startY + 6;
  linhas.forEach(([label, valor]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COR_TEXTO_SECUNDARIO);
    doc.text(String(label).toUpperCase(), margin + 4, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COR_TEXTO);
    doc.setFontSize(9);
    doc.text(String(valor), margin + 38, y);
    y += 5;
  });

  return startY + boxHeight + 4;
}

// ─── KPI cards (linha de cards coloridos) ───────────────────────────────────
function adicionarKpiCards(doc, cards, startY) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const gap = 4;
  const cardCount = cards.length;
  if (!cardCount) return startY;
  const totalWidth = pageWidth - margin * 2;
  const cardWidth = (totalWidth - gap * (cardCount - 1)) / cardCount;
  const cardHeight = 24;

  cards.forEach((card, i) => {
    const x = margin + i * (cardWidth + gap);
    const bgColor = card.bgColor || COR_FUNDO_CARD;
    const accentColor = card.accentColor || COR_AZUL_INFO;

    doc.setFillColor(...bgColor);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, "F");

    // Barra accent na esquerda
    doc.setFillColor(...accentColor);
    doc.rect(x, startY, 1.5, cardHeight, "F");

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COR_TEXTO_SECUNDARIO);
    doc.text(String(card.label || "").toUpperCase(), x + 5, startY + 6);

    // Valor
    doc.setFont("helvetica", "bold");
    doc.setFontSize(card.valueSize || 14);
    doc.setTextColor(...(card.valueColor || accentColor));
    doc.text(String(card.value || "—"), x + 5, startY + 14);

    // Sub-info (opcional)
    if (card.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...COR_TEXTO_SECUNDARIO);
      doc.text(String(card.sub), x + 5, startY + 20);
    }
  });

  return startY + cardHeight + 6;
}

// ─── Título de seção ────────────────────────────────────────────────────────
function adicionarTituloSecao(doc, titulo, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COR_AZUL_ESCURO);
  doc.text(titulo, 14, y);
  doc.setDrawColor(...COR_AMARELO);
  doc.setLineWidth(1);
  const tw = doc.getTextWidth(titulo);
  doc.line(14, y + 1.5, 14 + tw, y + 1.5);
  return y + 6;
}

// ─── Lista "Top N" (cards horizontais com rank) ─────────────────────────────
function adicionarTopList(doc, titulo, itens, startY, formatador) {
  if (!itens.length) return startY;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = adicionarTituloSecao(doc, titulo, startY);

  itens.slice(0, 3).forEach((item, i) => {
    const rankColors = [COR_AMARELO, [156, 163, 175], [180, 83, 9]];
    const rankColor = rankColors[i] || COR_TEXTO_CLARO;
    const lineHeight = 10;

    doc.setFillColor(...COR_FUNDO_CARD);
    doc.roundedRect(margin, y, pageWidth - margin * 2, lineHeight, 1.5, 1.5, "F");

    // Círculo do rank
    doc.setFillColor(...rankColor);
    doc.circle(margin + 5, y + lineHeight / 2, 3.2, "F");
    doc.setTextColor(...COR_AZUL_ESCURO);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(i + 1), margin + 5, y + lineHeight / 2 + 1.2, { align: "center" });

    // Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COR_TEXTO);
    doc.text(String(item.label || "—"), margin + 12, y + lineHeight / 2 + 1.2);

    // Valor à direita
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...(item.color || COR_AZUL_ESCURO));
    doc.text(
      String(formatador ? formatador(item) : item.valor || "—"),
      pageWidth - margin - 2,
      y + lineHeight / 2 + 1.2,
      { align: "right" },
    );

    y += lineHeight + 2;
  });

  return y + 2;
}

function criarTabela(doc, options) {
  autoTable(doc, {
    theme: "plain",
    headStyles: {
      fillColor: COR_AZUL_ESCURO,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: { top: 6, right: 5, bottom: 6, left: 5 },
      lineColor: COR_AZUL_ESCURO,
      lineWidth: 0.1,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COR_TEXTO,
      cellPadding: { top: 5, right: 5, bottom: 5, left: 5 },
      lineColor: COR_BORDA,
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: COR_FUNDO_ALT,
    },
    margin: { left: 14, right: 14 },
    ...options,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// VENDAS POR PERÍODO
// ════════════════════════════════════════════════════════════════════════════
export function gerarPdfVendasPeriodo(vendas, dataInicio, dataFim, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  adicionarCabecalho(
    doc,
    "Relatório de Vendas",
    "Faturamento por período",
    nomeEmpresa,
  );

  let y = 42;

  // Box de informações
  y = adicionarBoxInfo(
    doc,
    [
      ["Período", `${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}`],
      ["Empresa", nomeEmpresa],
      ["Total de vendas", `${vendas.length} registro(s)`],
    ],
    y,
  );

  // KPIs
  const totalGeral = vendas.reduce((a, v) => a + Number(v.valor || 0), 0);
  const ticketMedio = vendas.length ? totalGeral / vendas.length : 0;
  const itensTotais = vendas.reduce(
    (a, v) => a + (Array.isArray(v.itens) ? v.itens.length : Number(v.itens) || 0),
    0,
  );
  const maiorVenda = vendas.reduce(
    (max, v) => (Number(v.valor || 0) > Number(max?.valor || 0) ? v : max),
    null,
  );

  y = adicionarKpiCards(
    doc,
    [
      {
        label: "Total Faturado",
        value: formatarMoeda(totalGeral),
        sub: `${vendas.length} venda(s)`,
        bgColor: COR_VERDE_SUAVE,
        accentColor: COR_VERDE,
        valueColor: COR_VERDE,
        valueSize: 12,
      },
      {
        label: "Ticket Médio",
        value: formatarMoeda(ticketMedio),
        sub: "por venda",
        bgColor: COR_AZUL_INFO_SUAVE,
        accentColor: COR_AZUL_INFO,
        valueColor: COR_AZUL_INFO,
        valueSize: 12,
      },
      {
        label: "Itens Vendidos",
        value: formatarNumero(itensTotais),
        sub: "unidades",
        bgColor: COR_AMARELO_SUAVE,
        accentColor: COR_AZUL_ESCURO,
        valueColor: COR_AZUL_ESCURO,
        valueSize: 12,
      },
      {
        label: "Maior Venda",
        value: formatarMoeda(maiorVenda?.valor || 0),
        sub: maiorVenda?.cliente || "—",
        bgColor: COR_LARANJA_SUAVE,
        accentColor: COR_LARANJA,
        valueColor: COR_LARANJA,
        valueSize: 12,
      },
    ],
    y,
  );

  // Tabela
  y = adicionarTituloSecao(doc, "Detalhamento das vendas", y);
  criarTabela(doc, {
    startY: y,
    head: [["Data", "Cliente", "Itens", "Valor (R$)"]],
    body: vendas.map((v) => [
      formatarDataBR(v.data),
      v.cliente || "—",
      String(Array.isArray(v.itens) ? v.itens.length : v.itens ?? 0),
      formatarMoeda(Number(v.valor || 0)),
    ]),
    foot: [["", "Total Geral", String(itensTotais), formatarMoeda(totalGeral)]],
    footStyles: {
      fillColor: COR_AZUL_ESCURO,
      textColor: COR_AMARELO,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: { top: 7, right: 5, bottom: 7, left: 5 },
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 38, halign: "right", fontStyle: "bold" },
    },
  });

  adicionarRodape(doc);
  return doc;
}

// ════════════════════════════════════════════════════════════════════════════
// ESTOQUE
// ════════════════════════════════════════════════════════════════════════════
export function gerarPdfEstoque(estoque, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  adicionarCabecalho(
    doc,
    "Relatório de Estoque",
    "Situação atual dos produtos",
    nomeEmpresa,
  );

  let y = 42;

  const total = estoque.length;
  const criticos = estoque.filter((e) => e.status === "Crítico").length;
  const baixos = estoque.filter((e) => e.status === "Baixo").length;
  const normais = estoque.filter((e) => e.status === "Normal").length;
  const totalUnidades = estoque.reduce((a, e) => a + Number(e.atual || 0), 0);

  y = adicionarBoxInfo(
    doc,
    [
      ["Empresa", nomeEmpresa],
      ["Total de produtos", `${total} item(ns)`],
      ["Unidades em estoque", formatarNumero(totalUnidades)],
    ],
    y,
  );

  y = adicionarKpiCards(
    doc,
    [
      {
        label: "Total Produtos",
        value: formatarNumero(total),
        sub: "no estoque",
        bgColor: COR_AZUL_INFO_SUAVE,
        accentColor: COR_AZUL_INFO,
        valueColor: COR_AZUL_INFO,
      },
      {
        label: "Estoque Crítico",
        value: formatarNumero(criticos),
        sub: total ? `${((criticos / total) * 100).toFixed(0)}% do total` : "—",
        bgColor: COR_VERMELHO_SUAVE,
        accentColor: COR_VERMELHO,
        valueColor: COR_VERMELHO,
      },
      {
        label: "Estoque Baixo",
        value: formatarNumero(baixos),
        sub: total ? `${((baixos / total) * 100).toFixed(0)}% do total` : "—",
        bgColor: COR_LARANJA_SUAVE,
        accentColor: COR_LARANJA,
        valueColor: COR_LARANJA,
      },
      {
        label: "Estoque Normal",
        value: formatarNumero(normais),
        sub: total ? `${((normais / total) * 100).toFixed(0)}% do total` : "—",
        bgColor: COR_VERDE_SUAVE,
        accentColor: COR_VERDE,
        valueColor: COR_VERDE,
      },
    ],
    y,
  );

  y = adicionarTituloSecao(doc, "Detalhamento por produto", y);

  criarTabela(doc, {
    startY: y,
    head: [["Produto", "SKU", "Atual", "Mínimo", "Status"]],
    body: estoque.map((e) => [
      e.produto || "—",
      e.sku || "—",
      String(e.atual ?? 0),
      String(e.minimo ?? 0),
      e.status || "—",
    ]),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 35 },
      2: { cellWidth: 22, halign: "center", fontStyle: "bold" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 30, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 4) return;
      const status = String(data.cell.raw || "").toLowerCase();
      if (status === "crítico" || status === "critico") {
        data.cell.styles.fillColor = COR_VERMELHO_SUAVE;
        data.cell.styles.textColor = COR_VERMELHO;
      } else if (status === "baixo") {
        data.cell.styles.fillColor = COR_LARANJA_SUAVE;
        data.cell.styles.textColor = COR_LARANJA;
      } else if (status === "normal") {
        data.cell.styles.fillColor = COR_VERDE_SUAVE;
        data.cell.styles.textColor = COR_VERDE;
      }
    },
  });

  adicionarRodape(doc);
  return doc;
}

// ════════════════════════════════════════════════════════════════════════════
// VENDAS POR CLIENTE
// ════════════════════════════════════════════════════════════════════════════
export function gerarPdfVendasPorCliente(clientes, dataInicio, dataFim, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  adicionarCabecalho(
    doc,
    "Relatório de Vendas por Cliente",
    "Análise de faturamento por cliente",
    nomeEmpresa,
  );

  let y = 42;

  const totalGeral = clientes.reduce((a, c) => a + Number(c.valor || 0), 0);
  const totalPedidos = clientes.reduce((a, c) => a + Number(c.pedidos || 0), 0);
  const ticketMedio = totalPedidos ? totalGeral / totalPedidos : 0;
  const topCliente = [...clientes].sort(
    (a, b) => Number(b.valor || 0) - Number(a.valor || 0),
  )[0];

  y = adicionarBoxInfo(
    doc,
    [
      ["Período", `${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}`],
      ["Empresa", nomeEmpresa],
      ["Clientes ativos", `${clientes.length} cliente(s)`],
    ],
    y,
  );

  y = adicionarKpiCards(
    doc,
    [
      {
        label: "Faturamento Total",
        value: formatarMoeda(totalGeral),
        sub: `${totalPedidos} pedido(s)`,
        bgColor: COR_VERDE_SUAVE,
        accentColor: COR_VERDE,
        valueColor: COR_VERDE,
        valueSize: 12,
      },
      {
        label: "Ticket Médio",
        value: formatarMoeda(ticketMedio),
        sub: "por pedido",
        bgColor: COR_AZUL_INFO_SUAVE,
        accentColor: COR_AZUL_INFO,
        valueColor: COR_AZUL_INFO,
        valueSize: 12,
      },
      {
        label: "Top Cliente",
        value: topCliente ? formatarMoeda(topCliente.valor || 0) : "—",
        sub: topCliente?.cliente || "—",
        bgColor: COR_AMARELO_SUAVE,
        accentColor: COR_AZUL_ESCURO,
        valueColor: COR_AZUL_ESCURO,
        valueSize: 12,
      },
      {
        label: "Clientes",
        value: formatarNumero(clientes.length),
        sub: "no período",
        bgColor: COR_LARANJA_SUAVE,
        accentColor: COR_LARANJA,
        valueColor: COR_LARANJA,
        valueSize: 14,
      },
    ],
    y,
  );

  // Top 3 clientes
  const topClientes = [...clientes]
    .sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0))
    .map((c) => ({
      label: c.cliente || "Não informado",
      valor: c.valor || 0,
    }));
  y = adicionarTopList(
    doc,
    "Top 3 clientes",
    topClientes,
    y,
    (i) => formatarMoeda(i.valor),
  );

  y = adicionarTituloSecao(doc, "Detalhamento por cliente", y);

  criarTabela(doc, {
    startY: y,
    head: [["Cliente", "Pedidos", "Total Vendido", "Ticket Médio"]],
    body: clientes.map((item) => [
      item.cliente || "Não informado",
      String(item.pedidos || 0),
      formatarMoeda(item.valor || 0),
      formatarMoeda(item.ticketMedio || 0),
    ]),
    foot: [
      ["Total", String(totalPedidos), formatarMoeda(totalGeral), formatarMoeda(ticketMedio)],
    ],
    footStyles: {
      fillColor: COR_AZUL_ESCURO,
      textColor: COR_AMARELO,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: { top: 7, right: 5, bottom: 7, left: 5 },
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 40, halign: "right", fontStyle: "bold" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  adicionarRodape(doc);
  return doc;
}

// ════════════════════════════════════════════════════════════════════════════
// PRODUTOS MAIS VENDIDOS
// ════════════════════════════════════════════════════════════════════════════
export function gerarPdfProdutosMaisVendidos(produtos, dataInicio, dataFim, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  adicionarCabecalho(
    doc,
    "Produtos Mais Vendidos",
    "Ranking de produtos por desempenho",
    nomeEmpresa,
  );

  let y = 42;

  const totalQtd = produtos.reduce((a, p) => a + Number(p.quantidade || 0), 0);
  const totalValor = produtos.reduce((a, p) => a + Number(p.valor || 0), 0);
  const ordenados = [...produtos].sort(
    (a, b) => Number(b.quantidade || 0) - Number(a.quantidade || 0),
  );
  const maxQtd = ordenados[0]?.quantidade || 1;

  y = adicionarBoxInfo(
    doc,
    [
      ["Período", `${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}`],
      ["Empresa", nomeEmpresa],
      ["Produtos vendidos", `${produtos.length} item(ns) distintos`],
    ],
    y,
  );

  y = adicionarKpiCards(
    doc,
    [
      {
        label: "Unidades Vendidas",
        value: formatarNumero(totalQtd),
        sub: `${produtos.length} produtos`,
        bgColor: COR_AZUL_INFO_SUAVE,
        accentColor: COR_AZUL_INFO,
        valueColor: COR_AZUL_INFO,
      },
      {
        label: "Faturamento",
        value: formatarMoeda(totalValor),
        sub: "no período",
        bgColor: COR_VERDE_SUAVE,
        accentColor: COR_VERDE,
        valueColor: COR_VERDE,
        valueSize: 12,
      },
      {
        label: "Produto Top",
        value: ordenados[0] ? formatarNumero(ordenados[0].quantidade) : "—",
        sub: ordenados[0]?.produto || "—",
        bgColor: COR_AMARELO_SUAVE,
        accentColor: COR_AZUL_ESCURO,
        valueColor: COR_AZUL_ESCURO,
      },
      {
        label: "Média/Produto",
        value: produtos.length
          ? formatarNumero(Math.round(totalQtd / produtos.length))
          : "0",
        sub: "unidades",
        bgColor: COR_LARANJA_SUAVE,
        accentColor: COR_LARANJA,
        valueColor: COR_LARANJA,
      },
    ],
    y,
  );

  // Top 3 visualmente
  const topItens = ordenados.map((p) => ({
    label: p.produto || "Produto",
    valor: p.quantidade || 0,
  }));
  y = adicionarTopList(
    doc,
    "Top 3 produtos por quantidade",
    topItens,
    y,
    (i) => `${formatarNumero(i.valor)} un.`,
  );

  y = adicionarTituloSecao(doc, "Ranking completo", y);

  criarTabela(doc, {
    startY: y,
    head: [["#", "Produto", "Qtd. Vendida", "Valor Total", "Participação"]],
    body: ordenados.map((item, i) => {
      const participacao = totalQtd ? (Number(item.quantidade || 0) / totalQtd) * 100 : 0;
      return [
        String(i + 1),
        item.produto || "Produto",
        formatarNumero(item.quantidade || 0),
        formatarMoeda(item.valor || 0),
        `${participacao.toFixed(1)}%`,
      ];
    }),
    foot: [
      ["", "Total", formatarNumero(totalQtd), formatarMoeda(totalValor), "100%"],
    ],
    footStyles: {
      fillColor: COR_AZUL_ESCURO,
      textColor: COR_AMARELO,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: { top: 7, right: 5, bottom: 7, left: 5 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 28, halign: "center", fontStyle: "bold" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 26, halign: "center" },
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 0) return;
      // Top 3 com cor especial
      const rowIndex = data.row.index;
      if (rowIndex === 0) {
        data.cell.styles.fillColor = COR_AMARELO;
        data.cell.styles.textColor = COR_AZUL_ESCURO;
      } else if (rowIndex === 1) {
        data.cell.styles.fillColor = [229, 231, 235];
        data.cell.styles.textColor = COR_AZUL_ESCURO;
      } else if (rowIndex === 2) {
        data.cell.styles.fillColor = [254, 215, 170];
        data.cell.styles.textColor = COR_AZUL_ESCURO;
      }
    },
  });

  adicionarRodape(doc);
  return doc;
}

// ────────────────────────────────────────────────────────────────────────────
export function downloadPdf(doc, filename) {
  doc.save(filename);
}
