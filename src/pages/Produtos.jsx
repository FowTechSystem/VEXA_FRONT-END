// src/pages/Produtos.jsx
import React, { useState, useEffect } from "react";
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
  InputLabel,
  Autocomplete,
  Avatar,
  Stack,
  Slide,
  AppBar,
  Toolbar,
  Container,
  useTheme,
} from "@mui/material";
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
} from "@mui/icons-material";
import { LoadingBox } from "../components/LoadingBox";
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

// Transição para o Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
  const isDark = theme.palette.mode === "dark";

  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const produtosPorPagina = 10;
  const [carregando, setCarregando] = useState(false);

  const [currentProduto, setCurrentProduto] = useState({
    nome: "",
    descricao: "",
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
    peso: "",
    largura: "",
    altura: "",
    comprimento: "",
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

  /**
   * Converte o formulário para o payload da API conforme contrato.
   * Obrigatórios: sku, nome, categoriaId, generoId, precoCusto, precoVenda, quantidadeEstoque, estoqueMinimo.
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
    };
    if (isCreate) payload.quantidadeEstoque = int(p.estoqueTotal);
    const optCodigo = str(p.codigoBarras);
    if (optCodigo) payload.codigoBarras = optCodigo;
    const optDesc = str(p.descricao);
    if (optDesc) payload.descricaoCurta = optDesc;
    const optPeso = num(p.peso);
    if (optPeso != null) payload.peso = optPeso;
    const optFoto = str(p.imagemPrincipal);
    if (optFoto) payload.foto1 = optFoto;
    if (p.fornecedorId != null && p.fornecedorId !== "") payload.fornecedorId = Number(p.fornecedorId);
    if (marcaId != null) payload.marcaId = marcaId;
    if (!isCreate && p.id != null) payload.id = p.id;
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
        "Erro ao buscar produtos. Verifique se o backend está rodando (https://localhost:5001) e se fez login com dev@gmail.com e clicou em Entrar em empresa.";
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
          produto.descricao?.toLowerCase().includes(termo) ||
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
      p.tipoTamanho = p.tipoTamanho || inferirTipoTamanho(p.tamanhos);
      setCurrentProduto(p);
      setEditMode(true);
    } else {
      setCurrentProduto({
        nome: "",
        descricao: "",
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
        peso: "",
        largura: "",
        altura: "",
        comprimento: "",
        imagemPrincipal: "",
        imagensAdicionais: [],
        fornecedor: "",
        fornecedorId: null,
        observacoes: "",
        ativo: true,
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
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

    if (currentProduto.cores.length === 0) {
      showError("Selecione pelo menos uma cor");
      return;
    }

    if (currentProduto.tamanhos.length === 0) {
      showError("Selecione pelo menos um tamanho");
      return;
    }

    if (
      !currentProduto.precoVenda ||
      parseFloat(currentProduto.precoVenda) <= 0
    ) {
      showError("Preço de venda deve ser maior que zero");
      return;
    }

    try {
      const produtoParaSalvar = toApiPayload(currentProduto, !editMode);

      if (editMode) {
        await produtosService.update(currentProduto.id, produtoParaSalvar);
        showSuccess(successMessages.update(entityNames.produto));
      } else {
        await produtosService.create(produtoParaSalvar);
        showSuccess(successMessages.create(entityNames.produto));
      }
      fetchProdutos();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      console.error("Resposta da API (400):", error.response?.data);

      if (error.response) {
        const errorData = error.response.data;
        const msg =
          errorData?.message ||
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
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(confirmMessages.delete(entityNames.produto))) {
      try {
        await produtosService.delete(id);
        showSuccess(successMessages.delete(entityNames.produto));
        fetchProdutos();
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        showError(errorMessages.delete(entityNames.produto));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduto({
      ...currentProduto,
      [name]: value,
    });
  };

  const handleMultipleChange = (name, value) => {
    setCurrentProduto({
      ...currentProduto,
      [name]: value,
    });
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

  useEffect(() => {
    fetchProdutos();
  }, []);

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
          placeholder="Buscar por nome, categoria, marca, SKU ou descrição..."
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
                        src={produto.imagemPrincipal}
                        sx={{
                          bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                          width: 48,
                          height: 48,
                          border: "2px solid",
                        borderColor: "divider",
                        }}
                      >
                        <Inventory sx={{ color: "primary.main", fontSize: 24 }} />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: "text.primary" }}
                        >
                          {produto.nome}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
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
                        bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                        color: "primary.main",
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
                      label={produto.estoqueTotal || 0}
                      size="small"
                      sx={{
                        bgcolor:
                          (produto.estoqueTotal || 0) >
                          (produto.estoqueMinimo || 10)
                            ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7")
                            : (produto.estoqueTotal || 0) > 0
                              ? (isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7")
                              : (isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2"),
                        color:
                          (produto.estoqueTotal || 0) >
                          (produto.estoqueMinimo || 10)
                            ? (isDark ? "#34D399" : "#16a34a")
                            : (produto.estoqueTotal || 0) > 0
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
                      onClick={() => handleDelete(produto.id)}
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

      {/* Dialog em Tela Cheia - LATERAL ESQUERDO */}
      <Dialog
        fullScreen
        open={openDialog}
        onClose={handleCloseDialog}
        TransitionComponent={Transition}
        PaperProps={{ sx: { bgcolor: theme.palette.background.default } }}
      >
        {/* AppBar Superior */}
        <AppBar
          sx={{
            position: "sticky",
            bgcolor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderBottom: "1px solid",
            borderColor: theme.palette.divider,
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleCloseDialog}
              sx={{ color: theme.palette.text.primary }}
            >
              <Close />
            </IconButton>
            <Typography
              sx={{ ml: 2, flex: 1, fontWeight: 600, fontSize: "20px", color: theme.palette.text.primary }}
            >
              {editMode ? "Editar Produto" : "Novo Produto"}
            </Typography>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{
                textTransform: "none",
                bgcolor: "primary.main",
                boxShadow: "none",
                px: 4,
                fontWeight: 600,
              }}
            >
              Salvar Produto
            </Button>
          </Toolbar>
        </AppBar>

        <DialogContent sx={{ bgcolor: theme.palette.background.default, p: 0 }}>
          <Box sx={{ overflowY: "auto", minHeight: "calc(100vh - 64px)" }}>
            {/* Imagem no centro superior - sem card */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pt: 4,
                pb: 2,
                px: 4,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>
                Imagem do Produto
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 280,
                  height: 280,
                  overflow: "hidden",
                }}
              >
                {currentProduto.imagemPrincipal ? (
                  <img
                    src={currentProduto.imagemPrincipal}
                    alt="Preview"
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <Box sx={{ textAlign: "center", color: theme.palette.text.secondary }}>
                    <ImageIcon sx={{ fontSize: 64, mb: 1, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>Sem imagem</Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: "block", mt: 0.5 }}>Cole a URL ou faça upload</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 2, width: "100%", maxWidth: 420, flexWrap: "wrap", justifyContent: "center" }}>
                <TextField
                  label="URL da Imagem"
                  name="imagemPrincipal"
                  value={currentProduto.imagemPrincipal}
                  onChange={handleChange}
                  placeholder="https://exemplo.com/imagem.jpg"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <ImageIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  sx={{
                    textTransform: "none",
                    py: 1.25,
                    borderColor: "divider",
                    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover", color: "primary.main" },
                  }}
                >
                  Upload
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: 4 }}>
            <Stack spacing={3}>

                {/* Informações Básicas */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2.5, color: "text.primary" }}
                  >
                    Informações Básicas
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Nome do Produto"
                        name="nome"
                        value={currentProduto.nome}
                        onChange={handleChange}
                        placeholder="Ex: Vestido Floral"
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ minWidth: 0 }}>
                      <Autocomplete
                        fullWidth
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
                        sx={{ minWidth: 280 }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Categoria *"
                            size="small"
                            placeholder="Selecione a categoria"
                            InputLabelProps={{
                              shrink: true,
                              sx: {
                                fontSize: "1rem",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                                overflow: "visible",
                              },
                            }}
                            sx={{
                              minWidth: 280,
                              "& .MuiInputLabel-root": {
                                whiteSpace: "nowrap",
                                overflow: "visible",
                              },
                              "& .MuiOutlinedInput-root": {
                                bgcolor: "background.default",
                                borderRadius: 1,
                                minHeight: 52,
                                "& .MuiAutocomplete-input": { py: 1.5 },
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ minWidth: 0 }}>
                      <Autocomplete
                        fullWidth
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
                        sx={{ minWidth: 280 }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Marca"
                            size="small"
                            placeholder="Selecione a marca"
                            InputLabelProps={{
                              shrink: true,
                              sx: {
                                fontSize: "1rem",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                                overflow: "visible",
                              },
                            }}
                            sx={{
                              minWidth: 280,
                              "& .MuiInputLabel-root": {
                                whiteSpace: "nowrap",
                                overflow: "visible",
                              },
                              "& .MuiOutlinedInput-root": {
                                bgcolor: "background.default",
                                borderRadius: 1,
                                minHeight: 52,
                                "& .MuiAutocomplete-input": { py: 1.5 },
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth size="small" sx={{ minWidth: 180 }}>
                        <InputLabel id="prod-genero-label">Gênero</InputLabel>
                        <Select
                          name="genero"
                          value={currentProduto.genero}
                          onChange={handleChange}
                          labelId="prod-genero-label"
                          label="Gênero"
                        >
                          {GENEROS.map((gen) => (
                            <MenuItem key={gen} value={gen}>
                              {gen}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="SKU"
                        name="sku"
                        value={currentProduto.sku}
                        onChange={handleChange}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Código de Barras"
                        name="codigoBarras"
                        value={currentProduto.codigoBarras}
                        onChange={handleChange}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sx={{ minWidth: 0 }}>
                      <Autocomplete
                        fullWidth
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
                        sx={{ minWidth: 280 }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Fornecedor"
                            size="small"
                            placeholder="Digite para buscar fornecedores"
                            InputLabelProps={{
                              shrink: true,
                              sx: {
                                fontSize: "1rem",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                                overflow: "visible",
                              },
                            }}
                            sx={{
                              minWidth: 280,
                              "& .MuiInputLabel-root": {
                                whiteSpace: "nowrap",
                                overflow: "visible",
                              },
                              "& .MuiOutlinedInput-root": {
                                bgcolor: "background.default",
                                borderRadius: 1,
                                minHeight: 52,
                                "& .MuiAutocomplete-input": { py: 1.5 },
                              },
                            }}
                          />
                        )}
                        ListboxProps={{ sx: { maxHeight: 280 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Descrição"
                        name="descricao"
                        multiline
                        rows={2}
                        value={currentProduto.descricao}
                        onChange={handleChange}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          "& .MuiInputLabel-root": {
                            maxWidth: "calc(100% - 20px)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Variações */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2.5, color: "text.primary" }}
                  >
                    Variações do Produto
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                      <Autocomplete
                        multiple
                        options={CORES}
                        value={currentProduto.cores}
                        onChange={(event, newValue) =>
                          handleMultipleChange("cores", newValue)
                        }
                        sx={{ minWidth: 220 }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Cores *"
                            size="small"
                            sx={{
                              minWidth: 220,
                              "& .MuiInputLabel-root": { whiteSpace: "nowrap", overflow: "visible" },
                              "& .MuiOutlinedInput-root": { paddingLeft: 1 },
                            }}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={option}
                              {...getTagProps({ index })}
                              size="small"
                            />
                          ))
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1, flexWrap: "wrap" }}>
                        <Typography variant="subtitle2" sx={{ color: "text.secondary", fontSize: "0.875rem", lineHeight: 1.5 }}>
                          Tamanhos *
                        </Typography>
                        <ToggleButtonGroup
                          value={currentProduto.tipoTamanho || "roupas"}
                          exclusive
                          onChange={handleTipoTamanhoChange}
                          size="small"
                          sx={{ "& .MuiToggleButton-root": { py: 0.25, px: 1, fontSize: "0.75rem" } }}
                        >
                          <ToggleButton value="roupas">Roupas</ToggleButton>
                          <ToggleButton value="calcados">Calçados</ToggleButton>
                          <ToggleButton value="acessorios">Acessórios</ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                      <Autocomplete
                        multiple
                        options={getTamanhosDisponiveis()}
                        value={currentProduto.tamanhos}
                        onChange={(event, newValue) =>
                          handleMultipleChange("tamanhos", newValue)
                        }
                        sx={{ minWidth: 220 }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Selecione os tamanhos"
                            size="small"
                            placeholder={
                              (currentProduto.tipoTamanho || "roupas") === "roupas"
                                ? "PP, P, M, G..."
                                : (currentProduto.tipoTamanho || "roupas") === "calcados"
                                  ? "33, 34, 35..."
                                  : "Único, P, M..."
                            }
                            sx={{
                              minWidth: 220,
                              "& .MuiInputLabel-root": { whiteSpace: "nowrap", overflow: "visible" },
                              "& .MuiOutlinedInput-root": { paddingLeft: 1 },
                            }}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={option}
                              {...getTagProps({ index })}
                              size="small"
                            />
                          ))
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={12}>
                      <FormControl fullWidth size="small" sx={{ minWidth: 220, maxWidth: 400 }}>
                        <InputLabel id="prod-material-label">Material</InputLabel>
                        <Select
                          name="material"
                          value={currentProduto.material}
                          onChange={handleChange}
                          labelId="prod-material-label"
                          label="Material"
                        >
                          {MATERIAIS.map((mat) => (
                            <MenuItem key={mat} value={mat}>
                              {mat}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Precificação */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2.5, color: "text.primary" }}
                  >
                    Precificação
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Preço de Custo"
                        name="precoCusto"
                        type="number"
                        value={currentProduto.precoCusto}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">R$</InputAdornment>
                          ),
                        }}
                        inputProps={{ step: "0.01", min: "0" }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        required
                        label="Preço de Venda"
                        name="precoVenda"
                        type="number"
                        value={currentProduto.precoVenda}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">R$</InputAdornment>
                          ),
                        }}
                        inputProps={{ step: "0.01", min: "0" }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Preço Promocional"
                        name="precoPromocional"
                        type="number"
                        value={currentProduto.precoPromocional}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">R$</InputAdornment>
                          ),
                        }}
                        inputProps={{ step: "0.01", min: "0" }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Margem de Lucro"
                        value={calcularMargemLucro() + "%"}
                        InputProps={{ readOnly: true }}
                        size="small"
                        sx={{
                          bgcolor: isDark ? "rgba(16, 185, 129, 0.12)" : "#dcfce7",
                          "& .MuiInputBase-input": {
                            fontWeight: 600,
                            color: "success.main",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Estoque */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2.5, color: "text.primary" }}
                  >
                    Controle de Estoque
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Estoque Total"
                        name="estoqueTotal"
                        type="number"
                        value={currentProduto.estoqueTotal}
                        onChange={handleChange}
                        inputProps={{ min: "0" }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Estoque Mínimo"
                        name="estoqueMinimo"
                        type="number"
                        value={currentProduto.estoqueMinimo}
                        onChange={handleChange}
                        inputProps={{ min: "0" }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Dimensões */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2.5, color: "text.primary" }}
                  >
                    Dimensões e Peso
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Peso (kg)"
                        name="peso"
                        type="number"
                        value={currentProduto.peso}
                        onChange={handleChange}
                        inputProps={{ step: "0.01", min: "0" }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Largura (cm)"
                        name="largura"
                        type="number"
                        value={currentProduto.largura}
                        onChange={handleChange}
                        inputProps={{ min: "0" }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Altura (cm)"
                        name="altura"
                        type="number"
                        value={currentProduto.altura}
                        onChange={handleChange}
                        inputProps={{ min: "0" }}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Comprimento (cm)"
                        name="comprimento"
                        type="number"
                        value={currentProduto.comprimento}
                        onChange={handleChange}
                        inputProps={{ min: "0" }}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Observações */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2.5, color: "text.primary" }}
                  >
                    Observações Internas
                  </Typography>
                  <TextField
                    fullWidth
                    label="Observações"
                    name="observacoes"
                    multiline
                    rows={3}
                    value={currentProduto.observacoes}
                    onChange={handleChange}
                    placeholder="Informações internas sobre o produto..."
                    size="small"
                  />
                </Paper>
              </Stack>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Produtos;
