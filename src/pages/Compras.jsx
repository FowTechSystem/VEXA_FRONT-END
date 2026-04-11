// src/pages/Compras.jsx
import React, { useState, useEffect } from "react";
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
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import { showSuccess, showError } from "../utils/notifications";
import {
  ShoppingBag,
  Add,
  Search,
  ArrowBack,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
  Delete,
  Edit,
  Inventory,
} from "@mui/icons-material";
import { LoadingBox } from "../components/LoadingBox";
import { comprasService } from "../api/comprasService";
import { FornecedorService } from "../api/fornecedorService";
import { produtosService } from "../api/produtosService";

const STATUS_COMPRA = {
  pendente: { label: "Pendente", color: "#d97706", bgcolor: "#fef3c7" },
  aprovada: { label: "Aprovada", color: "#16a34a", bgcolor: "#dcfce7" },
  recebida: { label: "Recebida", color: "#2563eb", bgcolor: "#eff6ff" },
  cancelada: { label: "Cancelada", color: "#dc2626", bgcolor: "#fee2e2" },
};

function Compras() {
  const [compras, setCompras] = useState([]);
  const [listaFornecedores, setListaFornecedores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openValidacaoModal, setOpenValidacaoModal] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [compraParaExcluir, setCompraParaExcluir] = useState(null);
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const comprasPorPagina = 10;

  const [currentCompra, setCurrentCompra] = useState({
    fornecedorId: null,
    fornecedor: null,
    dataPedido: new Date().toISOString().split("T")[0],
    dataEntregaPrevista: "",
    status: "pendente",
    observacoes: "",
  });

  const [itensCompra, setItensCompra] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeItem, setQuantidadeItem] = useState("");
  const [precoUnitarioItem, setPrecoUnitarioItem] = useState("");
  const [listaProdutos, setListaProdutos] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const selectFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1.5,
      bgcolor: "background.paper",
      "& fieldset": { borderColor: "divider" },
      "&:hover fieldset": { borderColor: "text.secondary" },
      "&.Mui-focused fieldset": { borderWidth: 1, borderColor: "primary.main" },
    },
  };

  const nomeFornecedor = (c) =>
    c.fornecedor?.nome ?? c.fornecedor ?? (typeof c.fornecedor === "string" ? c.fornecedor : "");
  const comprasFiltradas = compras.filter(
    (c) =>
      nomeFornecedor(c)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const totalPaginas = Math.max(1, Math.ceil(comprasFiltradas.length / comprasPorPagina));
  const indiceInicial = (paginaAtual - 1) * comprasPorPagina;
  const indiceFinal = indiceInicial + comprasPorPagina;
  const comprasPaginadas = comprasFiltradas.slice(indiceInicial, indiceFinal);

  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  const fetchCompras = async () => {
    setCarregando(true);
    try {
      const data = await comprasService.getAll();
      const lista = Array.isArray(data) ? data : data?.compras ?? [];
      setCompras(lista);
    } catch {
      setCompras([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  useEffect(() => {
    let cancelled = false;
    FornecedorService.getAll()
      .then((data) => {
        if (cancelled) return;
        const raw = data?.fornecedor ?? data?.items ?? data?.fornecedores ?? data;
        setListaFornecedores(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {
        if (!cancelled) setListaFornecedores([]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!openDialog) return;
    let cancelled = false;
    produtosService.getAll().then((data) => {
      if (cancelled) return;
      const prods = Array.isArray(data) ? data : (data?.produtos ?? data?.items ?? []);
      setListaProdutos(Array.isArray(prods) ? prods : []);
    }).catch(() => { if (!cancelled) setListaProdutos([]); });
    return () => { cancelled = true; };
  }, [openDialog]);

  useEffect(() => {
    if (location.state?.returnFromProdutos) {
      const draft = sessionStorage.getItem("compras_draft");
      if (draft) {
        try {
          const { currentCompra: saved, itensCompra: itens } = JSON.parse(draft);
          if (saved) setCurrentCompra(saved);
          if (Array.isArray(itens)) setItensCompra(itens);
        } catch { /* ignore */ }
        sessionStorage.removeItem("compras_draft");
      }
      setOpenDialog(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.returnFromProdutos, navigate, location.pathname]);

  const fornecedorSelecionado = !!(currentCompra.fornecedorId ?? currentCompra.fornecedor);

  const [compraIdEdit, setCompraIdEdit] = useState(null);

  const handleOpenDialog = () => {
    setCompraIdEdit(null);
    setCurrentCompra({
      fornecedorId: null,
      fornecedor: null,
      dataPedido: new Date().toISOString().split("T")[0],
      dataEntregaPrevista: "",
      status: "pendente",
      observacoes: "",
    });
    setItensCompra([]);
    setProdutoSelecionado(null);
    setQuantidadeItem("");
    setPrecoUnitarioItem("");
    setOpenDialog(true);
  };

  const handleOpenEdit = async (compra) => {
    try {
      const full = await comprasService.getById(compra.id);
      const f = full?.fornecedor ?? full;
      const fornecedorObj = typeof f === "object" ? f : null;
      setCurrentCompra({
        fornecedorId: full?.fornecedorId ?? fornecedorObj?.id ?? null,
        fornecedor: fornecedorObj ?? listaFornecedores.find((x) => x.id === (full?.fornecedorId ?? fornecedorObj?.id)) ?? null,
        dataPedido: full?.dataPedido ? new Date(full.dataPedido).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        dataEntregaPrevista: full?.dataEntregaPrevista ? new Date(full.dataEntregaPrevista).toISOString().split("T")[0] : "",
        status: full?.status ?? "pendente",
        observacoes: full?.observacoes ?? "",
      });
      const itens = full?.itens ?? full?.items ?? [];
      setItensCompra(
        Array.isArray(itens)
          ? itens.map((i) => ({
              produtoId: i.produtoId ?? i.produto?.id,
              produto: i.produto ?? { id: i.produtoId, nome: i.produtoNome ?? "—", sku: i.produtoSku },
              quantidade: i.quantidade ?? 0,
              precoUnitario: i.precoUnitario ?? 0,
            }))
          : []
      );
      setCompraIdEdit(compra.id);
      setProdutoSelecionado(null);
      setQuantidadeItem("");
      setPrecoUnitarioItem("");
      setOpenDialog(true);
    } catch {
      showError("Erro ao carregar dados da compra.");
    }
  };

  const abrirConfirmDelete = (compra) => {
    setCompraParaExcluir(compra);
    setOpenConfirmDelete(true);
  };

  const fecharConfirmDelete = () => {
    setOpenConfirmDelete(false);
    setCompraParaExcluir(null);
  };

  const handleDelete = async (compra) => {
    fecharConfirmDelete();
    try {
      await comprasService.delete(compra.id);
      showSuccess("Compra excluída.");
      fetchCompras();
    } catch {
      showError("Erro ao excluir compra.");
    }
  };

  const handleAdicionarItem = () => {
    if (!produtoSelecionado) return;
    const qty = parseInt(quantidadeItem, 10);
    if (!quantidadeItem || isNaN(qty) || qty <= 0) {
      showError("Informe a quantidade (número inteiro maior que zero).");
      return;
    }
    const preco = parseFloat(String(precoUnitarioItem || "0").replace(",", ".")) || 0;
    const prod = produtoSelecionado;
    setItensCompra((prev) => [
      ...prev,
      {
        produtoId: prod.id,
        produto: prod,
        quantidade: qty,
        precoUnitario: preco,
      },
    ]);
    setProdutoSelecionado(null);
    setQuantidadeItem("");
    setPrecoUnitarioItem("");
  };

  const handleRemoverItem = (index) => {
    setItensCompra((prev) => prev.filter((_, i) => i !== index));
  };

  const valorTotalItens = itensCompra.reduce(
    (acc, i) => acc + (i.quantidade || 0) * (i.precoUnitario || 0),
    0
  );

  const handleIrParaCadastrarProduto = () => {
    sessionStorage.setItem("compras_draft", JSON.stringify({
      currentCompra,
      itensCompra,
    }));
    navigate("/produtos", { state: { fromCompras: true, openNewProduct: true } });
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentCompra({ ...currentCompra, [name]: value });
  };

  const handleSave = async () => {
    const faltando = [];
    if (!currentCompra.fornecedorId && !currentCompra.fornecedor) faltando.push("Fornecedor");
    if (itensCompra.length === 0) faltando.push("Pelo menos um item com produto e quantidade");
    const itensFaltando = itensCompra.filter((i) => !i.produtoId || !i.quantidade || i.quantidade <= 0);
    if (itensFaltando.length > 0) faltando.push("Todos os itens devem ter produto e quantidade preenchidos");

    if (faltando.length > 0) {
      setMensagemValidacao("Faltam: " + faltando.join(". ") + ".");
      setOpenValidacaoModal(true);
      return;
    }

    const fornecedorId = currentCompra.fornecedorId ?? currentCompra.fornecedor?.id;
    const itens = itensCompra.map((i) => ({
      produtoId: i.produtoId,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario || 0,
    }));
    try {
      const payload = {
        fornecedorId,
        dataPedido: currentCompra.dataPedido,
        dataEntregaPrevista: currentCompra.dataEntregaPrevista || undefined,
        status: currentCompra.status,
        observacoes: currentCompra.observacoes || undefined,
        valorTotal: valorTotalItens,
        itens,
      };
      if (compraIdEdit) {
        await comprasService.update(compraIdEdit, payload);
        showSuccess("Compra atualizada com sucesso!");
      } else {
        await comprasService.create(payload);
        showSuccess("Compra cadastrada com sucesso!");
      }
      fetchCompras();
      handleCloseDialog();
    } catch {
      showError(compraIdEdit ? "Erro ao atualizar compra." : "Erro ao cadastrar compra. Tente novamente.");
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "background.default",
        minHeight: "100vh",
        color: "text.primary",
        ...(openDialog
          ? { display: "flex", flexDirection: "column", overflow: "hidden" }
          : {}),
      }}
    >
      {!openDialog ? (
        <>
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  Compras
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 1 }}
                >
                  Gestão de pedidos de compra
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenDialog}
                sx={{ textTransform: "none", borderRadius: "8px", px: 3 }}
              >
                Nova Compra
              </Button>
            </Box>

            <TextField
              fullWidth
              placeholder="Buscar por fornecedor ou observações..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPaginaAtual(1);
              }}
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
                  "& fieldset": { borderColor: "divider" },
                  "&.Mui-focused fieldset": {
                    borderWidth: "1px",
                    borderColor: "primary.main",
                  },
                },
              }}
            />

            <Typography
              variant="body2"
              sx={{ mt: 2, color: "text.secondary", fontSize: "14px" }}
            >
              {comprasFiltradas.length}{" "}
              {comprasFiltradas.length === 1 ? "compra" : "compras"}
            </Typography>
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
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
                    FORNECEDOR
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                  >
                    DATA PEDIDO
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                  >
                    VALOR
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                  >
                    STATUS
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                    align="right"
                  >
                    AÇÕES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <LoadingBox size={40} py={8} />
                    </TableCell>
                  </TableRow>
                ) : comprasPaginadas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 8, color: "text.secondary" }}
                    >
                      <ShoppingBag sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1">
                        Nenhuma compra encontrada
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Clique em "Nova Compra" para começar
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  comprasPaginadas.map((compra, index) => {
                    const status = STATUS_COMPRA[compra.status] || STATUS_COMPRA.pendente;
                    return (
                      <TableRow
                        key={compra.id}
                        sx={{
                          "&:hover": { bgcolor: "action.hover" },
                          borderBottom:
                            index === comprasPaginadas.length - 1
                              ? "none"
                              : "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <TableCell
                          sx={{ py: 2.5, fontWeight: 500, color: "text.primary" }}
                        >
                          {nomeFornecedor(compra) || "—"}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "14px" }}>
                          {compra.dataPedido
                            ? new Date(compra.dataPedido).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 500, fontSize: "14px", color: "text.primary" }}
                        >
                          R${" "}
                          {(compra.valorTotal || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{
                              bgcolor: status.bgcolor,
                              color: status.color,
                              fontWeight: 500,
                              fontSize: "12px",
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(compra)}
                            sx={{ color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: "action.hover" } }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => abrirConfirmDelete(compra)}
                            sx={{ color: "text.secondary", "&:hover": { color: "error.main", bgcolor: "action.hover" } }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {comprasFiltradas.length > 0 && (
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
                  {Math.min(indiceFinal, comprasFiltradas.length)} de{" "}
                  {comprasFiltradas.length}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    onClick={irParaPrimeiraPagina}
                    disabled={paginaAtual === 1}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { bgcolor: "action.hover" },
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
                    }}
                  >
                    <ChevronLeft fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={irParaProximaPagina}
                    disabled={paginaAtual === totalPaginas}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { bgcolor: "action.hover" },
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
                    }}
                  >
                    <LastPage fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </TableContainer>
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexShrink: 0 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleCloseDialog}
              sx={{
                textTransform: "none",
                color: "text.secondary",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              Voltar
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
              {compraIdEdit ? "Editar Compra" : "Nova Compra"}
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            sx={{ flex: 1, overflow: "auto", pr: 1 }}
          >
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
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <ShoppingBag fontSize="small" /> Dados da Compra
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <Autocomplete
                    fullWidth
                    options={listaFornecedores}
                    getOptionLabel={(opt) =>
                      (opt?.razaoSocial ?? opt?.nome ?? (typeof opt === "string" ? opt : "")) || ""
                    }
                    value={
                      currentCompra.fornecedor ??
                      listaFornecedores.find((f) => f.id === currentCompra.fornecedorId) ??
                      null
                    }
                    onChange={(_, value) =>
                      setCurrentCompra({
                        ...currentCompra,
                        fornecedor: value,
                        fornecedorId: value?.id ?? null,
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Fornecedor"
                        placeholder="Selecione um fornecedor cadastrado"
                        size="small"
                      />
                    )}
                    isOptionEqualToValue={(opt, val) => opt?.id === val?.id}
                    noOptionsText="Nenhum fornecedor cadastrado"
                    disablePortal
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data do Pedido"
                    name="dataPedido"
                    type="date"
                    value={currentCompra.dataPedido}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Entrega Prevista"
                    name="dataEntregaPrevista"
                    type="date"
                    value={currentCompra.dataEntregaPrevista}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={selectFieldSx}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={currentCompra.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      {Object.entries(STATUS_COMPRA).map(([key, val]) => (
                        <MenuItem key={key} value={key}>
                          {val.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mt: 4,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Inventory fontSize="small" /> Itens da Compra
              </Typography>
              {!fornecedorSelecionado && (
                <Typography variant="body2" sx={{ color: "warning.main", mb: 2, fontWeight: 500 }}>
                  Selecione o fornecedor acima para habilitar a adição de produtos.
                </Typography>
              )}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                  mb: 2,
                  flexWrap: "wrap",
                  opacity: fornecedorSelecionado ? 1 : 0.6,
                  pointerEvents: fornecedorSelecionado ? "auto" : "none",
                }}
              >
                <Autocomplete
                  sx={{ minWidth: 280 }}
                  options={listaProdutos}
                  getOptionLabel={(opt) =>
                    (opt?.nome ?? (typeof opt === "string" ? opt : "")) + (opt?.sku ? ` (${opt.sku})` : "")
                  }
                  value={produtoSelecionado}
                  onChange={(_, v) => setProdutoSelecionado(v)}
                  disabled={!fornecedorSelecionado}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Digite para buscar produto..."
                      size="small"
                      label="Produto"
                    />
                  )}
                  isOptionEqualToValue={(a, b) => a?.id === b?.id}
                  noOptionsText="Nenhum produto encontrado. Use o botão abaixo para cadastrar."
                />
                <TextField
                  type="number"
                  label="Quantidade"
                  value={quantidadeItem}
                  onChange={(e) => setQuantidadeItem(e.target.value)}
                  inputProps={{ min: 1 }}
                  size="small"
                  disabled={!fornecedorSelecionado}
                  sx={{ width: 120 }}
                />
                <TextField
                  type="number"
                  label="Preço unit."
                  value={precoUnitarioItem}
                  onChange={(e) => setPrecoUnitarioItem(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                  size="small"
                  disabled={!fornecedorSelecionado}
                  sx={{ width: 130 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAdicionarItem}
                  startIcon={<Add />}
                  disabled={!fornecedorSelecionado}
                  sx={{ textTransform: "none" }}
                >
                  Adicionar
                </Button>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<Add />}
                  onClick={handleIrParaCadastrarProduto}
                  sx={{ textTransform: "none" }}
                >
                  Cadastrar novo produto
                </Button>
              </Box>
              <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: "12px" }}>PRODUTO</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: "12px" }}>QUANTIDADE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: "12px" }}>PREÇO UNIT.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: "12px" }}>SUBTOTAL</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, fontSize: "12px" }}>AÇÕES</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itensCompra.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          Nenhum item adicionado. Selecione o fornecedor, escolha um produto acima e clique em Adicionar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      itensCompra.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {item.produto?.nome ?? "—"} {item.produto?.sku ? `(${item.produto.sku})` : ""}
                          </TableCell>
                          <TableCell align="center">{item.quantidade}</TableCell>
                          <TableCell align="right">
                            R$ {(item.precoUnitario || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="right">
                            R$ {((item.quantidade || 0) * (item.precoUnitario || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleRemoverItem(idx)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                Valor total: R$ {valorTotalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Typography>

              <Grid container spacing={2.5} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observações"
                    name="observacoes"
                    multiline
                    rows={3}
                    value={currentCompra.observacoes}
                    onChange={handleChange}
                    placeholder="Informações adicionais..."
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 2,
                  pb: 2,
                  flexShrink: 0,
                }}
              >
                <Button
                  type="button"
                  onClick={handleCloseDialog}
                  sx={{ textTransform: "none", color: "text.secondary" }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" sx={{ textTransform: "none", px: 4 }}>
                  {compraIdEdit ? "Salvar alterações" : "Salvar Compra"}
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      <Dialog
        open={openConfirmDelete}
        onClose={fecharConfirmDelete}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, bgcolor: "background.paper" } }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}>
          <Delete /> Excluir compra
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Excluir a compra de <strong>{compraParaExcluir ? (nomeFornecedor(compraParaExcluir) || "este fornecedor") : "este fornecedor"}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={fecharConfirmDelete} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => compraParaExcluir && handleDelete(compraParaExcluir)}
            sx={{ textTransform: "none" }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openValidacaoModal}
        onClose={() => setOpenValidacaoModal(false)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Campos obrigatórios</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.primary", fontSize: "14px" }}>
            {mensagemValidacao}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenValidacaoModal(false)}
            sx={{ textTransform: "none", minWidth: 100 }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Compras;
