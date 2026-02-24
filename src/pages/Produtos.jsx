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

// Dados para loja de roupas e acessórios
const CATEGORIAS = [
  "Camisetas",
  "Blusas",
  "Vestidos",
  "Saias",
  "Calças",
  "Shorts",
  "Jaquetas e Casacos",
  "Conjuntos",
  "Moda Íntima",
  "Moda Praia",
  "Acessórios",
  "Bolsas",
  "Calçados",
  "Joias e Bijuterias",
  "Cintos",
  "Óculos",
  "Bonés e Chapéus",
];

const TAMANHOS_ROUPA = ["PP", "P", "M", "G", "GG", "XG", "XGG"];
const TAMANHOS_CALCADOS = [
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
];

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
    genero: "",
    marca: "",
    precoCusto: "",
    precoVenda: "",
    precoPromocional: "",
    emPromocao: false,
    cores: [],
    tamanhos: [],
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
    observacoes: "",
    ativo: true,
  });

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
      console.error("Erro ao buscar produtos:", error);
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
          produto.categoria?.toLowerCase().includes(termo) ||
          produto.descricao?.toLowerCase().includes(termo) ||
          produto.sku?.toLowerCase().includes(termo) ||
          produto.marca?.toLowerCase().includes(termo),
      );
      setProdutosFiltrados(filtrados);
    }
    setPaginaAtual(1); // Volta para a primeira página ao buscar
  };

  const handleOpenDialog = (produto = null) => {
    if (produto) {
      setCurrentProduto(produto);
      setEditMode(true);
    } else {
      setCurrentProduto({
        nome: "",
        descricao: "",
        categoria: "",
        genero: "",
        marca: "",
        precoCusto: "",
        precoVenda: "",
        precoPromocional: "",
        emPromocao: false,
        cores: [],
        tamanhos: [],
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
    // Validações
    const nomeValidation = validateRequired(
      currentProduto.nome,
      "Nome do Produto",
    );
    if (!nomeValidation.valid) {
      showError(nomeValidation.message);
      return;
    }

    const categoriaValidation = validateRequired(
      currentProduto.categoria,
      "Categoria",
    );
    if (!categoriaValidation.valid) {
      showError(categoriaValidation.message);
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
      const produtoParaSalvar = {
        ...currentProduto,
        margemLucro: currentProduto.precoCusto
          ? (
              ((parseFloat(currentProduto.precoVenda) -
                parseFloat(currentProduto.precoCusto)) /
                parseFloat(currentProduto.precoVenda)) *
              100
            ).toFixed(2)
          : 0,
      };

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

      if (error.response) {
        const errorData = error.response.data;
        if (errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          showError(firstError[0] || errorMessages.create(entityNames.produto));
        } else {
          showError(
            errorData.message || errorMessages.create(entityNames.produto),
          );
        }
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
    if (currentProduto.categoria === "Calçados") {
      return TAMANHOS_CALCADOS;
    }
    return TAMANHOS_ROUPA;
  };

  useEffect(() => {
    //fetchProdutos();
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
                          bgcolor: "#eff6ff",
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
                          {produto.marca || "—"} • SKU: {produto.sku || "—"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={produto.categoria || "Sem categoria"}
                      size="small"
                      sx={{
                        bgcolor: "#eff6ff",
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
                          sx={{ color: "#dc2626", fontWeight: 600 }}
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
                            ? "#dcfce7"
                            : (produto.estoqueTotal || 0) > 0
                              ? "#fef3c7"
                              : "#fee2e2",
                        color:
                          (produto.estoqueTotal || 0) >
                          (produto.estoqueMinimo || 10)
                            ? "#16a34a"
                            : (produto.estoqueTotal || 0) > 0
                              ? "#d97706"
                              : "#dc2626",
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
                        "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
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
          <Box sx={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
            {/* LATERAL ESQUERDA - ÁREA DA IMAGEM (30%) */}
            <Box
              sx={{
                width: "30%",
                bgcolor: theme.palette.background.paper,
                borderRight: "1px solid",
                borderColor: theme.palette.divider,
                p: 3,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 3, color: theme.palette.text.primary }}
              >
                Imagem do Produto
              </Typography>

              {/* Área de Preview da Imagem */}
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: theme.palette.mode === "dark" ? theme.palette.background.default : theme.palette.grey[50],
                  borderRadius: 2,
                  border: "2px dashed",
                  borderColor: theme.palette.divider,
                  mb: 3,
                  minHeight: 450,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {currentProduto.imagemPrincipal ? (
                  <img
                    src={currentProduto.imagemPrincipal}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <Box sx={{ textAlign: "center", color: theme.palette.text.secondary }}>
                    <ImageIcon sx={{ fontSize: 80, mb: 2, color: theme.palette.text.secondary }} />
                    <Typography variant="h6" sx={{ mb: 1, color: theme.palette.text.primary }}>
                      Sem imagem
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      Cole a URL abaixo ou faça upload
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Campo URL da Imagem */}
              <TextField
                fullWidth
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
                sx={{ mb: 2 }}
              />

              {/* Botão de Upload (visual) */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CloudUpload />}
                sx={{
                  textTransform: "none",
                  py: 1.5,
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "action.hover",
                    color: "primary.main",
                  },
                }}
              >
                Fazer Upload de Imagem
              </Button>
            </Box>

            {/* ÁREA DIREITA - INFORMAÇÕES (70%) */}
            <Box
              sx={{
                width: "70%",
                overflowY: "auto",
                p: 4,
              }}
            >
              <Stack spacing={3}>
                {/* Informações Básicas */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
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
                    <Grid item xs={6} md={3}>
                      <FormControl fullWidth required size="small">
                        <InputLabel>Categoria</InputLabel>
                        <Select
                          name="categoria"
                          value={currentProduto.categoria}
                          onChange={handleChange}
                          label="Categoria"
                        >
                          {CATEGORIAS.map((cat) => (
                            <MenuItem key={cat} value={cat}>
                              {cat}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Marca"
                        name="marca"
                        value={currentProduto.marca}
                        onChange={handleChange}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Gênero</InputLabel>
                        <Select
                          name="genero"
                          value={currentProduto.genero}
                          onChange={handleChange}
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
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="SKU"
                        name="sku"
                        value={currentProduto.sku}
                        onChange={handleChange}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Código de Barras"
                        name="codigoBarras"
                        value={currentProduto.codigoBarras}
                        onChange={handleChange}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Fornecedor"
                        name="fornecedor"
                        value={currentProduto.fornecedor}
                        onChange={handleChange}
                        size="small"
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
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2.5, color: "text.primary" }}
                  >
                    Variações do Produto
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Autocomplete
                        multiple
                        options={CORES}
                        value={currentProduto.cores}
                        onChange={(event, newValue) =>
                          handleMultipleChange("cores", newValue)
                        }
                        renderInput={(params) => (
                          <TextField {...params} label="Cores *" size="small" />
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
                    <Grid item xs={12} md={4}>
                      <Autocomplete
                        multiple
                        options={getTamanhosDisponiveis()}
                        value={currentProduto.tamanhos}
                        onChange={(event, newValue) =>
                          handleMultipleChange("tamanhos", newValue)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Tamanhos *"
                            size="small"
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
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Material</InputLabel>
                        <Select
                          name="material"
                          value={currentProduto.material}
                          onChange={handleChange}
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
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, mb: 2.5, color: "text.primary" }}
                  >
                    Precificação
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
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
                    <Grid item xs={6} md={3}>
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
                    <Grid item xs={6} md={3}>
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
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Margem de Lucro"
                        value={calcularMargemLucro() + "%"}
                        InputProps={{ readOnly: true }}
                        size="small"
                        sx={{
                          bgcolor: "#dcfce7",
                          "& .MuiInputBase-input": {
                            fontWeight: 600,
                            color: "#16a34a",
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
