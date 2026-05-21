// src/pages/Produtos.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogContent,
  TextField,
  Grid,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Autocomplete,
  Avatar,
  Stack,
  DialogTitle,
  DialogActions,
  useTheme,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Add,
  Edit,
  Delete,
  Inventory,
  Search,
  Image as ImageIcon,
  Close,
  CloudUpload,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
  Star,
  LocalShipping,
} from "@mui/icons-material";
import { LoadingBox } from "../components/LoadingBox";
import { ProdutoImagemAjuste } from "../components/ProdutoImagemAjuste";
import { produtosService } from "../api/produtosService";
import { FornecedorService } from "../api/fornecedorService";
import { CategoriaService } from "../api/categoriaService";
import { MarcaService } from "../api/marcaService";
import { showSuccess, showError } from "../utils/notifications";
import {
  successMessages,
  errorMessages,
  confirmMessages,
  entityNames,
} from "../utils/entityMessages";
import { validateRequired } from "../utils/validators";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

const TAMANHOS_ROUPA = ["PP", "P", "M", "G", "GG", "XG", "XGG"];
const TAMANHOS_CALCADOS = [
  "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44",
];
const TAMANHOS_ACESSORIOS = ["Único", "P", "M", "G", "GG", "Infantil"];

const CORES = [
  "Preto",
  "Branco",
  "Azul",
  "Vermelho",
  "Verde",
  "Amarelo",
  "Rosa",
  "Roxo",
  "Laranja",
  "Marrom",
  "Cinza",
  "Bege",
  "Nude",
  "Vinho",
  "Azul Marinho",
  "Off-white",
  "Estampado",
  "Multicolor",
];

const GENEROS = ["Feminino", "Masculino", "Unissex", "Infantil"];

const MAX_IMAGEM_PRODUTO_BYTES = 5 * 1024 * 1024;
const JPEG_QUALITY_UPLOAD = 0.92;

function isHttpImageUrl(s) {
  return typeof s === "string" && /^https?:\/\//i.test(s.trim());
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível decodificar a imagem."));
    img.src = src;
  });
}

function canvasFromImg(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function canvasToJpegBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Falha ao gerar JPEG."));
        else resolve(blob);
      },
      "image/jpeg",
      JPEG_QUALITY_UPLOAD,
    );
  });
}

function fileBaseName(file, fallback = "imagem") {
  const raw = (file?.name || fallback).replace(/\.[^.]+$/, "");
  return raw || fallback;
}

/** Garante que o arquivo seja JPEG. Aceita File ou data URL; retorna File JPEG. */
async function ensureJpegFile(input, fallbackName = "imagem") {
  if (input instanceof File && input.type === "image/jpeg") return input;

  let dataUrl;
  let baseName = fallbackName;
  if (typeof input === "string") {
    if (!input.startsWith("data:image/")) return null;
    dataUrl = input;
  } else if (input instanceof Blob) {
    baseName = fileBaseName(input, fallbackName);
    dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
      r.onerror = () => reject(new Error("Falha ao ler arquivo."));
      r.readAsDataURL(input);
    });
  } else {
    return null;
  }
  if (!dataUrl) return null;

  const img = await loadImage(dataUrl);
  const canvas = canvasFromImg(img);
  const blob = await canvasToJpegBlob(canvas);
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

// Extrai nome de string ou objeto { id, nome } retornado pela API
const nomeDe = (v) =>
  v == null ? null : typeof v === "string" ? v : (v.nome ?? v.razaoSocial ?? null);

const MATERIAIS = [
  "Algodão",
  "Poliéster",
  "Viscose",
  "Linho",
  "Seda",
  "Jeans",
  "Couro",
  "Couro Sintético",
  "Malha",
  "Lã",
  "Elastano",
  "Tecido Misto",
];

