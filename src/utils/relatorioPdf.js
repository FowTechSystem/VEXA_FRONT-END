/**
 * Utilitário para geração de relatórios em PDF - layout profissional
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const COR_PRIMARIA = [41, 98, 255]; // #2962FF
const COR_TEXTO = [33, 33, 33];
const COR_TEXTO_SECUNDARIO = [97, 97, 97];
const COR_BORDA = [224, 224, 224];
const COR_FUNDO_HEADER = [245, 247, 250];
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
 * Adiciona cabeçalho padrão em todas as páginas
 */
function adicionarCabecalho(doc, titulo) {
  doc.setFillColor(...COR_PRIMARIA);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("VEXA CRM", 14, 20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(titulo, 14, 28);

  doc.setTextColor(...COR_TEXTO_SECUNDARIO);
  doc.setFontSize(8);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    doc.internal.pageSize.getWidth() - 14,
    20,
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

/**
 * Gera PDF do relatório de vendas por período
 */
export function gerarPdfVendas(vendas, dataInicio, dataFim, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const startY = 42;

  // Cabeçalho
  adicionarCabecalho(doc, "Relatório de Vendas por Período");

  // Informações do período
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

  // Tabela de vendas
  const tableStartY = startY + 20;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Data", "Cliente", "Itens", "Valor (R$)"]],
    body: vendas.map((v) => [
      formatarDataBR(v.data),
      v.cliente || "—",
      String(v.itens ?? 0),
      formatarMoeda(v.valor),
    ]),
    foot: [
      ["", "", "Total", formatarMoeda(vendas.reduce((a, v) => a + v.valor, 0))],
    ],
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
    footStyles: {
      fillColor: COR_PRIMARIA,
      textColor: [255, 255, 255],
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
    margin: { left: margin, right: margin },
    tableLineColor: COR_BORDA,
    tableLineWidth: 0.1,
  });

  // Resumo abaixo da tabela
  const finalY = doc.lastAutoTable.finalY || tableStartY + 40;
  doc.setFontSize(10);
  doc.setTextColor(...COR_TEXTO_SECUNDARIO);
  doc.text(
    `${vendas.length} venda(s) no período | Total: ${formatarMoeda(vendas.reduce((a, v) => a + v.valor, 0))}`,
    margin,
    finalY + 12
  );

  adicionarRodape(doc);

  return doc;
}

/**
 * Gera PDF do relatório de estoque
 */
export function gerarPdfEstoque(estoque, nomeEmpresa = "VEXA") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  const startY = 42;

  adicionarCabecalho(doc, "Relatório de Produtos em Estoque");

  doc.setFontSize(10);
  doc.setTextColor(...COR_TEXTO);
  doc.text("Empresa: " + nomeEmpresa, margin, startY);

  const tableStartY = startY + 14;

  autoTable(doc, {
    startY: tableStartY,
    head: [["Produto", "SKU", "Estoque", "Mín.", "Status"]],
    body: estoque.map((e) => [
      e.produto || "—",
      e.sku || "—",
      String(e.atual),
      String(e.minimo),
      e.status,
    ]),
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
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 35 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 18, halign: "center" },
      4: { cellWidth: 28, halign: "center" },
    },
    margin: { left: margin, right: margin },
    tableLineColor: COR_BORDA,
    tableLineWidth: 0.1,
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

/**
 * Faz o download do PDF
 */
export function downloadPdf(doc, filename) {
  doc.save(filename);
}
