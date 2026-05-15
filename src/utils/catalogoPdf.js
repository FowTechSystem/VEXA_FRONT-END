/**
 * PDF do catálogo digital — layout vitrine (foto em destaque, tipografia hierarchy, VEXA).
 */
import { jsPDF } from "jspdf";
import { apiBaseURL } from "../config/apiBase.js";

/** Paleta VEXA */
const NAVY = [43, 45, 66];
const NAVY_CLARO = [58, 62, 88];
const AMARELO = [248, 243, 43];
const BRANCO = [255, 255, 255];
const TEXTO = [26, 32, 44];
const TEXTO_MUDO = [107, 114, 128];
const FUNDO_PAGINA = [246, 247, 250];
const CARD_SOMBRA = [220, 223, 232];
const BORDA_CARD = [226, 229, 237];
const FAIXA_IMG = [243, 244, 248];

const MM = {
  margem: 11,
  headerH: 34,
  footerH: 14,
  gutter: 7,
  /** Altura total do cartão (mm) */
  cellH: 92,
  /** Área da foto (mm) — proporção mais “catálogo” */
  imgBoxH: 54,
  /** Cantos arredondados cartão */
  cardR: 3.2,
};

function formatarMoeda(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
}

function dataCatalogoLegivel() {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
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

/**
 * Preenche o retângulo (object-fit: cover) com clipping.
 */
function desenharImagemCover(doc, dataUrl, fmt, imgX, imgY, imgW, imgH) {
  const prop = doc.getImageProperties(dataUrl);
  const pw = Math.max(prop.width, 1);
  const ph = Math.max(prop.height, 1);
  const scale = Math.max(imgW / pw, imgH / ph);
  const dw = pw * scale;
  const dh = ph * scale;
  const ix = imgX + (imgW - dw) / 2;
  const iy = imgY + (imgH - dh) / 2;

  doc.saveGraphicsState();
  doc.rect(imgX, imgY, imgW, imgH);
  doc.clip();
  doc.addImage(dataUrl, fmt, ix, iy, dw, dh, undefined, "FAST");
  doc.restoreGraphicsState();
}

function desenharFundoConteudo(doc, pageW, pageH) {
  doc.setFillColor(...FUNDO_PAGINA);
  doc.rect(0, MM.headerH, pageW, pageH - MM.headerH, "F");
}

function desenharCabecalho(doc, empresaNome, pageW) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, MM.headerH, "F");

  doc.setDrawColor(...NAVY_CLARO);
  doc.setLineWidth(0.35);
  doc.line(0, MM.headerH - 0.2, pageW, MM.headerH - 0.2);

  doc.setFillColor(...AMARELO);
  doc.rect(0, MM.headerH - 2.2, pageW, 2.2, "F");

  doc.setTextColor(...BRANCO);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("VEXA · Catálogo digital", MM.margem, 12);

  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  const nomeEmp = String(empresaNome || "Loja").slice(0, 52);
  doc.text(nomeEmp, MM.margem, 23);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(200, 203, 220);
  doc.text(dataCatalogoLegivel(), MM.margem, 30);

  const pillW = 48;
  const pillH = 15;
  const pillX = pageW - MM.margem - pillW;
  const pillY = 9;
  doc.setFillColor(...AMARELO);
  doc.roundedRect(pillX, pillY, pillW, pillH, 2.5, 2.5, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("NOSSOS PRODUTOS", pillX + pillW / 2, pillY + pillH / 2 + 2.4, { align: "center" });
}

/**
 * Capa profissional do catálogo — primeira página em A4 portrait.
 * Layout: faixa navy no topo (1/3 da página), título centralizado embaixo,
 * info da loja, contagem de produtos, data, faixa amarela inferior.
 */