function Produtos() {
  const theme = useTheme();
  const produtoImagemFileRef = useRef(null);
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const location = useLocation();

  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const produtosPorPagina = 10;
  const [carregando, setCarregando] = useState(false);
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  const [excluindoProduto, setExcluindoProduto] = useState(false);
  /** Arquivo escolhido na galeria — usado para upload na edição e base64 na criação (como clientes/usuários). */
  const [imagemProdutoFile, setImagemProdutoFile] = useState(null);
  const imagemAdicionalFileRefs = useRef([]);

  const [currentProduto, setCurrentProduto] = useState({
    nome: "",
    categoria: "",
    categoriaId: null,
    genero: "",
    marca: "",
    marcaId: null,
    precoCusto: "",
    precoVenda: "",
    precoPromocional: "",
    emPromocao: false,
    cores: [],
    tamanhos: [],
    tipoTamanho: "roupas",
    material: "",
    sku: "",
    codigoBarras: "",
    estoqueTotal: "",
    estoqueMinimo: "",
    imagemPrincipal: "",
    imagensAdicionais: [],
    fornecedor: "",
    fornecedorId: null,
    observacoes: "",
    ativo: true,
  });

  const [listaFornecedores, setListaFornecedores] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);
  const [listaMarcas, setListaMarcas] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [rF, rC, rM] = await Promise.allSettled([
        FornecedorService.getAll(),
        CategoriaService.getAll(),
        MarcaService.getAll(),
      ]);
      const parseF = (r) => {
        if (r.status !== "fulfilled") {
          if (r.reason) console.warn("Erro ao carregar fornecedores:", r.reason?.response?.status ?? r.reason?.message);
          return [];
        }
        const raw = r.value?.fornecedor ?? r.value?.items ?? r.value?.fornecedores ?? r.value;
        return Array.isArray(raw) ? raw : [];
      };
      const parseC = (r) => {
        if (r.status !== "fulfilled") {
          if (r.reason) console.warn("Erro ao carregar categorias:", r.reason?.response?.status ?? r.reason?.message);
          return [];
        }
        const raw = r.value?.categoria ?? r.value?.items ?? r.value?.categorias ?? r.value;
        return Array.isArray(raw) ? raw : [];
      };
      const parseM = (r) => {
        if (r.status !== "fulfilled") {
          if (r.reason) console.warn("Erro ao carregar marcas:", r.reason?.response?.status ?? r.reason?.message);
          return [];
        }
        const raw = r.value?.marca ?? r.value?.items ?? r.value?.marcas ?? r.value;
        return Array.isArray(raw) ? raw : [];
      };
      if (!cancelled) {
        setListaFornecedores(parseF(rF));
        setListaCategorias(parseC(rC));
        setListaMarcas(parseM(rM));
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (location.state?.fromCompras && location.state?.openNewProduct) {
      setOpenDialog(true);
      setEditMode(false);
      setCurrentProduto({
        nome: "",
        categoria: "",
        categoriaId: null,
        genero: "",
        marca: "",
        marcaId: null,
        precoCusto: "",
        precoVenda: "",
        precoPromocional: "",
        emPromocao: false,
        cores: [],
        tamanhos: [],
        tipoTamanho: "roupas",
        material: "",
        sku: "",
        codigoBarras: "",
        estoqueTotal: "",
        estoqueMinimo: "",
        imagemPrincipal: "",
        imagensAdicionais: [],
        fornecedor: "",
        fornecedorId: null,
        observacoes: "",
        ativo: true,
      });
    }
  }, [location.state?.fromCompras, location.state?.openNewProduct]);

  /**
   * Converte o formulário para o payload da API conforme contrato.
   * Obrigatórios: sku, nome, categoriaId, generoId, precoCusto, precoVenda, quantidadeEstoque, estoqueMinimo.
   * Variações: cores e tamanhos como arrays de strings; material string opcional; tipoTamanho contexto da grade.
   * Promoção: precoPromocional (number | null) e emPromocao (boolean) quando há preço promocional > 0.
   * observacoes: string | null (observações internas).
   * Todos numéricos devem ser number (não string).
   */
  const toApiPayload = (p, isCreate) => {
    const num = (v) => {
      if (v === "" || v == null) return null;
      const n = parseFloat(String(v).replace(",", "."));
      return Number.isNaN(n) ? null : n;
    };
    const int = (v) => {
      if (v === "" || v == null) return 0;
      const n = parseInt(String(v), 10);
      return Number.isNaN(n) ? 0 : n;
    };
    const str = (v) => (v != null && String(v).trim() !== "" ? String(v).trim() : null);

    const genIdx = GENEROS.indexOf(p.genero);
    const generoId = genIdx >= 0 ? genIdx + 1 : 1;
    const categoriaId = p.categoriaId != null && p.categoriaId !== "" ? Number(p.categoriaId) : null;
    const marcaId = p.marcaId != null && p.marcaId !== "" ? Number(p.marcaId) : null;

    const payload = {
      sku: str(p.sku) ?? "",
      nome: str(p.nome) ?? "",
      categoriaId: categoriaId ?? 1,
      generoId,
      precoCusto: num(p.precoCusto) ?? 0,
      precoVenda: num(p.precoVenda) ?? 0,
      estoqueMinimo: int(p.estoqueMinimo),
      quantidadeEstoque: int(p.estoqueTotal),
    };
    const optCodigo = str(p.codigoBarras);
    if (optCodigo) payload.codigoBarras = optCodigo;

    // Imagem: alinhado a clientes/usuários — POST com fotoBase64 (arquivo novo); URL http com foto1; PUT com foto1 (URL após upload ou existente).
    if (isCreate) {
      if (p.fotoBase64 != null && String(p.fotoBase64).trim() !== "") {
        payload.fotoBase64 = String(p.fotoBase64).trim();
      } else if (isHttpImageUrl(p.imagemPrincipal)) {
        payload.foto1 = p.imagemPrincipal.trim();
      }
    } else {
      const urlNova =
        p.foto1Url != null && String(p.foto1Url).trim() !== ""
          ? String(p.foto1Url).trim()
          : null;
      if (urlNova) {
        payload.foto1 = urlNova;
      } else if (isHttpImageUrl(p.imagemPrincipal)) {
        payload.foto1 = p.imagemPrincipal.trim();
      }
    }

    if (p.fornecedorId != null && p.fornecedorId !== "") payload.fornecedorId = Number(p.fornecedorId);
    if (marcaId != null) payload.marcaId = marcaId;
    if (!isCreate && p.id != null) payload.id = p.id;

    const coresArr = Array.isArray(p.cores) ? p.cores.filter((c) => c != null && String(c).trim() !== "") : [];
    const tamanhosArr = Array.isArray(p.tamanhos) ? p.tamanhos.filter((t) => t != null && String(t).trim() !== "") : [];
    payload.cores = coresArr;
    payload.tamanhos = tamanhosArr;
    if (p.tipoTamanho && ["roupas", "calcados", "acessorios"].includes(p.tipoTamanho)) {
      payload.tipoTamanho = p.tipoTamanho;
    }
    payload.material = str(p.material);

    const promoNum = num(p.precoPromocional);
    const temPromo = promoNum != null && promoNum > 0;
    payload.emPromocao = temPromo;
    payload.precoPromocional = temPromo ? promoNum : null;

    payload.observacoes = str(p.observacoes);

    const extrasArr = Array.isArray(p.imagensAdicionais) ? p.imagensAdicionais : [];
    extrasArr.forEach((img, idx) => {
      if (idx > 1) return;
      if (img == null || String(img).trim() === "") return;
      const s = String(img).trim();
      if (s.includes("base64,")) {
        const b64 = s.split(",")[1];
        if (b64) {
          if (idx === 0) payload.foto2Base64 = b64;
          if (idx === 1) payload.foto3Base64 = b64;
        }
      } else if (isHttpImageUrl(s)) {
        if (idx === 0) payload.foto2 = s;
        if (idx === 1) payload.foto3 = s;
      }
    });

    return payload;
  };

  // Cálculos de paginação
  const totalPaginas = Math.ceil(produtosFiltrados.length / produtosPorPagina);
  const indiceInicial = (paginaAtual - 1) * produtosPorPagina;
  const indiceFinal = indiceInicial + produtosPorPagina;
  const produtosPaginados = produtosFiltrados.slice(indiceInicial, indiceFinal);

  // Funções de navegação de página
  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  const fetchProdutos = async () => {
    setCarregando(true);
    try {
      const data = await produtosService.getAll();
      console.log("Dados recebidos:", data);
      const produtosArray = Array.isArray(data) ? data : [];
      console.log("Produtos array:", produtosArray);
      setProdutos(produtosArray);
      setProdutosFiltrados(produtosArray);
      setPaginaAtual(1); // Volta para a primeira página
    } catch (error) {
      const data = error.response?.data;
      const msg =
        (data && typeof data === "object" && (data.mensagem ?? data.message ?? data.detail ?? data.title)) ??
        (typeof data === "string" ? data : null) ??
        error.message ??
        "Erro ao buscar produtos. Verifique se a API está acessível, se você está logado e, como usuário dev, se selecionou a empresa corretamente.";
      console.error("Erro ao buscar produtos:", error.response?.data ?? error);
      showError(msg);
      setProdutos([]);
      setProdutosFiltrados([]);
    } finally {
      setCarregando(false);
    }
  };

  const handleSearch = (e) => {
    const termo = e.target.value.toLowerCase();
    setSearchTerm(termo);

    if (termo === "") {
      setProdutosFiltrados(produtos);
    } else {
      const filtrados = produtos.filter(
        (produto) =>
          produto.nome?.toLowerCase().includes(termo) ||
          nomeDe(produto.categoria)?.toLowerCase().includes(termo) ||
          produto.sku?.toLowerCase().includes(termo) ||
          nomeDe(produto.marca)?.toLowerCase().includes(termo),
      );
      setProdutosFiltrados(filtrados);
    }
    setPaginaAtual(1); // Volta para a primeira página ao buscar
  };

  const handleOpenDialog = (produto = null) => {
    if (produto) {
      const p = { ...produto };
      delete p.descricao;
      delete p.descricaoCurta;
      delete p.peso;
      delete p.largura;
      delete p.altura;
      delete p.comprimento;
      const qtdApi =
        p.quantidadeEstoque ??
        p.QuantidadeEstoque ??
        p.estoqueTotal ??
        p.estoque ??
        "";
      p.estoqueTotal =
        qtdApi === "" || qtdApi == null ? "" : String(qtdApi);
      if (p.fornecedorId == null && p.fornecedor && listaFornecedores.length > 0) {
        const found = listaFornecedores.find(
          (f) =>
            (f.nome || "").trim() === (nomeDe(p.fornecedor) || "").trim() ||
            (f.razaoSocial || "").trim() === (nomeDe(p.fornecedor) || "").trim(),
        );
        if (found) p.fornecedorId = found.id;
      }
      if (p.categoriaId == null && p.categoria && listaCategorias.length > 0) {
        const found = listaCategorias.find((c) => (c.nome || "").trim() === (nomeDe(p.categoria) || "").trim());
        if (found) p.categoriaId = found.id;
      }
      if (p.marcaId == null && p.marca && listaMarcas.length > 0) {
        const found = listaMarcas.find((m) => (m.nome || "").trim() === (nomeDe(p.marca) || "").trim());
        if (found) p.marcaId = found.id;
      }
      p.cores = Array.isArray(p.cores) ? p.cores : [];
      p.tamanhos = Array.isArray(p.tamanhos) ? p.tamanhos : [];
      p.tipoTamanho = p.tipoTamanho || inferirTipoTamanho(p.tamanhos);
      p.imagemPrincipal =
        p.foto1 ||
        p.Foto1 ||
        p.imagemPrincipal ||
        p.ImagemPrincipal ||
        p.urlImagem ||
        p.UrlImagem ||
        p.imagemUrl ||
        p.ImagemUrl ||
        "";
      const f2 = p.foto2 ?? p.Foto2 ?? "";
      const f3 = p.foto3 ?? p.Foto3 ?? "";
      p.imagensAdicionais = [f2, f3].map((u) => (u != null && String(u).trim() !== "" ? String(u).trim() : ""));
      setImagemProdutoFile(null);
      setCurrentProduto(p);
      setEditMode(true);
    } else {
      setCurrentProduto({
        nome: "",
        categoria: "",
        categoriaId: null,
        genero: "",
        marca: "",
        marcaId: null,
        precoCusto: "",
        precoVenda: "",
        precoPromocional: "",
        emPromocao: false,
        cores: [],
        tamanhos: [],
        tipoTamanho: "roupas",
        material: "",
        sku: "",
        codigoBarras: "",
        estoqueTotal: "",
        estoqueMinimo: "",
        imagemPrincipal: "",
        imagensAdicionais: [],
        fornecedor: "",
        fornecedorId: null,
        observacoes: "",
        ativo: true,
      });
      setEditMode(false);
      setImagemProdutoFile(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setImagemProdutoFile(null);
  };

  const handleSave = async () => {
    if (salvandoProduto) return;

    // Validações (API exige: sku, nome, categoriaId, generoId, precoCusto, precoVenda, quantidadeEstoque, estoqueMinimo)
    const skuValidation = validateRequired(currentProduto.sku, "SKU");
    if (!skuValidation.valid) {
      showError(skuValidation.message);
      return;
    }

    const nomeValidation = validateRequired(
      currentProduto.nome,
      "Nome do Produto",
    );
    if (!nomeValidation.valid) {
      showError(nomeValidation.message);
      return;
    }

    if (!currentProduto.categoriaId) {
      showError("Selecione uma categoria. Cadastre em Cadastros > Categorias se necessário.");
      return;
    }

    const coresSel = Array.isArray(currentProduto.cores) ? currentProduto.cores : [];
    const tamanhosSel = Array.isArray(currentProduto.tamanhos) ? currentProduto.tamanhos : [];

    if (coresSel.length === 0) {
      showError("Selecione pelo menos uma cor");
      return;
    }

    if (tamanhosSel.length === 0) {
      showError("Selecione pelo menos um tamanho");
      return;
    }

    const precoCustoNum = parseFloat(String(currentProduto.precoCusto ?? "").replace(",", "."));
    if (
      currentProduto.precoCusto === "" ||
      currentProduto.precoCusto == null ||
      Number.isNaN(precoCustoNum) ||
      precoCustoNum <= 0
    ) {
      showError("Preço de custo deve ser maior que zero");
      return;
    }

    if (
      !currentProduto.precoVenda ||
      parseFloat(String(currentProduto.precoVenda).replace(",", ".")) <= 0
    ) {
      showError("Preço de venda deve ser maior que zero");
      return;
    }

    if (!editMode) {
      const rawEst = currentProduto.estoqueTotal;
      if (rawEst !== "" && rawEst != null) {
        const q = parseInt(String(rawEst), 10);
        if (Number.isNaN(q) || q < 0) {
          showError("Quantidade em estoque deve ser um número inteiro maior ou igual a zero.");
          return;
        }
      }
    }

    if (currentProduto.estoqueMinimo !== "" && currentProduto.estoqueMinimo != null) {
      const estMin = parseInt(String(currentProduto.estoqueMinimo), 10);
      if (Number.isNaN(estMin) || estMin < 0) {
        showError("Estoque mínimo deve ser um número inteiro maior ou igual a zero.");
        return;
      }
    }

    if (editMode && (currentProduto.id == null || currentProduto.id === "")) {
      showError("Produto sem identificador. Feche o cadastro e abra novamente para editar.");
      return;
    }

    setSalvandoProduto(true);
    try {
      let fotoBase64 = null;
      let foto1Url = undefined;
      let imagemUrlAposUpload = null;

      // Em edição, se a imagem ainda é uma data URL (vinda do backend antigo
      // ou colada no campo URL), converte para File JPEG e sobe via upload-foto.
      let arquivoParaUpload = imagemProdutoFile;
      if (
        !arquivoParaUpload &&
        editMode &&
        typeof currentProduto.imagemPrincipal === "string" &&
        currentProduto.imagemPrincipal.startsWith("data:image/")
      ) {
        try {
          arquivoParaUpload = await ensureJpegFile(
            currentProduto.imagemPrincipal,
            `produto-${currentProduto.id ?? "novo"}`,
          );
        } catch (convErr) {
          console.warn("[Produtos] Falha ao converter data URL existente para JPEG", convErr);
        }
      }

      if (arquivoParaUpload) {
        // Garantia extra de JPEG (caso o arquivo venha de outro fluxo)
        try {
          const jpeg = await ensureJpegFile(arquivoParaUpload, fileBaseName(arquivoParaUpload, "produto"));
          if (jpeg) arquivoParaUpload = jpeg;
        } catch {
          /* mantém o arquivo original se conversão falhar */
        }

        try {
          const uploadResult = await produtosService.uploadFoto(arquivoParaUpload);
          const novaUrl =
            uploadResult?.url ??
            uploadResult?.fotoUrl ??
            uploadResult?.path ??
            uploadResult?.location ??
            (typeof uploadResult === "string" ? uploadResult : null);
          if (novaUrl) {
            imagemUrlAposUpload = novaUrl;
            if (editMode) foto1Url = novaUrl;
          } else if (editMode) {
            console.warn(
              "[Produtos] POST /produtos/upload-foto: resposta sem URL conhecida",
              uploadResult,
            );
            showError(
              "A imagem foi enviada, mas a API não retornou a URL no formato esperado (url, fotoUrl ou path). Verifique o backend.",
            );
            return;
          }
        } catch (uploadErr) {
          if (editMode) {
            console.error("[Produtos] Falha no upload da foto", uploadErr);
            showError("Não foi possível enviar a imagem. Tente novamente.");
            return;
          }
          console.warn("[Produtos] Upload na criação indisponível; usando base64 no JSON.", uploadErr);
        }
      }

      if (arquivoParaUpload && !imagemUrlAposUpload) {
        fotoBase64 = currentProduto.imagemPrincipal?.includes(",")
          ? currentProduto.imagemPrincipal.split(",")[1]
          : null;
      }

      // Se a imagem atual ainda é data URL e não conseguimos subir, evita enviar
      // o blob gigante de volta no payload — substitui por "" para não estourar 400.
      const imagemPrincipalAtual =
        typeof currentProduto.imagemPrincipal === "string" &&
        currentProduto.imagemPrincipal.startsWith("data:image/")
          ? ""
          : currentProduto.imagemPrincipal;

      const imagemPrincipalPayload = imagemUrlAposUpload || imagemPrincipalAtual;

      const produtoParaSalvar = toApiPayload(
        {
          ...currentProduto,
          imagemPrincipal: imagemPrincipalPayload,
          fotoBase64: editMode ? null : imagemUrlAposUpload ? null : fotoBase64,
          foto1Url: editMode ? foto1Url : undefined,
        },
        !editMode,
      );

      if (editMode) {
        await produtosService.update(currentProduto.id, produtoParaSalvar);
        showSuccess(successMessages.update(entityNames.produto));
      } else {
        await produtosService.create(produtoParaSalvar);
        showSuccess(successMessages.create(entityNames.produto));
        if (location.state?.fromCompras) {
          navigate("/compras", { state: { returnFromProdutos: true } });
          return;
        }
      }
      fetchProdutos();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      console.error("Resposta da API (400):", error.response?.data);

      if (error.response) {
        const errorData = error.response.data;
        const msg =
          (typeof errorData === "string" && errorData.trim() ? errorData : null) ||
          errorData?.message ||
          errorData?.mensagem ||
          errorData?.detail ||
          (errorData?.errors && typeof errorData.errors === "object"
            ? (Object.values(errorData.errors).flat().find(Boolean) || errorMessages.create(entityNames.produto))
            : null) ||
          (Array.isArray(errorData?.errors) && errorData.errors[0]) ||
          errorMessages.create(entityNames.produto);
        showError(msg);
      } else {
        showError(
          editMode
            ? errorMessages.update(entityNames.produto)
            : errorMessages.create(entityNames.produto),
        );
      }
    } finally {
      setSalvandoProduto(false);
    }
  };

  const handleAbrirConfirmExcluir = (produto) => {
    setProdutoParaExcluir({ id: produto.id, nome: produto.nome || "" });
  };

  const handleFecharConfirmExcluir = () => {
    if (excluindoProduto) return;
    setProdutoParaExcluir(null);
  };

  const handleConfirmarExcluir = async () => {
    if (!produtoParaExcluir?.id) return;
    setExcluindoProduto(true);
    try {
      await produtosService.delete(produtoParaExcluir.id);
      showSuccess(successMessages.delete(entityNames.produto));
      setProdutoParaExcluir(null);
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      showError(errorMessages.delete(entityNames.produto));
    } finally {
      setExcluindoProduto(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "imagemPrincipal") {
      setImagemProdutoFile(null);
    }
    setCurrentProduto((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDigitsOnlyChange = (e) => {
    const { name, value } = e.target;
    const digits = String(value).replace(/\D/g, "");
    setCurrentProduto((prev) => ({
      ...prev,
      [name]: digits,
    }));
  };

  const abrirSeletorImagemProduto = () => {
    produtoImagemFileRef.current?.click();
  };

  const handleProdutoImagemFileChange = async (e) => {
    const original = e.target.files?.[0];
    e.target.value = "";
    if (!original) return;
    if (!original.type.startsWith("image/")) {
      showError("Selecione um arquivo de imagem.");
      return;
    }
    if (original.size > MAX_IMAGEM_PRODUTO_BYTES) {
      showError("Imagem deve ter no máximo 5 MB.");
      return;
    }
    try {
      const jpeg = await ensureJpegFile(original, fileBaseName(original, "produto"));
      if (!jpeg) {
        showError("Não foi possível processar a imagem. Use JPG/PNG.");
        return;
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
        r.onerror = () => reject(new Error("Falha ao ler imagem."));
        r.readAsDataURL(jpeg);
      });
      if (!dataUrl) return;
      setImagemProdutoFile(jpeg);
      setCurrentProduto((prev) => ({ ...prev, imagemPrincipal: dataUrl }));
    } catch (err) {
      console.error("[Produtos] Falha ao converter imagem para JPEG", err);
      showError("Não foi possível processar a imagem. Tente outra.");
    }
  };

  const handleProdutoImagemAjustado = ({ dataUrl, file }) => {
    setImagemProdutoFile(file);
    setCurrentProduto((prev) => ({ ...prev, imagemPrincipal: dataUrl }));
    showSuccess("Recorte aplicado. Salve o produto para enviar a imagem ajustada.");
  };

  const abrirSeletorImagemAdicional = (index) => {
    imagemAdicionalFileRefs.current[index]?.click();
  };

  const handleImagemAdicionalFileChange = (index) => async (e) => {
    const original = e.target.files?.[0];
    e.target.value = "";
    if (!original) return;
    if (!original.type.startsWith("image/")) {
      showError("Selecione um arquivo de imagem.");
      return;
    }
    if (original.size > MAX_IMAGEM_PRODUTO_BYTES) {
      showError("Imagem deve ter no máximo 5 MB.");
      return;
    }
    try {
      const jpeg = await ensureJpegFile(original, fileBaseName(original, `produto-extra-${index + 1}`));
      if (!jpeg) {
        showError("Não foi possível processar a imagem. Use JPG/PNG.");
        return;
      }
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(typeof r.result === "string" ? r.result : null);
        r.onerror = () => reject(new Error("Falha ao ler imagem."));
        r.readAsDataURL(jpeg);
      });
      if (!dataUrl) return;
      setCurrentProduto((prev) => {
        const arr = Array.isArray(prev.imagensAdicionais) ? [...prev.imagensAdicionais] : [];
        while (arr.length < 2) arr.push("");
        arr[index] = dataUrl;
        return { ...prev, imagensAdicionais: arr };
      });
    } catch (err) {
      console.error("[Produtos] Falha ao converter imagem adicional para JPEG", err);
      showError("Não foi possível processar a imagem. Tente outra.");
    }
  };

  const limparImagemAdicional = (index) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentProduto((prev) => {
      const arr = Array.isArray(prev.imagensAdicionais) ? [...prev.imagensAdicionais] : [];
      while (arr.length < 2) arr.push("");
      arr[index] = "";
      return { ...prev, imagensAdicionais: arr };
    });
  };

  const handleMultipleChange = (name, value) => {
    setCurrentProduto((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calcularMargemLucro = () => {
    if (currentProduto.precoCusto && currentProduto.precoVenda) {
      const custo = parseFloat(currentProduto.precoCusto);
      const venda = parseFloat(currentProduto.precoVenda);
      const margem = ((venda - custo) / venda) * 100;
      return margem.toFixed(2);
    }
    return "0.00";
  };

  const getTamanhosDisponiveis = () => {
    const tipo = currentProduto.tipoTamanho || "roupas";
    if (tipo === "calcados") return TAMANHOS_CALCADOS;
    if (tipo === "acessorios") return TAMANHOS_ACESSORIOS;
    return TAMANHOS_ROUPA;
  };

  const inferirTipoTamanho = (tamanhos) => {
    if (!tamanhos || tamanhos.length === 0) return "roupas";
    const todosCalçados = tamanhos.every((t) => TAMANHOS_CALCADOS.includes(t));
    if (todosCalçados) return "calcados";
    const todosAcessorios = tamanhos.every((t) => TAMANHOS_ACESSORIOS.includes(t));
    if (todosAcessorios) return "acessorios";
    return "roupas";
  };

  const handleTipoTamanhoChange = (_, novoValor) => {
    if (!novoValor) return;
    setCurrentProduto((prev) => ({
      ...prev,
      tipoTamanho: novoValor,
      tamanhos: [],
    }));
  };

  const toggleTamanhoChip = (tam) => {
    setCurrentProduto((prev) => {
      const arr = Array.isArray(prev.tamanhos) ? prev.tamanhos : [];
      const next = arr.includes(tam) ? arr.filter((t) => t !== tam) : [...arr, tam];
      return { ...prev, tamanhos: next };
    });
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const modalSurface = isDark ? alpha("#ffffff", 0.06) : alpha(theme.palette.common.black, 0.05);
  const modalFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      bgcolor: modalSurface,
      "& fieldset": {
        borderColor: isDark ? alpha("#fff", 0.14) : theme.palette.divider,
      },
      "&:hover fieldset": { borderColor: alpha(theme.palette.primary.main, 0.45) },
      "&.Mui-focused fieldset": { borderWidth: "1px" },
    },
    "& .MuiInputLabel-root": { color: "text.secondary" },
    "& .MuiInputBase-input": { color: "text.primary" },
  };

  const modalLabel = (text) => (
    <Typography
      component="span"
      sx={{
        display: "block",
        mb: 1,
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: isDark ? alpha("#fff", 0.78) : "text.secondary",
        textTransform: "uppercase",
        fontSize: { xs: "0.78rem", sm: "0.82rem" },
        lineHeight: 1.35,
      }}
    >
      {text}
    </Typography>
  );

  /** Campos tipo select/autocomplete: texto interno legível e largura total */
  const modalAutocompleteInputSx = {
    ...modalFieldSx,
    width: "100%",
    minWidth: 0,
    "& .MuiOutlinedInput-root": {
      ...modalFieldSx["& .MuiOutlinedInput-root"],
      minHeight: 48,
      alignItems: "center",
    },
    "& .MuiAutocomplete-input": {
      fontSize: "0.9375rem !important",
      minWidth: "8em",
    },
  };

  const precoPromocionalAtivo = (() => {
    const pv = parseFloat(String(currentProduto.precoPromocional ?? "").replace(",", "."));
    return pv > 0 && !Number.isNaN(pv);
  })();

  const tipoTamanhoTabsSx = {
    display: "flex",
    width: "100%",
    gap: 0.5,
    p: 0.5,
    borderRadius: "10px",
    bgcolor: modalSurface,
    border: "1px solid",
    borderColor: isDark ? alpha("#fff", 0.12) : "divider",
    "& .MuiToggleButtonGroup-grouped": { border: "none", mx: 0 },
    "& .MuiToggleButton-root": {
      flex: 1,
      textTransform: "uppercase",
      fontWeight: 700,
      fontSize: "0.68rem",
      letterSpacing: "0.05em",
      py: 1,
      px: 0.5,
      color: "text.secondary",
      border: "none",
      borderRadius: "8px !important",
      "&.Mui-selected": {
        bgcolor: "background.paper",
        color: "text.primary",
        boxShadow: isDark ? `0 0 0 1px ${alpha("#fff", 0.2)}` : theme.shadows[2],
        "&:hover": { bgcolor: "background.paper" },
      },
    },
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
            Produtos
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              px: 3,
              py: 1,
              boxShadow: "none",
            }}
          >
            Novo Produto
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Buscar por nome, categoria, marca ou SKU..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: "background.paper",
            borderRadius: "10px",
            "& .MuiOutlinedInput-root": {
              bgcolor: "background.paper",
              color: "text.primary",
              "& fieldset": { borderColor: "divider" },
              "&:hover fieldset": { borderColor: "divider" },
              "&.Mui-focused fieldset": { borderWidth: "1px", borderColor: "primary.main" },
              "& input": { color: "text.primary" },
              "& input::placeholder": { color: "text.secondary", opacity: 1 },
            },
          }}
        />

        <Typography
          variant="body2"
          sx={{ mt: 2, color: "text.secondary", fontSize: "14px" }}
        >
          {produtosFiltrados.length}{" "}
          {produtosFiltrados.length === 1 ? "produto" : "produtos"}
        </Typography>
      </Box>

      {/* Tabela */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  fontSize: "13px",
                  py: 2,
                }}
              >
                PRODUTO
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                CATEGORIA
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                VARIAÇÕES
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                PREÇO
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                ESTOQUE
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                AÇÕES
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carregando ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <LoadingBox size={40} py={8} />
                </TableCell>
              </TableRow>
            ) : Array.isArray(produtosPaginados) &&
            produtosPaginados.length > 0 ? (
              produtosPaginados.map((produto, index) => (
                <TableRow
                  key={produto.id}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom:
                      index === produtosPaginados.length - 1
                        ? "none"
                        : "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Avatar
                        src={
                          produto.foto1 ||
                          produto.Foto1 ||
                          produto.imagemPrincipal ||
                          produto.ImagemPrincipal ||
                          produto.urlImagem ||
                          produto.imagemUrl ||
                          undefined
                        }
                        sx={{
                          bgcolor: (t) =>
                            alpha(t.palette.primary.main, isDark ? 0.2 : 0.12),
                          width: 48,
                          height: 48,
                          border: "2px solid",
                        borderColor: "divider",
                        }}
                      >
                        <Inventory sx={{ color: "primary.contrastText", fontSize: 24 }} />
                      </Avatar>
                      <Box>
                        <Tooltip title={produto.nome || ""} placement="top-start" enterDelay={400}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: "text.primary",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: { xs: 160, sm: 220, md: 280 },
                            }}
                          >
                            {produto.nome}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: { xs: 200, sm: 260 } }}>
                          {nomeDe(produto.marca) || "—"} • SKU: {produto.sku || "—"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={nomeDe(produto.categoria) || "Sem categoria"}
                      size="small"
                      sx={{
                        bgcolor: (t) =>
                          alpha(t.palette.primary.main, isDark ? 0.2 : 0.12),
                        color: "primary.contrastText",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {produto.cores?.slice(0, 3).map((cor, i) => (
                        <Chip
                          key={i}
                          label={cor}
                          size="small"
                          sx={{
                            bgcolor: "action.hover",
                            fontSize: "11px",
                            height: "20px",
                          }}
                        />
                      ))}
                      {produto.cores?.length > 3 && (
                        <Chip
                          label={`+${produto.cores.length - 3}`}
                          size="small"
                          sx={{
                            bgcolor: "action.hover",
                            fontSize: "11px",
                            height: "20px",
                          }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "text.primary", fontWeight: 500, fontSize: "14px" }}
                  >
                    {produto.emPromocao && produto.precoPromocional ? (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            textDecoration: "line-through",
                            color: "text.secondary",
                            display: "block",
                          }}
                        >
                          R$ {parseFloat(produto.precoVenda || 0).toFixed(2)}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "error.main", fontWeight: 600 }}
                        >
                          R${" "}
                          {parseFloat(produto.precoPromocional || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    ) : (
                      `R$ ${parseFloat(produto.precoVenda || 0).toFixed(2)}`
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={
                        produto.estoqueTotal ??
                        produto.quantidadeEstoque ??
                        produto.QuantidadeEstoque ??
                        0
                      }
                      size="small"
                      sx={{
                        bgcolor:
                          (produto.estoqueTotal ??
                            produto.quantidadeEstoque ??
                            produto.QuantidadeEstoque ??
                            0) >
                          (produto.estoqueMinimo || 10)
                            ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7")
                            : (produto.estoqueTotal ??
                                  produto.quantidadeEstoque ??
                                  produto.QuantidadeEstoque ??
                                  0) > 0
                              ? (isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7")
                              : (isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2"),
                        color:
                          (produto.estoqueTotal ??
                            produto.quantidadeEstoque ??
                            produto.QuantidadeEstoque ??
                            0) >
                          (produto.estoqueMinimo || 10)
                            ? (isDark ? "#34D399" : "#16a34a")
                            : (produto.estoqueTotal ??
                                  produto.quantidadeEstoque ??
                                  produto.QuantidadeEstoque ??
                                  0) > 0
                              ? (isDark ? "#FBBF24" : "#d97706")
                              : (isDark ? "#F87171" : "#dc2626"),
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(produto)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleAbrirConfirmExcluir(produto)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { bgcolor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2", color: "error.main" },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 8, color: "text.secondary" }}
                >
                  <Inventory sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1">
                    Nenhum produto encontrado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Clique em "Novo Produto" para cadastrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Controles de Paginação */}
        {produtosFiltrados.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              py: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontSize: "14px" }}
            >
              Mostrando {indiceInicial + 1} a{" "}
              {Math.min(indiceFinal, produtosFiltrados.length)} de{" "}
              {produtosFiltrados.length}{" "}
              {produtosFiltrados.length === 1 ? "produto" : "produtos"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                onClick={irParaPrimeiraPagina}
                disabled={paginaAtual === 1}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <FirstPage fontSize="small" />
              </IconButton>

              <IconButton
                onClick={irParaPaginaAnterior}
                disabled={paginaAtual === 1}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>

              <Box sx={{ display: "flex", gap: 0.5, mx: 1 }}>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (numeroPagina) => {
                    if (
                      numeroPagina === 1 ||
                      numeroPagina === totalPaginas ||
                      (numeroPagina >= paginaAtual - 1 &&
                        numeroPagina <= paginaAtual + 1)
                    ) {
                      return (
                        <Button
                          key={numeroPagina}
                          onClick={() => setPaginaAtual(numeroPagina)}
                          size="small"
                          sx={{
                            minWidth: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            color:
                              paginaAtual === numeroPagina ? "primary.contrastText" : "text.secondary",
                            bgcolor:
                              paginaAtual === numeroPagina
                                ? "primary.main"
                                : "transparent",
                            "&:hover": {
                              bgcolor:
                                paginaAtual === numeroPagina
                                  ? "primary.dark"
                                  : "action.hover",
                            },
                          }}
                        >
                          {numeroPagina}
                        </Button>
                      );
                    } else if (
                      numeroPagina === paginaAtual - 2 ||
                      numeroPagina === paginaAtual + 2
                    ) {
                      return (
                        <Typography
                          key={numeroPagina}
                          sx={{ px: 1, color: "text.secondary" }}
                        >
                          ...
                        </Typography>
                      );
                    }
                    return null;
                  },
                )}
              </Box>

              <IconButton
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>

              <IconButton
                onClick={irParaUltimaPagina}
                disabled={paginaAtual === totalPaginas}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <LastPage fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </TableContainer>

      {/* Cadastro de produto — modal em duas colunas (layout vitrine) */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        scroll="body"
        slotProps={{
          backdrop: { sx: { backdropFilter: "blur(4px)" } },
        }}
        PaperProps={{
          elevation: 12,
          sx: {
            borderRadius: "16px",
            maxHeight: "min(92vh, 900px)",
            bgcolor: "background.paper",
            backgroundImage: isDark
              ? `linear-gradient(180deg, ${alpha("#fff", 0.03)} 0%, transparent 40%)`
              : undefined,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 2.5,
            px: { xs: 2, sm: 3 },
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: 800,
              fontSize: "1.05rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "text.primary",
            }}
          >
            {editMode ? "EDITAR PRODUTO" : "NOVO PRODUTO"}
          </Typography>
          <IconButton
            type="button"
            aria-label="Fechar"
            onClick={handleCloseDialog}
            size="small"
            sx={{
              color: "text.secondary",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "10px",
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              overflowY: "auto",
              maxHeight: { xs: "70vh", sm: "calc(min(92vh, 900px) - 160px)" },
            }}
          >
            <Grid container spacing={0}>
              {/* Coluna imagens */}
              <Grid
                size={{ xs: 12, md: 5 }}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRight: { md: "1px solid" },
                  borderColor: "divider",
                  bgcolor: isDark ? alpha("#fff", 0.02) : alpha(theme.palette.common.black, 0.02),
                }}
              >
                <Stack spacing={2}>
                  {modalLabel("Imagem principal")}
                  <Box
                    sx={{
                      border: "2px dashed",
                      borderColor: isDark ? alpha("#fff", 0.22) : "divider",
                      borderRadius: "14px",
                      minHeight: 260,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 2,
                      bgcolor: modalSurface,
                    }}
                  >
                    {currentProduto.imagemPrincipal ? (
                      <Box sx={{ width: "100%", maxWidth: 320, mx: "auto" }}>
                        <ProdutoImagemAjuste
                          src={currentProduto.imagemPrincipal}
                          onAdjusted={handleProdutoImagemAjustado}
                          onError={showError}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: "center", py: 3, px: 1 }}>
                        <ImageIcon sx={{ fontSize: 56, mb: 1, color: "text.secondary", opacity: 0.9 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "0.72rem" }}>
                          Upload imagem
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
                          Cole a URL abaixo ou envie um arquivo
                        </Typography>
                        <Button
                          type="button"
                          variant="outlined"
                          startIcon={<CloudUpload />}
                          onClick={abrirSeletorImagemProduto}
                          sx={{
                            mt: 2,
                            textTransform: "none",
                            borderRadius: "10px",
                            borderColor: "divider",
                          }}
                        >
                          Escolher arquivo
                        </Button>
                      </Box>
                    )}
                  </Box>
                  <input
                    ref={produtoImagemFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleProdutoImagemFileChange}
                  />
                  <Box>
                    {modalLabel("URL da imagem (opcional)")}
                    <TextField
                      fullWidth
                      name="imagemPrincipal"
                      value={currentProduto.imagemPrincipal}
                      onChange={handleChange}
                      placeholder="https://…"
                      size="small"
                      sx={modalFieldSx}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ImageIcon sx={{ color: "text.secondary", fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  {modalLabel("Imagens adicionais")}
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    {[0, 1].map((i) => {
                      const extras = Array.isArray(currentProduto.imagensAdicionais)
                        ? currentProduto.imagensAdicionais
                        : [];
                      const src =
                        extras[i] != null && String(extras[i]).trim() !== ""
                          ? String(extras[i])
                          : null;
                      return (
                        <Box
                          key={i}
                          sx={{
                            flex: 1,
                            maxWidth: 120,
                            position: "relative",
                          }}
                        >
                          <input
                            ref={(el) => {
                              imagemAdicionalFileRefs.current[i] = el;
                            }}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleImagemAdicionalFileChange(i)}
                          />
                          <Box
                            component="button"
                            type="button"
                            onClick={() => abrirSeletorImagemAdicional(i)}
                            sx={{
                              width: "100%",
                              aspectRatio: "1",
                              border: "2px dashed",
                              borderColor: isDark ? alpha("#fff", 0.18) : "divider",
                              borderRadius: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "text.secondary",
                              bgcolor: modalSurface,
                              cursor: "pointer",
                              overflow: "hidden",
                              p: 0,
                              "&:hover": {
                                borderColor: alpha(theme.palette.primary.main, 0.45),
                              },
                            }}
                          >
                            {src ? (
                              <Box
                                component="img"
                                alt=""
                                src={src}
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  display: "block",
                                }}
                              />
                            ) : (
                              <Add sx={{ fontSize: 28, opacity: 0.7 }} pointerEvents="none" />
                            )}
                          </Box>
                          {src ? (
                            <IconButton
                              type="button"
                              size="small"
                              onClick={limparImagemAdicional(i)}
                              sx={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                bgcolor: alpha("#000", 0.5),
                                color: "common.white",
                                "&:hover": { bgcolor: alpha("#000", 0.7) },
                                width: 28,
                                height: 28,
                              }}
                              aria-label="Remover imagem adicional"
                            >
                              <Close sx={{ fontSize: 18 }} />
                            </IconButton>
                          ) : null}
                        </Box>
                      );
                    })}
                  </Box>
                </Stack>
              </Grid>

              {/* Coluna formulário */}
              <Grid size={{ xs: 12, md: 7 }} sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={2.25}>
                  <Box>
                    {modalLabel("Nome do produto")}
                    <TextField
                      fullWidth
                      required
                      name="nome"
                      value={currentProduto.nome}
                      onChange={handleChange}
                      placeholder="Ex: Camiseta oversized"
                      size="small"
                      sx={modalFieldSx}
                      hiddenLabel
                      variant="outlined"
                    />
                  </Box>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {modalLabel("Preço de custo R$")}
                      <TextField
                        fullWidth
                        required
                        name="precoCusto"
                        type="number"
                        value={currentProduto.precoCusto}
                        onChange={handleChange}
                        placeholder="0,00"
                        size="small"
                        sx={modalFieldSx}
                        hiddenLabel
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography component="span" variant="body2" color="text.secondary">
                                R$
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{ step: "0.01", min: "0" }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {modalLabel("Preço de venda R$")}
                      <TextField
                        fullWidth
                        required
                        name="precoVenda"
                        type="number"
                        value={currentProduto.precoVenda}
                        onChange={handleChange}
                        placeholder="0,00"
                        size="small"
                        sx={modalFieldSx}
                        hiddenLabel
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography component="span" variant="body2" color="text.secondary">
                                R$
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{ step: "0.01", min: "0" }}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {modalLabel("Categoria")}
                      <Autocomplete
                        fullWidth
                        size="small"
                        options={listaCategorias}
                        value={listaCategorias.find((c) => c.id === currentProduto.categoriaId) || null}
                        getOptionLabel={(c) => c.nome || ""}
                        onChange={(_, newValue) => {
                          setCurrentProduto((prev) => ({
                            ...prev,
                            categoriaId: newValue?.id ?? null,
                            categoria: newValue?.nome ?? "",
                          }));
                        }}
                        noOptionsText="Nenhuma categoria cadastrada. Cadastre em Cadastros > Categorias."
                        slotProps={{
                          paper: { sx: { borderRadius: "10px" } },
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            required
                            placeholder="Selecione a categoria"
                            sx={modalAutocompleteInputSx}
                            hiddenLabel
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {modalLabel("Marca")}
                      <Autocomplete
                        fullWidth
                        size="small"
                        options={listaMarcas}
                        value={listaMarcas.find((m) => m.id === currentProduto.marcaId) || null}
                        getOptionLabel={(m) => m.nome || ""}
                        onChange={(_, newValue) => {
                          setCurrentProduto((prev) => ({
                            ...prev,
                            marcaId: newValue?.id ?? null,
                            marca: newValue?.nome ?? "",
                          }));
                        }}
                        noOptionsText="Nenhuma marca cadastrada. Cadastre em Cadastros > Marcas."
                        slotProps={{
                          paper: { sx: { borderRadius: "10px" } },
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Selecione a marca"
                            sx={modalAutocompleteInputSx}
                            hiddenLabel
                          />
                        )}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {modalLabel("Gênero")}
                      <FormControl fullWidth size="small" sx={modalFieldSx}>
                        <Select
                          name="genero"
                          value={currentProduto.genero || ""}
                          onChange={handleChange}
                          displayEmpty
                          sx={{ borderRadius: "10px" }}
                        >
                          <MenuItem value="" disabled>
                            <em>Selecione…</em>
                          </MenuItem>
                          {GENEROS.map((gen) => (
                            <MenuItem key={gen} value={gen}>
                              {gen}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {modalLabel("SKU")}
                      <TextField
                        fullWidth
                        required
                        name="sku"
                        value={currentProduto.sku}
                        onChange={handleChange}
                        placeholder="Ex: CAM-BRA-001"
                        size="small"
                        sx={modalFieldSx}
                        hiddenLabel
                      />
                    </Grid>
                  </Grid>

                  <Box>
                    {modalLabel("Código de barras")}
                    <TextField
                      fullWidth
                      name="codigoBarras"
                      value={currentProduto.codigoBarras}
                      onChange={handleDigitsOnlyChange}
                      size="small"
                      sx={modalFieldSx}
                      hiddenLabel
                      placeholder="Opcional (apenas números)"
                      inputProps={{ inputMode: "numeric", maxLength: 14 }}
                    />
                  </Box>

                  <Box>
                    {modalLabel("Fornecedor")}
                    <Autocomplete
                      fullWidth
                      size="small"
                      options={listaFornecedores}
                      value={listaFornecedores.find((f) => f.id === currentProduto.fornecedorId) || null}
                      getOptionLabel={(f) => f.nome || f.razaoSocial || ""}
                      onChange={(_, newValue) => {
                        setCurrentProduto((prev) => ({
                          ...prev,
                          fornecedorId: newValue?.id ?? null,
                          fornecedor: newValue ? (newValue.nome || newValue.razaoSocial || "") : "",
                        }));
                      }}
                      filterSelectedOptions={false}
                      noOptionsText="Nenhum fornecedor cadastrado"
                        slotProps={{
                          paper: { sx: { borderRadius: "10px" } },
                        }}
                        ListboxProps={{ sx: { maxHeight: 280 } }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Digite para buscar…"
                          sx={modalFieldSx}
                          hiddenLabel
                        />
                      )}
                    />
                  </Box>

                  <Box>
                    {modalLabel("Cores")}
                    <Autocomplete
                      multiple
                      fullWidth
                      size="small"
                      options={CORES}
                      value={currentProduto.cores ?? []}
                      onChange={(_e, newValue) => handleMultipleChange("cores", newValue)}
                      sx={modalFieldSx}
                      slotProps={{
                        paper: { sx: { borderRadius: "10px" } },
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          placeholder="Selecione as cores"
                          sx={modalFieldSx}
                          hiddenLabel
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip label={option} {...getTagProps({ index })} size="small" />
                        ))
                      }
                    />
                  </Box>

                  <Box>
                    {modalLabel("Tamanhos disponíveis")}
                    <ToggleButtonGroup
                      exclusive
                      value={currentProduto.tipoTamanho || "roupas"}
                      onChange={handleTipoTamanhoChange}
                      sx={tipoTamanhoTabsSx}
                    >
                      <ToggleButton value="roupas">Padrão</ToggleButton>
                      <ToggleButton value="acessorios">Infantil</ToggleButton>
                      <ToggleButton value="calcados">Numeração</ToggleButton>
                    </ToggleButtonGroup>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                      {getTamanhosDisponiveis().map((tam) => {
                        const selected = (currentProduto.tamanhos ?? []).includes(tam);
                        return (
                          <Button
                            key={tam}
                            type="button"
                            size="small"
                            variant={selected ? "contained" : "outlined"}
                            onClick={() => toggleTamanhoChip(tam)}
                            sx={{
                              minWidth: 42,
                              height: 40,
                              p: 0,
                              borderRadius: "10px",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              ...(selected
                                ? {
                                    bgcolor: "background.paper",
                                    color: "text.primary",
                                    boxShadow: isDark ? `0 0 0 1px ${alpha("#fff", 0.25)}` : theme.shadows[1],
                                    border: "none",
                                  }
                                : {
                                    borderColor: isDark ? alpha("#fff", 0.2) : "divider",
                                    color: "text.secondary",
                                  }),
                            }}
                          >
                            {tam}
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>

                  <Box>
                    {modalLabel("Material")}
                    <FormControl fullWidth size="small" sx={modalFieldSx}>
                      <Select
                        name="material"
                        value={currentProduto.material || ""}
                        onChange={handleChange}
                        displayEmpty
                        sx={{ borderRadius: "10px" }}
                      >
                        <MenuItem value="">
                          <em>Selecione…</em>
                        </MenuItem>
                        {MATERIAIS.map((mat) => (
                          <MenuItem key={mat} value={mat}>
                            {mat}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {modalLabel("Preço promocional R$")}
                      <TextField
                        fullWidth
                        name="precoPromocional"
                        type="number"
                        value={currentProduto.precoPromocional}
                        onChange={handleChange}
                        size="small"
                        sx={modalFieldSx}
                        hiddenLabel
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography component="span" variant="body2" color="text.secondary">
                                R$
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{ step: "0.01", min: "0" }}
                        placeholder="Opcional"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      {modalLabel("Margem de lucro")}
                      <TextField
                        fullWidth
                        value={calcularMargemLucro() + "%"}
                        InputProps={{ readOnly: true }}
                        size="small"
                        sx={{
                          ...modalFieldSx,
                          bgcolor: isDark ? "rgba(16, 185, 129, 0.12)" : "#dcfce7",
                          "& .MuiInputBase-input": {
                            fontWeight: 700,
                            color: "success.main",
                          },
                        }}
                        hiddenLabel
                      />
                    </Grid>
                  </Grid>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.25,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box
                      sx={{
                        flex: "1 1 140px",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        p: 1.5,
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: modalSurface,
                      }}
                    >
                      <Star sx={{ color: "warning.main", fontSize: 22 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "0.6rem" }}>
                          Margem
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {calcularMargemLucro()}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        flex: "1 1 140px",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        p: 1.5,
                        borderRadius: "12px",
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: modalSurface,
                      }}
                    >
                      <LocalShipping sx={{ color: "info.main", fontSize: 22 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "0.6rem" }}>
                          Estoque
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          {currentProduto.estoqueTotal !== "" && currentProduto.estoqueTotal != null
                            ? `${currentProduto.estoqueTotal} un.`
                            : "—"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Estoque total / mínimo removidos do cadastro — gerencie em Estoque */}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      py: 0.5,
                    }}
                  >
                    <Box>
                      {modalLabel("Promoção ativa")}
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: -0.25 }}>
                        Liga automaticamente se o preço promocional for maior que zero
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={precoPromocionalAtivo ? "Sim" : "Não"}
                      sx={{
                        fontWeight: 800,
                        borderRadius: "8px",
                        bgcolor: precoPromocionalAtivo
                          ? alpha(theme.palette.warning.main, 0.2)
                          : modalSurface,
                      }}
                    />
                  </Box>

                  <Box>
                    {modalLabel("Observações internas")}
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
                      Visíveis apenas para a equipe (não vão para o catálogo).
                    </Typography>
                    <TextField
                      fullWidth
                      name="observacoes"
                      multiline
                      rows={3}
                      value={currentProduto.observacoes}
                      onChange={handleChange}
                      placeholder="Informações internas sobre o produto…"
                      size="small"
                      sx={modalFieldSx}
                      hiddenLabel
                    />
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 3,
            pt: 0,
            flexDirection: "column",
            alignItems: "stretch",
            gap: 0,
          }}
        >
          <Button
            type="button"
            fullWidth
            size="large"
            onClick={() => void handleSave()}
            disabled={salvandoProduto}
            sx={{
              py: 1.5,
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "none",
              ...(isDark
                ? {
                    color: theme.palette.common.black,
                    bgcolor: "#EAB308",
                    border: "2px solid #EAB308",
                    "&:hover": {
                      bgcolor: "#FACC15",
                      borderColor: "#FACC15",
                    },
                    "&.Mui-disabled": {
                      color: alpha(theme.palette.common.black, 0.4),
                      bgcolor: alpha("#EAB308", 0.45),
                      borderColor: alpha("#EAB308", 0.35),
                    },
                  }
                : {
                    color: theme.palette.common.black,
                    bgcolor: theme.palette.common.white,
                    border: `2px solid ${theme.palette.common.white}`,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.common.white, 0.92),
                      borderColor: alpha(theme.palette.common.white, 0.92),
                    },
                    "&.Mui-disabled": {
                      color: alpha(theme.palette.common.black, 0.35),
                      bgcolor: alpha(theme.palette.common.white, 0.5),
                      borderColor: "transparent",
                    },
                  }),
            }}
          >
            {salvandoProduto ? "Salvando…" : "Salvar produto"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!produtoParaExcluir}
        onClose={handleFecharConfirmExcluir}
        onConfirm={handleConfirmarExcluir}
        title="Excluir produto"
        message={confirmMessages.delete(entityNames.produto)}
        itemLabel={produtoParaExcluir?.nome}
        loading={excluindoProduto}
      />
    </Box>
  );
}

export default Produtos;
