import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const COR_AZUL_ESCURO = [43, 45, 66];
const COR_AMARELO = [248, 243, 43];
const COR_TEXTO = [31, 41, 55];
const COR_TEXTO_SECUNDARIO = [107, 114, 128];
const COR_BORDA = [214, 219, 226];
const COR_FUNDO_HEADER = [245, 246, 250];
const COR_FUNDO_ALT = [250, 251, 253];

function formatarDataBR(dataStr) {
  if (!dataStr) return "—";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(valor);
}

/**
 * Cabeçalho padrão no tema do sistema.
 */
function adicionarCabecalho(doc, titulo, nomeEmpresa = "VEXA") {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COR_AZUL_ESCURO);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setFillColor(...COR_AMARELO);
  doc.rect(0, 30, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("VEXA CRM", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(titulo, 14, 22);

  doc.setTextColor(...COR_AMARELO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(nomeEmpresa || "VEXA", pageWidth - 14, 14, { align: "right" });

  doc.setTextColor(225, 228, 235);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    pageWidth - 14,
    22,
    { align: "right" }
  );
}

/**
 * Adiciona rodapé com número da página
 */
function adicionarRodape(doc) {
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COR_TEXTO_SECUNDARIO);
    doc.text(
      `Página ${i} de ${totalPaginas}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }
}

function criarTabela(doc, options) {
  autoTable(doc, {
    theme: "plain",
    headStyles: {
      fillColor: COR_FUNDO_HEADER,
      textColor: COR_TEXTO,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: { top: 8, right: 6, bottom: 8, left: 6 },
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COR_TEXTO,
      cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
    },
    alternateRowStyles: {
      fillColor: COR_FUNDO_ALT,
    },
    margin: { left: 14, right: 14 },
    tableLineColor: COR_BORDA,
    tableLineWidth: 0.1,
    ...options,
  });
}

export function gerarPdfVendasPeriodo(vendas, dataInicio, dataFim, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const startY = 40;

  adicionarCabecalho(doc, "Relatório de Vendas por Período", nomeEmpresa);

  doc.setFontSize(10);
  doc.setTextColor(...COR_TEXTO);
  doc.setFont("helvetica", "bold");
  doc.text("Período:", margin, startY);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}`,
    margin + 22,
    startY
  );

  doc.text("Empresa:", margin, startY + 6);
  doc.text(nomeEmpresa, margin + 22, startY + 6);

  const tableStartY = startY + 20;
  const total = vendas.reduce((a, v) => a + Number(v.valor || 0), 0);
  criarTabela(doc, {
    startY: tableStartY,
    head: [["Data", "Cliente", "Itens", "Valor (R$)"]],
    body: vendas.map((v) => [
      formatarDataBR(v.data),
      v.cliente || "—",
      String(Array.isArray(v.itens) ? v.itens.length : v.itens ?? 0),
      formatarMoeda(Number(v.valor || 0)),
    ]),
    foot: [
      ["", "", "Total", formatarMoeda(total)],
    ],
    footStyles: {
      fillColor: COR_AZUL_ESCURO,
      textColor: COR_AMARELO,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: { top: 8, right: 6, bottom: 8, left: 6 },
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
    },
  });

  const finalY = doc.lastAutoTable.finalY || tableStartY + 40;
  doc.setFontSize(10);
  doc.setTextColor(...COR_TEXTO_SECUNDARIO);
  doc.text(
    `${vendas.length} venda(s) no período | Total: ${formatarMoeda(total)}`,
    margin,
    finalY + 12
  );

  adicionarRodape(doc);

  return doc;
}

export function gerarPdfEstoque(estoque, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const startY = 40;

  adicionarCabecalho(doc, "Relatório de Produtos em Estoque", nomeEmpresa);

  doc.setFontSize(10);
  doc.setTextColor(...COR_TEXTO);
  doc.setFont("helvetica", "bold");
  doc.text("Empresa: " + nomeEmpresa, margin, startY);

  const tableStartY = startY + 14;
  criarTabela(doc, {
    startY: tableStartY,
    head: [["Produto", "SKU", "Estoque", "Mín.", "Status"]],
    body: estoque.map((e) => [
      e.produto || "—",
      e.sku || "—",
      String(e.atual),
      String(e.minimo),
      e.status,
    ]),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 35 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 28, halign: "center" },
    },
  });

  const criticos = estoque.filter((e) => e.status === "Crítico").length;
  const finalY = doc.lastAutoTable.finalY || tableStartY + 40;
  doc.setFontSize(10);
  doc.setTextColor(...COR_TEXTO_SECUNDARIO);
  doc.text(
    `${estoque.length} produto(s) | ${criticos} em situação crítica`,
    margin,
    finalY + 12
  );

  adicionarRodape(doc);

  return doc;
}

export function gerarPdfVendasPorCliente(clientes, dataInicio, dataFim, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const startY = 40;
  adicionarCabecalho(doc, "Relatório de Vendas por Cliente", nomeEmpresa);

  doc.setFontSize(10);
  doc.setTextColor(...COR_TEXTO);
  doc.setFont("helvetica", "bold");
  doc.text("Período:", margin, startY);
  doc.setFont("helvetica", "normal");
  doc.text(`${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}`, margin + 22, startY);

  criarTabela(doc, {
    startY: startY + 12,
    head: [["Cliente", "Pedidos", "Total vendido", "Ticket médio"]],
    body: clientes.map((item) => [
      item.cliente || "Não informado",
      String(item.pedidos || 0),
      formatarMoeda(item.valor || 0),
      formatarMoeda(item.ticketMedio || 0),
    ]),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 24, halign: "center" },
      2: { cellWidth: 40, halign: "right" },
      3: { cellWidth: 40, halign: "right" },
    },
  });

  adicionarRodape(doc);
  return doc;
}

export function gerarPdfProdutosMaisVendidos(produtos, dataInicio, dataFim, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const startY = 40;
  adicionarCabecalho(doc, "Relatório de Produtos Mais Vendidos", nomeEmpresa);

  doc.setFontSize(10);
  doc.setTextColor(...COR_TEXTO);
  doc.setFont("helvetica", "bold");
  doc.text("Período:", margin, startY);
  doc.setFont("helvetica", "normal");
  doc.text(`${formatarDataBR(dataInicio)} a ${formatarDataBR(dataFim)}`, margin + 22, startY);

  criarTabela(doc, {
    startY: startY + 12,
    head: [["Produto", "Qtd. vendida", "Valor total"]],
    body: produtos.map((item) => [
      item.produto || "Produto",
      String(item.quantidade || 0),
      formatarMoeda(item.valor || 0),
    ]),
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 34, halign: "center" },
      2: { cellWidth: 44, halign: "right" },
    },
  });

  adicionarRodape(doc);
  return doc;
}

export function downloadPdf(doc, filename) {
  doc.save(filename);
}
