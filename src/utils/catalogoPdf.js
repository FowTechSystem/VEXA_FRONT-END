/**
 * PDF do catálogo de produtos (Catálogo digital)
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const COR_PRIMARIA = [41, 98, 255];
const COR_TEXTO = [33, 33, 33];
const COR_TEXTO_SECUNDARIO = [97, 97, 97];
const COR_FUNDO_HEADER = [245, 247, 250];

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

/**
 * @param {object} opcoes
 * @param {Array<{ nome: string, preco: number, sku?: string, tipo?: string }>} opcoes.itens
 * @param {string} opcoes.empresaNome
 * @param {string} [opcoes.linkPublico] — link da vitrine web (opcional)
 * @returns {import("jspdf").jsPDF}
 */
export function montarDocumentoCatalogoPdf({ itens, empresaNome, linkPublico }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(...COR_PRIMARIA);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("VEXA", 14, 20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Catálogo de produtos", 14, 28);

  doc.setTextColor(...COR_TEXTO_SECUNDARIO);
  doc.setFontSize(8);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    pageW - 14,
    20,
    { align: "right" },
  );

  doc.setTextColor(...COR_TEXTO);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Empresa:", 14, 42);
  doc.setFont("helvetica", "normal");
  doc.text(empresaNome || "—", 34, 42);

  const body = (itens || []).map((item, i) => [
    String(i + 1),
    item.nome || "—",
    item.sku || "—",
    item.tipo || "—",
    formatarMoeda(item.preco),
  ]);

  autoTable(doc, {
    startY: 48,
    head: [["#", "Produto", "SKU", "Tipo", "Preço"]],
    body,
    theme: "plain",
    headStyles: {
      fillColor: COR_FUNDO_HEADER,
      textColor: COR_TEXTO,
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      textColor: COR_TEXTO,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 75 },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 32, halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  let y = doc.lastAutoTable?.finalY ?? 48;
  y += 10;

  if (linkPublico) {
    doc.setFontSize(8);
    doc.setTextColor(...COR_TEXTO_SECUNDARIO);
    doc.setFont("helvetica", "bold");
    doc.text("Catálogo interativo (pedidos pelo site):", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const split = doc.splitTextToSize(linkPublico, pageW - 28);
    doc.text(split, 14, y);
    y += split.length * 4 + 4;
  }

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COR_TEXTO_SECUNDARIO);
    doc.text(
      `Página ${i} de ${totalPaginas} · ${itens?.length ?? 0} produto(s)`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
  }

  return doc;
}

export function catalogoPdfParaBlob(doc) {
  return doc.output("blob");
}

export function nomeArquivoCatalogoPdf(empresaNome) {
  const slug = String(empresaNome || "catalogo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `catalogo-${slug || "vexa"}-${Date.now()}.pdf`;
}
