/**
 * PDF do catálogo de produtos — layout em grade (referência: catálogos B2B com foto + código + preço).
 */
import { jsPDF } from "jspdf";
import { apiBaseURL } from "../config/apiBase.js";

/** Paleta alinhada ao tema VEXA (azul escuro + amarelo destaque) */
const NAVY = [43, 45, 66];
const AMARELO = [248, 243, 43];
const BRANCO = [255, 255, 255];
const TEXTO = [33, 33, 33];
const TEXTO_MUDO = [120, 120, 120];
const FUNDO_CELULA = [248, 249, 251];
const BORDA = [220, 223, 230];

const MM = {
  margem: 10,
  headerH: 26,
  footerH: 11,
  gutter: 5,
  cellH: 68,
  imgBoxH: 36,
  tituloH: 12,
  rodapeCelH: 8,
};

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function absolutizarUrlImagem(src) {
  if (!src || typeof src !== "string") return null;
  const s = src.trim();
  if (!s) return null;
  if (s.startsWith("data:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (typeof window === "undefined") return s;
  if (s.startsWith("/")) return `${window.location.origin}${s}`;
  const baseApi = apiBaseURL.startsWith("http")
    ? apiBaseURL.replace(/\/$/, "")
    : `${window.location.origin}${apiBaseURL.replace(/\/$/, "")}`;
  try {
    return new URL(s, `${baseApi}/`).href;
  } catch {
    return `${window.location.origin}/${s.replace(/^\//, "")}`;
  }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function carregarImagemParaPdf(url) {
  const abs = absolutizarUrlImagem(url);
  if (!abs) return null;
  if (abs.startsWith("data:")) return abs;
  try {
    const res = await fetch(abs, { mode: "cors", credentials: "include" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    if (blob.size > 4 * 1024 * 1024) return null;
    return await blobToDataURL(blob);
  } catch {
    return null;
  }
}

function formatoAddImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== "string") return "JPEG";
  if (dataUrl.includes("image/png")) return "PNG";
  if (dataUrl.includes("image/webp")) return "WEBP";
  return "JPEG";
}

function desenharCabecalho(doc, empresaNome, pageW) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, MM.headerH, "F");

  doc.setTextColor(...BRANCO);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("VEXA CRM", MM.margem, 11);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const nomeEmp = String(empresaNome || "Loja").slice(0, 48);
  doc.text(nomeEmp, MM.margem, 20);

  const pillW = 42;
  const pillH = 14;
  const pillX = pageW - MM.margem - pillW;
  const pillY = 6;
  doc.setFillColor(...AMARELO);
  doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Nossos produtos", pillX + pillW / 2, pillY + pillH / 2 + 2.2, { align: "center" });
}

function desenharRodapePagina(doc, pageIndex, totalPaginas, pageW, pageH) {
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - MM.footerH, pageW, MM.footerH, "F");
  doc.setTextColor(...BRANCO);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Página ${pageIndex} de ${totalPaginas}`, pageW / 2, pageH - 4, { align: "center" });
}

/**
 * Desenha uma célula de produto (nome, área de foto, código, preço).
 */
function desenharCelulaProduto(doc, x, y, colW, item, dataUrlImagem) {
  doc.setDrawColor(...BORDA);
  doc.setFillColor(...FUNDO_CELULA);
  doc.roundedRect(x, y, colW, MM.cellH, 1.2, 1.2, "FD");

  doc.setTextColor(...TEXTO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const nome = String(item.nome || "—").slice(0, 80);
  const linhasNome = doc.splitTextToSize(nome, colW - 4);
  const maxLinhas = 2;
  const usar = linhasNome.slice(0, maxLinhas);
  doc.text(usar, x + 2, y + 5.5);

  const imgX = x + 2;
  const imgY = y + MM.tituloH;
  const imgW = colW - 4;
  const imgH = MM.imgBoxH;

  doc.setDrawColor(...BORDA);
  doc.setFillColor(255, 255, 255);
  doc.rect(imgX, imgY, imgW, imgH, "FD");

  if (dataUrlImagem) {
    try {
      const fmt = formatoAddImage(dataUrlImagem);
      const prop = doc.getImageProperties(dataUrlImagem);
      const pw = Math.max(prop.width, 1);
      const ph = Math.max(prop.height, 1);
      let w = imgW;
      let h = (ph / pw) * w;
      if (h > imgH) {
        h = imgH;
        w = (pw / ph) * h;
      }
      const ix = imgX + (imgW - w) / 2;
      const iy = imgY + (imgH - h) / 2;
      doc.addImage(dataUrlImagem, fmt, ix, iy, w, h, undefined, "FAST");
    } catch {
      doc.setFontSize(7);
      doc.setTextColor(...TEXTO_MUDO);
      doc.setFont("helvetica", "italic");
      doc.text("Foto indisponível", imgX + imgW / 2, imgY + imgH / 2, { align: "center" });
    }
  } else {
    doc.setFontSize(7);
    doc.setTextColor(...TEXTO_MUDO);
    doc.setFont("helvetica", "italic");
    doc.text("Sem foto", imgX + imgW / 2, imgY + imgH / 2, { align: "center" });
  }

  const baseY = y + MM.cellH - 3;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...TEXTO_MUDO);
  const cod = String(item.sku || item.Sku || "—").slice(0, 24);
  doc.text(`Cod: ${cod}`, x + 2, baseY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  const precoTxt = formatarMoeda(item.preco);
  doc.text(precoTxt, x + colW - 2, baseY, { align: "right" });
}

/**
 * @param {object} opcoes
 * @param {Array<{ nome: string, preco: number, sku?: string, tipo?: string, imagemUrl?: string | null }>} opcoes.itens
 * @param {string} opcoes.empresaNome
 * @returns {Promise<import("jspdf").jsPDF>}
 */
export async function montarDocumentoCatalogoPdf({ itens, empresaNome }) {
  const lista = Array.isArray(itens) ? itens : [];
  const imagensData = await Promise.all(
    lista.map((it) => carregarImagemParaPdf(it.imagemUrl ?? it.foto1 ?? null)),
  );

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const colW = (pageW - 2 * MM.margem - MM.gutter) / 2;
  const contentTop = MM.headerH + 5;
  const contentBottom = pageH - MM.footerH - 4;
  const rowH = MM.cellH + MM.gutter;
  const maxRows = Math.max(1, Math.floor((contentBottom - contentTop) / rowH));
  const perPage = maxRows * 2;

  let pageNum = 1;
  desenharCabecalho(doc, empresaNome, pageW);

  let y0 = contentTop;

  for (let i = 0; i < lista.length; i++) {
    if (i > 0 && i % perPage === 0) {
      doc.addPage();
      pageNum += 1;
      desenharCabecalho(doc, empresaNome, pageW);
      y0 = contentTop;
    }

    const pos = i % perPage;
    const row = Math.floor(pos / 2);
    const col = pos % 2;
    const x = MM.margem + col * (colW + MM.gutter);
    const y = y0 + row * rowH;

    desenharCelulaProduto(doc, x, y, colW, lista[i], imagensData[i]);
  }

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    desenharRodapePagina(doc, p, totalPaginas, pageW, pageH);
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