function desenharCapa(doc, empresaNome, totalProdutos, pageW, pageH) {
  // ── Fundo geral (creme claro)
  doc.setFillColor(...FUNDO_PAGINA);
  doc.rect(0, 0, pageW, pageH, "F");

  // ── Bloco superior NAVY (ocupa ~45% da página)
  const heroH = pageH * 0.45;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, heroH, "F");

  // Faixa amarela fina logo abaixo do hero
  doc.setFillColor(...AMARELO);
  doc.rect(0, heroH, pageW, 3.2, "F");

  // Selo VEXA no topo direito
  doc.setTextColor(...AMARELO);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("VEXA", pageW - MM.margem, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 203, 220);
  doc.text("CATÁLOGO DIGITAL", pageW - MM.margem, 19, { align: "right" });

  // Linha decorativa esquerda
  doc.setDrawColor(...AMARELO);
  doc.setLineWidth(0.8);
  doc.line(MM.margem, 14, MM.margem + 18, 14);

  // ── Centralizar conteúdo do hero (nome da empresa)
  const centroHero = heroH / 2 + 4;

  doc.setTextColor(...BRANCO);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("APRESENTAMOS NOSSO", pageW / 2, centroHero - 22, { align: "center" });

  // Linha decorativa abaixo do "apresentamos"
  const linhaW = 30;
  doc.setDrawColor(...AMARELO);
  doc.setLineWidth(0.6);
  doc.line(pageW / 2 - linhaW / 2, centroHero - 18, pageW / 2 + linhaW / 2, centroHero - 18);

  // Título grande "CATÁLOGO"
  doc.setTextColor(...AMARELO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.text("CATÁLOGO", pageW / 2, centroHero - 2, { align: "center" });

  // Nome da empresa
  doc.setTextColor(...BRANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const nomeEmp = String(empresaNome || "Loja").slice(0, 48);
  doc.text(nomeEmp, pageW / 2, centroHero + 14, { align: "center" });

  // ── Área inferior: cards de informação
  const infoY = heroH + 25;

  // Card "Produtos"
  const cardW = (pageW - 2 * MM.margem - 8) / 2;
  doc.setFillColor(...BRANCO);
  doc.setDrawColor(...BORDA_CARD);
  doc.setLineWidth(0.3);
  doc.roundedRect(MM.margem, infoY, cardW, 32, 3, 3, "FD");

  doc.setTextColor(...TEXTO_MUDO);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("PRODUTOS NESTE CATÁLOGO", MM.margem + 6, infoY + 9);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text(String(totalProdutos), MM.margem + 6, infoY + 24);

  // Card "Data"
  doc.setFillColor(...BRANCO);
  doc.setDrawColor(...BORDA_CARD);
  doc.roundedRect(MM.margem + cardW + 8, infoY, cardW, 32, 3, 3, "FD");
  doc.setTextColor(...TEXTO_MUDO);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("EMITIDO EM", MM.margem + cardW + 14, infoY + 9);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(dataCatalogoLegivel(), MM.margem + cardW + 14, infoY + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...TEXTO_MUDO);
  doc.text("Preços e disponibilidade sujeitos à loja", MM.margem + cardW + 14, infoY + 27);

  // ── Texto inspiracional
  doc.setTextColor(...TEXTO);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  const frase = "Explore nossa seleção cuidadosamente preparada para você.";
  doc.text(frase, pageW / 2, infoY + 50, { align: "center" });

  // Linha divisora
  doc.setDrawColor(...BORDA_CARD);
  doc.setLineWidth(0.3);
  doc.line(pageW / 2 - 30, infoY + 56, pageW / 2 + 30, infoY + 56);

  doc.setTextColor(...TEXTO_MUDO);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Para fazer um pedido, entre em contato pelo WhatsApp.", pageW / 2, infoY + 62, { align: "center" });

  // ── Rodapé da capa: faixa amarela com texto navy
  const rodapeH = 14;
  doc.setFillColor(...AMARELO);
  doc.rect(0, pageH - rodapeH, pageW, rodapeH, "F");

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(String(empresaNome || "Loja").toUpperCase(), MM.margem, pageH - 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Gerado por VEXA · vexa.app", pageW - MM.margem, pageH - 5, { align: "right" });
}

function desenharRodapePagina(doc, pageIndex, totalPaginas, pageW, pageH) {
  doc.setFillColor(...NAVY);
  doc.rect(0, pageH - MM.footerH, pageW, MM.footerH, "F");

  doc.setTextColor(...BRANCO);
  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.text("Preços e disponibilidade sujeitos à loja.", MM.margem + 1, pageH - 5);

  doc.text(`Página ${pageIndex} · ${totalPaginas}`, pageW / 2, pageH - 5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.text("vexa.app", pageW - MM.margem - 1, pageH - 5, { align: "right" });
}

/**
 * Cartão estilo vitrine: foto grande (cover), nome, categoria, código e preço em destaque.
 */
function desenharCelulaProduto(doc, x, y, colW, item, dataUrlImagem) {
  const pad = 3;
  const imgX = x + pad;
  const imgY = y + pad;
  const imgW = colW - 2 * pad;
  const imgH = MM.imgBoxH;

  const shadowOff = 0.55;
  doc.setFillColor(...CARD_SOMBRA);
  doc.roundedRect(x + shadowOff, y + shadowOff, colW, MM.cellH, MM.cardR, MM.cardR, "F");

  doc.setDrawColor(...BORDA_CARD);
  doc.setFillColor(...BRANCO);
  doc.roundedRect(x, y, colW, MM.cellH, MM.cardR, MM.cardR, "FD");

  doc.setFillColor(...FAIXA_IMG);
  doc.rect(imgX, imgY, imgW, imgH, "F");

  if (dataUrlImagem) {
    try {
      const fmt = formatoAddImage(dataUrlImagem);
      desenharImagemCover(doc, dataUrlImagem, fmt, imgX, imgY, imgW, imgH);
    } catch {
      doc.setFontSize(7.5);
      doc.setTextColor(...TEXTO_MUDO);
      doc.setFont("helvetica", "italic");
      doc.text("Foto indisponível", imgX + imgW / 2, imgY + imgH / 2, { align: "center", baseline: "middle" });
    }
  } else {
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXTO_MUDO);
    doc.setFont("helvetica", "italic");
    doc.text("Sem foto", imgX + imgW / 2, imgY + imgH / 2, { align: "center", baseline: "middle" });
  }

  doc.setDrawColor(...BORDA_CARD);
  doc.setLineWidth(0.15);
  doc.line(imgX, imgY + imgH, imgX + imgW, imgY + imgH);

  let ty = imgY + imgH + 5;
  doc.setTextColor(...TEXTO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const nome = String(item.nome || "—").trim().slice(0, 90);
  const linhasNome = doc.splitTextToSize(nome, colW - 2 * pad - 2);
  doc.text(linhasNome.slice(0, 2), imgX, ty);
  ty += Math.min(linhasNome.length, 2) * 4.2 + 1;

  const tipo = String(item.tipo || "").trim();
  if (tipo) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(...TEXTO_MUDO);
    doc.text(tipo.toUpperCase(), imgX, ty);
    ty += 4;
  }

  const baseY = y + MM.cellH - 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(...TEXTO_MUDO);
  const cod = String(item.sku || item.Sku || "—").slice(0, 28);
  doc.text(`REF  ${cod}`, imgX, baseY);

  const precoTxt = formatarMoeda(item.preco);
  doc.setFont("helvetica", "bold");
  const pw = doc.getTextWidth(precoTxt);
  const pillPadX = 2.4;
  const pillPadY = 1.8;
  const pillW2 = pw + 2 * pillPadX;
  const pillH2 = 7.5;
  const pillX2 = x + colW - pad - pillW2;
  const pillY2 = baseY - pillH2 + 2;
  doc.setFillColor(...AMARELO);
  doc.roundedRect(pillX2, pillY2, pillW2, pillH2, 1.8, 1.8, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.text(precoTxt, pillX2 + pillW2 / 2, pillY2 + pillH2 / 2 + 1.5, { align: "center" });
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
  const contentTop = MM.headerH + 7;
  const contentBottom = pageH - MM.footerH - 5;
  const rowH = MM.cellH + MM.gutter;
  const maxRows = Math.max(1, Math.floor((contentBottom - contentTop) / rowH));
  const perPage = maxRows * 2;

  // ── Página 1: CAPA
  desenharCapa(doc, empresaNome, lista.length, pageW, pageH);

  // ── Página 2 em diante: produtos
  if (lista.length > 0) {
    doc.addPage();
    desenharCabecalho(doc, empresaNome, pageW);
    desenharFundoConteudo(doc, pageW, pageH);
  }

  let y0 = contentTop;

  for (let i = 0; i < lista.length; i++) {
    if (i > 0 && i % perPage === 0) {
      doc.addPage();
      desenharCabecalho(doc, empresaNome, pageW);
      desenharFundoConteudo(doc, pageW, pageH);
      y0 = contentTop;
    }

    const pos = i % perPage;
    const row = Math.floor(pos / 2);
    const col = pos % 2;
    const x = MM.margem + col * (colW + MM.gutter);
    const cardY = y0 + row * rowH;

    desenharCelulaProduto(doc, x, cardY, colW, lista[i], imagensData[i]);
  }

  // ── Rodapé apenas nas páginas de produtos (capa fica sem rodapé numerado)
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 2; p <= totalPaginas; p++) {
    doc.setPage(p);
    desenharRodapePagina(doc, p - 1, totalPaginas - 1, pageW, pageH);
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
