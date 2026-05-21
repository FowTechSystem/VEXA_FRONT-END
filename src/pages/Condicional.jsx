// src/pages/Condicional.jsx
// Condicional: reserva produto do estoque e conta como venda.
// Ao devolver: produto volta ao estoque e valor é removido dos cálculos de venda.
// Layout padronizado com o PDV (Caixa.jsx) — fullscreen, grid, sem boxes/container.
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Tooltip,
  Avatar,
  List,
  ListItemButton,
  ListItemText,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Add,
  Remove,
  Delete,
  Search,
  Person,
  PersonSearch,
  ShoppingCart,
  AssignmentReturn,
  CheckCircle,
  History,
  Close,
} from "@mui/icons-material";
import { showSuccess, showError } from "../utils/notifications";
import { produtosService } from "../api/produtosService";
import { clientesService } from "../api/clientesService";
import { condicionalService } from "../api/condicionalService";
import { authService } from "../api/authService";

const fmtBRL = (v) => `R$ ${(Number(v) || 0).toFixed(2)}`;

// ─── Helper: Summary card (sidebar) ─────────────────────────────────────────
function SummaryCard({ label, value, highlight, isDark }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: highlight ? "2px solid" : "1px solid",
        borderColor: highlight ? "primary.main" : "divider",
        bgcolor: "background.paper",
        background: highlight
          ? (theme) => alpha(theme.palette.primary.main, 0.08)
          : undefined,
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        minHeight: 64,
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: "text.secondary",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: highlight ? 22 : 18,
          color: highlight ? "primary.main" : "text.primary",
          lineHeight: 1.1,
          mt: 0.25,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function Condicional() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const produtoSearchRef = useRef(null);

  // ─── Estado ────────────────────────────────────────────────────────────────
  const [tabAtual, setTabAtual] = useState(0); // 0 = Novo, 1 = Pendentes
  const [carrinho, setCarrinho] = useState([]);
  const [searchProduto, setSearchProduto] = useState("");
  const [listaProdutos, setListaProdutos] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [itemSelecionadoId, setItemSelecionadoId] = useState(null);

  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [openDialogCliente, setOpenDialogCliente] = useState(false);
  const [searchClienteBusca, setSearchClienteBusca] = useState("");
  const [clientesBusca, setClientesBusca] = useState([]);
  const [carregandoClientesBusca, setCarregandoClientesBusca] = useState(false);

  const [condicionaisPendentes, setCondicionaisPendentes] = useState([]);
  const [carregandoPendentes, setCarregandoPendentes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [devolvendo, setDevolvendo] = useState(null);

  const [openConfirmDevolver, setOpenConfirmDevolver] = useState(false);
  const [condicionalParaDevolver, setCondicionalParaDevolver] = useState(null);

  // ─── Vendedor ──────────────────────────────────────────────────────────────
  const vendedor = useMemo(() => {
    try {
      const u = authService.getUsuario();
      const nome = u?.nome ?? u?.Nome ?? u?.name ?? "";
      if (nome && String(nome).trim()) return String(nome).trim();
      const email = u?.email ?? u?.Email ?? "";
      return String(email).split("@")[0] || "Vendedor";
    } catch {
      return "Vendedor";
    }
  }, []);
  const vendedorInicial = (vendedor || "?").charAt(0).toUpperCase();

  // ─── Ticket colors (same pattern as Caixa) ────────────────────────────────
  const ticket = useMemo(() => {
    if (isDark) {
      return {
        bg: theme.palette.background.paper,
        text: "#e0e0e0",
        muted: "#90a4ae",
        border: alpha("#fff", 0.08),
        headerBg: alpha(theme.palette.primary.main, 0.08),
        theadBg: alpha("#fff", 0.04),
        rowStripe: alpha("#fff", 0.02),
        rowBorder: alpha("#fff", 0.06),
        emptyBg: alpha("#fff", 0.02),
        emptyIcon: alpha("#fff", 0.15),
        qtyBtnBg: alpha("#fff", 0.08),
        qtyBtnHover: alpha("#fff", 0.16),
        addBtn: theme.palette.primary.main,
        addBtnHover: theme.palette.primary.dark,
      };
    }
    return {
      bg: theme.palette.background.paper,
      text: "#1a1a1a",
      muted: "#546e7a",
      border: "#cfd8dc",
      headerBg: "#e3f2fd",
      theadBg: "#f5f5f5",
      rowStripe: "rgba(0,0,0,0.02)",
      rowBorder: "rgba(0,0,0,0.06)",
      emptyBg: "#fafafa",
      emptyIcon: "#b0bec5",
      qtyBtnBg: "#eceff1",
      qtyBtnHover: "#cfd8dc",
      addBtn: "#1976d2",
      addBtnHover: "#1565c0",
    };
  }, [isDark, theme]);

  // ─── Filtro de produtos ────────────────────────────────────────────────────
  const produtosFiltrados = useMemo(() => {
    return listaProdutos.filter((p) => {
      const termo = (searchProduto || "").trim().toLowerCase();
      if (!termo) return true;
      const nome = (p.nome || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const codigo = String(p.id || "").toLowerCase();
      return (
        nome.includes(termo) || sku.includes(termo) || codigo.includes(termo)
      );
    });
  }, [listaProdutos, searchProduto]);

  const produtosPreview = useMemo(() => {
    const termo = (searchProduto || "").trim();
    const list = termo ? produtosFiltrados : listaProdutos;
    return list.slice(0, 8);
  }, [listaProdutos, produtosFiltrados, searchProduto]);

  const calcularTotal = () =>
    carrinho.reduce((acc, item) => acc + item.precoVenda * item.quantidade, 0);

  const podeSalvar = () => clienteSelecionado && carrinho.length > 0;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAdicionarAoCarrinho = (produto) => {
    const precoVenda =
      Number(produto.precoVenda ?? produto.precoCusto ?? 0) || 0;
    const tipo = produto.tipo ?? "normal";
    const item = {
      id: produto.id,
      produtoId: produto.id,
      bazarProdutoId: tipo === "bazar" ? produto.id : null,
      tipo,
      nome: produto.nome || "Produto",
      sku:
        produto.sku != null && String(produto.sku).trim() !== ""
          ? String(produto.sku)
          : null,
      precoVenda,
      quantidade: 1,
      consignanteNome: produto.consignanteNome ?? null,
    };
    const jaNoCarrinho = carrinho.find((c) => c.id === produto.id);
    if (jaNoCarrinho) {
      handleAlterarQuantidade(produto.id, jaNoCarrinho.quantidade + 1);
    } else {
      setCarrinho([...carrinho, item]);
    }
  };

  const handleRemoverProduto = (id) => {
    setCarrinho(carrinho.filter((item) => item.id !== id));
    if (itemSelecionadoId === id) setItemSelecionadoId(null);
  };

  const handleAlterarQuantidade = (id, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      handleRemoverProduto(id);
      return;
    }
    setCarrinho(
      carrinho.map((item) =>
        item.id === id ? { ...item, quantidade: novaQuantidade } : item,
      ),
    );
  };

  const salvarCondicional = async () => {
    if (!podeSalvar()) return;
    setSalvando(true);
    try {
      const total = calcularTotal();
      const payload = {
        clienteId: Number(clienteSelecionado.id),
        itens: carrinho.map((item) => ({
          produtoId: Number(item.id),
          tipo: item.tipo ?? "normal",
          quantidade: Number(item.quantidade) || 1,
          precoUnitario: Number(item.precoVenda) || 0,
        })),
        valorTotal: Number(total.toFixed(2)),
      };
      const criado = await condicionalService.criar(payload);
      const cond = {
        id: criado?.id ?? criado?.Id ?? Date.now(),
        data:
          criado?.data ??
          criado?.Data ??
          criado?.dataCriacao ??
          new Date().toISOString(),
        clienteNome: clienteSelecionado.nome,
        clienteId: clienteSelecionado.id,
        valorTotal: total,
        itens: carrinho.length,
        status: "pendente",
      };
      setCondicionaisPendentes((prev) => [cond, ...prev]);
      setCarrinho([]);
      setClienteSelecionado(null);
      setItemSelecionadoId(null);
      showSuccess(
        "Condicional registrado! Produto reservado do estoque e contabilizado como venda.",
      );
      setTabAtual(1);
    } catch (err) {
      const data = err?.response?.data;
      const status = err?.response?.status;
      let msg =
        data?.mensagem ??
        data?.message ??
        data?.Message ??
        data?.detail ??
        data?.Detail ??
        data?.title ??
        data?.Title;
      if (!msg && data?.errors) {
        const errs =
          typeof data.errors === "object"
            ? Object.values(data.errors).flat().filter(Boolean)
            : Array.isArray(data.errors)
              ? data.errors
              : [];
        msg = errs[0] || null;
      }
      if (!msg) {
        msg =
          status === 404
            ? "Endpoint /api/condicional não encontrado. Implemente no backend."
            : status === 400
              ? "Requisição inválida (400). Verifique o formato do payload."
              : "Erro ao registrar condicional.";
      }
      console.error("Condicional create error:", status, data);
      showError(
        typeof msg === "string" ? msg : "Erro ao registrar condicional.",
      );
    } finally {
      setSalvando(false);
    }
  };

  const abrirConfirmDevolver = (cond) => {
    setCondicionalParaDevolver(cond);
    setOpenConfirmDevolver(true);
  };
  const fecharConfirmDevolver = () => {
    setOpenConfirmDevolver(false);
    setCondicionalParaDevolver(null);
  };

  const handleDevolver = async (cond) => {
    fecharConfirmDevolver();
    setDevolvendo(cond.id);
    try {
      await condicionalService.devolver(cond.id);
      setCondicionaisPendentes((prev) => prev.filter((c) => c.id !== cond.id));
      showSuccess(
        "Condicional devolvido. Produtos voltaram ao estoque e valor removido das vendas.",
      );
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.mensagem ?? data?.message ?? "Erro ao devolver condicional.";
      showError(msg);
    } finally {
      setDevolvendo(null);
    }
  };

  // ─── Efeitos ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function carregarProdutos() {
      setCarregandoProdutos(true);
      try {
        const data = await produtosService.getAll();
        if (!cancelled) {
          const prods = Array.isArray(data)
            ? data
            : (data?.produtos ?? data?.items ?? []);
          setListaProdutos(Array.isArray(prods) ? prods : []);
        }
      } catch {
        if (!cancelled) {
          showError("Erro ao carregar produtos.");
          setListaProdutos([]);
        }
      } finally {
        if (!cancelled) setCarregandoProdutos(false);
      }
    }
    carregarProdutos();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tabAtual !== 1) return;
    let cancelled = false;
    setCarregandoPendentes(true);
    condicionalService
      .listar({ pendente: true, tamanho: 100 })
      .then((data) => {
        if (cancelled) return;
        const list =
          data?.condicionais ??
          data?.Condicionais ??
          data?.items ??
          (Array.isArray(data) ? data : []);
        const norm = (Array.isArray(list) ? list : []).map((c) => ({
          id: c.id ?? c.Id,
          data: c.data ?? c.Data ?? c.dataCriacao ?? "",
          clienteNome:
            c.clienteNome ??
            c.ClienteNome ??
            c.cliente?.nomeCompleto ??
            "Cliente",
          clienteId: c.clienteId ?? c.ClienteId,
          valorTotal: Number(c.valorTotal ?? c.ValorTotal ?? 0) || 0,
          itens: c.itens?.length ?? c.Itens?.length ?? 0,
          status: "pendente",
        }));
        setCondicionaisPendentes(norm);
      })
      .catch(() => {
        if (!cancelled) setCondicionaisPendentes([]);
      })
      .finally(() => {
        if (!cancelled) setCarregandoPendentes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tabAtual]);

  useEffect(() => {
    if (!openDialogCliente) return;
    let cancelled = false;
    const t = setTimeout(
      async () => {
        setCarregandoClientesBusca(true);
        try {
          let data;
          if (searchClienteBusca.trim()) {
            data = await clientesService.listarPaginado({
              filtro: "nome",
              valor: searchClienteBusca.trim(),
              pagina: 1,
              tamanho: 50,
            });
          } else {
            data = await clientesService.getAll({ pagina: 1, tamanho: 100 });
          }
          if (cancelled) return;
          const list =
            data?.clientes ??
            data?.Clientes ??
            (Array.isArray(data) ? data : (data?.items ?? []));
          setClientesBusca(Array.isArray(list) ? list : []);
        } catch {
          if (!cancelled) setClientesBusca([]);
        } finally {
          if (!cancelled) setCarregandoClientesBusca(false);
        }
      },
      searchClienteBusca.trim() ? 400 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [openDialogCliente, searchClienteBusca]);

  const selecionarCliente = (cliente) => {
    setClienteSelecionado({
      id: cliente.id ?? cliente.Id,
      nome:
        cliente.nomeCompleto ??
        cliente.NomeCompleto ??
        cliente.nome ??
        "Cliente",
    });
    setOpenDialogCliente(false);
    setSearchClienteBusca("");
    setClientesBusca([]);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: "calc(100dvh - 64px)",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        color: "text.primary",
        overflow: "hidden",
      }}
    >
      {/* ═══ Header ═══ */}
      <Box
        sx={{
          px: { xs: 1.5, md: 2.5 },
          py: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AssignmentReturn sx={{ fontSize: 26, color: "primary.main" }} />
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Condicional
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Reserva de produtos com devolução
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${carrinho.length} ${carrinho.length === 1 ? "item" : "itens"}`}
          color={carrinho.length > 0 ? "primary" : "default"}
          sx={{ fontWeight: 800, height: 28 }}
        />
      </Box>

      {/* ═══ Tabs ═══ */}
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          px: { xs: 1, md: 2 },
        }}
      >
        <Tabs
          value={tabAtual}
          onChange={(_, v) => setTabAtual(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: 14,
              minHeight: 44,
              px: 2.5,
            },
            "& .Mui-selected": { fontWeight: 800 },
          }}
        >
          <Tab label="Novo Condicional" />
          <Tab label="Pendentes" />
        </Tabs>
      </Box>

      {/* ═══ Conteúdo ═══ */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {tabAtual === 0 ? (
          /* ════════════════════════════════════════════════════════
             TAB: NOVO CONDICIONAL
             ════════════════════════════════════════════════════════ */
          <Grid
            container
            spacing={1.5}
            sx={{ flex: 1, minHeight: 0, p: { xs: 1, md: 1.5 }, m: 0 }}
          >
            {/* ── Coluna principal (9/12) ── */}
            <Grid
              size={{ xs: 12, lg: 9 }}
              sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              {/* Linha campos: Vendedor + Produto + Cliente */}
              <Grid container spacing={1.25} sx={{ mb: 1.25 }}>
                <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Vendedor"
                    value={vendedor}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Tooltip title={vendedor}>
                            <Avatar
                              sx={{
                                width: 26,
                                height: 26,
                                fontSize: 12,
                                fontWeight: 800,
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  isDark ? 0.32 : 0.18,
                                ),
                                color: isDark
                                  ? "primary.light"
                                  : "primary.dark",
                              }}
                            >
                              {vendedorInicial}
                            </Avatar>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "background.paper",
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Produto"
                    placeholder="Buscar por nome ou SKU…"
                    value={searchProduto}
                    onChange={(e) => setSearchProduto(e.target.value)}
                    inputRef={produtoSearchRef}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: searchProduto ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setSearchProduto("")}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cliente"
                    required
                    placeholder="Clique para selecionar"
                    value={clienteSelecionado ? clienteSelecionado.nome : ""}
                    onClick={() => setOpenDialogCliente(true)}
                    inputProps={{ readOnly: true, sx: { cursor: "pointer" } }}
                    error={!clienteSelecionado && carrinho.length > 0}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person
                            sx={{ color: "text.secondary", fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: clienteSelecionado ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setClienteSelecionado(null);
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                </Grid>
              </Grid>

              {/* Preview de produtos (quando digitando) */}
              {(searchProduto || "").trim() && produtosPreview.length > 0 ? (
                <Paper variant="outlined" sx={{ mb: 1.25, overflow: "hidden" }}>
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      bgcolor: ticket.headerBg,
                      borderBottom: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "text.secondary",
                        textTransform: "uppercase",
                      }}
                    >
                      {carregandoProdutos
                        ? "Carregando…"
                        : "Resultados — clique para adicionar"}
                    </Typography>
                  </Box>
                  <Stack divider={<Divider />}>
                    {produtosPreview.map((produto) => {
                      const preco =
                        Number(produto.precoVenda ?? produto.precoCusto ?? 0) ||
                        0;
                      return (
                        <Box
                          key={produto.id}
                          onClick={() => {
                            handleAdicionarAoCarrinho(produto);
                            setSearchProduto("");
                            produtoSearchRef.current?.focus();
                          }}
                          sx={{
                            px: 1.5,
                            py: 1,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: 13 }}>
                              {produto.nome || "Produto"}
                            </Typography>
                            <Typography
                              sx={{ fontSize: 11, color: "text.secondary" }}
                            >
                              {produto.sku
                                ? `SKU: ${produto.sku}`
                                : `#${produto.id}`}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 800,
                                fontSize: 13,
                                color: isDark ? "primary.main" : "text.primary",
                              }}
                            >
                              {fmtBRL(preco)}
                            </Typography>
                            <Add
                              sx={{
                                fontSize: 18,
                                color: isDark ? "primary.main" : "primary.dark",
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              ) : null}

              {/* Tabela de itens */}
              <Paper
                variant="outlined"
                sx={{
                  flex: 1,
                  minHeight: 240,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  bgcolor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    px: 1.5,
                    py: 1,
                    bgcolor: ticket.headerBg,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: 13,
                      color: isDark ? "primary.light" : "#1565c0",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Itens do condicional
                  </Typography>
                  {carrinho.length > 0 && (
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "text.secondary",
                      }}
                    >
                      {carrinho.length}{" "}
                      {carrinho.length === 1 ? "item" : "itens"}
                    </Typography>
                  )}
                </Box>

                <TableContainer sx={{ flex: 1, minHeight: 0 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow
                        sx={{
                          "& th": {
                            bgcolor: ticket.theadBg,
                            color: ticket.text,
                            fontWeight: 700,
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          },
                        }}
                      >
                        <TableCell width={48} align="center"></TableCell>
                        <TableCell width={100}>Código</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell align="center" width={120}>
                          Qtd.
                        </TableCell>
                        <TableCell align="right" width={96}>
                          P. Unit.
                        </TableCell>
                        <TableCell align="right" width={108}>
                          Subtotal
                        </TableCell>
                        <TableCell align="center" width={64}>
                          Vend.
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {carrinho.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ borderBottom: "none" }}>
                            <Box
                              sx={{
                                py: 4,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 1,
                                color: "text.secondary",
                              }}
                            >
                              <ShoppingCart
                                sx={{ fontSize: 56, color: ticket.emptyIcon }}
                              />
                              <Typography
                                sx={{ fontWeight: 700, color: ticket.text }}
                              >
                                Nenhum item ainda
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ textAlign: "center", maxWidth: 360 }}
                              >
                                Use a busca acima para encontrar e adicionar
                                produtos.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        carrinho.map((item) => {
                          const codigo = item.sku || `#${item.id}`;
                          const totalLinha = item.precoVenda * item.quantidade;
                          const selecionada = itemSelecionadoId === item.id;
                          return (
                            <TableRow
                              key={item.id}
                              hover
                              onClick={() => setItemSelecionadoId(item.id)}
                              sx={{
                                cursor: "pointer",
                                "&:nth-of-type(even) td": {
                                  bgcolor: ticket.rowStripe,
                                },
                                "& td": {
                                  borderColor: ticket.rowBorder,
                                  color: ticket.text,
                                  transition: "background-color 0.2s",
                                },
                                ...(selecionada
                                  ? {
                                      "& td": {
                                        borderColor: ticket.rowBorder,
                                        bgcolor:
                                          alpha(
                                            theme.palette.primary.main,
                                            0.12,
                                          ) + " !important",
                                      },
                                      outline: `2px solid ${theme.palette.primary.main}`,
                                      outlineOffset: "-2px",
                                    }
                                  : {}),
                              }}
                            >
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoverProduto(item.id);
                                  }}
                                  sx={{ color: "error.main" }}
                                  aria-label="Remover"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily: "monospace",
                                  fontSize: 12,
                                  color: "text.secondary",
                                }}
                              >
                                {codigo}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0.5,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.75,
                                    }}
                                  >
                                    <Typography>{item.nome}</Typography>
                                    {item.tipo === "bazar" && (
                                      <Chip
                                        label="BAZAR"
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: 10,
                                          fontWeight: 700,
                                          bgcolor: "warning.main",
                                          color: "warning.contrastText",
                                        }}
                                      />
                                    )}
                                  </Box>
                                  {item.consignanteNome && (
                                    <Typography
                                      variant="caption"
                                      sx={{ color: "text.secondary" }}
                                    >
                                      Consignante: {item.consignanteNome}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Box
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 0.25,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleAlterarQuantidade(
                                        item.id,
                                        item.quantidade - 1,
                                      )
                                    }
                                    sx={{
                                      bgcolor: ticket.qtyBtnBg,
                                      color: ticket.text,
                                      "&:hover": {
                                        bgcolor: ticket.qtyBtnHover,
                                      },
                                    }}
                                    aria-label="Diminuir"
                                  >
                                    <Remove fontSize="inherit" />
                                  </IconButton>
                                  <Typography
                                    component="span"
                                    sx={{
                                      minWidth: 28,
                                      textAlign: "center",
                                      fontWeight: 800,
                                      color: ticket.text,
                                    }}
                                  >
                                    {item.quantidade}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleAlterarQuantidade(
                                        item.id,
                                        item.quantidade + 1,
                                      )
                                    }
                                    sx={{
                                      bgcolor: ticket.addBtn,
                                      color: isDark
                                        ? theme.palette.primary.contrastText
                                        : "#fff",
                                      "&:hover": {
                                        bgcolor: ticket.addBtnHover,
                                      },
                                    }}
                                    aria-label="Aumentar"
                                  >
                                    <Add fontSize="inherit" />
                                  </IconButton>
                                </Box>
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{ whiteSpace: "nowrap" }}
                              >
                                {fmtBRL(item.precoVenda)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontWeight: 800,
                                  whiteSpace: "nowrap",
                                  color: "primary.main",
                                }}
                              >
                                {fmtBRL(totalLinha)}
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title={vendedor}>
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      fontSize: 12,
                                      fontWeight: 800,
                                      bgcolor: alpha(
                                        theme.palette.primary.main,
                                        isDark ? 0.32 : 0.18,
                                      ),
                                      color: isDark
                                        ? "primary.light"
                                        : "primary.dark",
                                      mx: "auto",
                                    }}
                                  >
                                    {vendedorInicial}
                                  </Avatar>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* ── Sidebar direita (3/12) ── */}
            <Grid
              size={{ xs: 12, lg: 3 }}
              sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0 }}>
                <SummaryCard
                  label="Cliente"
                  value={clienteSelecionado?.nome || "—"}
                  isDark={isDark}
                />
                <SummaryCard
                  label="Itens"
                  value={String(carrinho.length)}
                  isDark={isDark}
                />
                <SummaryCard
                  label="Total"
                  value={fmtBRL(calcularTotal())}
                  highlight
                  isDark={isDark}
                />

                <Box sx={{ flex: 1 }} />

                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, bgcolor: "background.paper" }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      mb: 1,
                    }}
                  >
                    Informação
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "text.secondary",
                      lineHeight: 1.6,
                    }}
                  >
                    Produtos serão reservados do estoque e contabilizados como
                    venda. Ao devolver, voltam ao estoque.
                  </Typography>
                </Paper>

                <Button
                  variant="contained"
                  fullWidth
                  disabled={!podeSalvar() || salvando}
                  onClick={salvarCondicional}
                  startIcon={<CheckCircle />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    py: 1.5,
                    fontSize: 15,
                  }}
                >
                  {salvando ? "Registrando…" : "Registrar Condicional"}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        ) : (
          /* ════════════════════════════════════════════════════════
             TAB: PENDENTES
             ════════════════════════════════════════════════════════ */
          <Box sx={{ flex: 1, p: { xs: 1, md: 1.5 }, overflow: "auto" }}>
            <Paper
              variant="outlined"
              sx={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                bgcolor: "background.paper",
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  bgcolor: ticket.headerBg,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 13,
                    color: isDark ? "primary.light" : "#1565c0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Condicionais pendentes
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "text.secondary",
                  }}
                >
                  Ao devolver, produtos voltam ao estoque e valor é removido das
                  vendas
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          bgcolor: ticket.theadBg,
                          color: ticket.text,
                          fontWeight: 700,
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        },
                      }}
                    >
                      <TableCell>Data</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="center">Itens</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell align="center" width={140}>
                        Ações
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carregandoPendentes ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ borderBottom: "none" }}>
                          <Typography
                            sx={{
                              py: 4,
                              textAlign: "center",
                              color: "text.secondary",
                            }}
                          >
                            Carregando…
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : condicionaisPendentes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ borderBottom: "none" }}>
                          <Box
                            sx={{
                              py: 4,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <History
                              sx={{ fontSize: 56, color: ticket.emptyIcon }}
                            />
                            <Typography
                              sx={{ fontWeight: 700, color: ticket.text }}
                            >
                              Nenhum condicional pendente
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      condicionaisPendentes.map((c) => (
                        <TableRow
                          key={c.id}
                          hover
                          sx={{
                            "&:nth-of-type(even) td": {
                              bgcolor: ticket.rowStripe,
                            },
                            "& td": {
                              borderColor: ticket.rowBorder,
                              color: ticket.text,
                            },
                          }}
                        >
                          <TableCell>
                            {c.data
                              ? new Date(c.data).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {c.clienteNome ?? "—"}
                          </TableCell>
                          <TableCell align="center">{c.itens ?? 0}</TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 800, color: "primary.main" }}
                          >
                            {fmtBRL(c.valorTotal)}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              startIcon={<AssignmentReturn />}
                              disabled={devolvendo === c.id}
                              onClick={() => abrirConfirmDevolver(c)}
                              sx={{ textTransform: "none", fontWeight: 700 }}
                            >
                              {devolvendo === c.id ? "Devolvendo…" : "Devolver"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        )}
      </Box>

      {/* ═══ Dialog: Selecionar Cliente ═══ */}
      <Dialog
        open={openDialogCliente}
        onClose={() => setOpenDialogCliente(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonSearch /> Selecionar cliente
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nome…"
            value={searchClienteBusca}
            onChange={(e) => setSearchClienteBusca(e.target.value)}
            autoFocus
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
            {carregandoClientesBusca ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 3, textAlign: "center" }}
              >
                Carregando…
              </Typography>
            ) : clientesBusca.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 3, textAlign: "center" }}
              >
                {searchClienteBusca.trim()
                  ? "Nenhum cliente encontrado."
                  : "Digite para buscar."}
              </Typography>
            ) : (
              <List dense>
                {clientesBusca.map((c) => {
                  const nome =
                    c.nomeCompleto ??
                    c.NomeCompleto ??
                    c.nome ??
                    `Cliente #${c.id ?? c.Id}`;
                  return (
                    <ListItemButton
                      key={c.id ?? c.Id}
                      onClick={() => selecionarCliente(c)}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        mb: 1,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <ListItemText
                        primary={nome}
                        secondary={
                          c.cpf ? `CPF: ${c.cpf}` : `ID: ${c.id ?? c.Id}`
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setOpenDialogCliente(false)}
            sx={{ textTransform: "none" }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Dialog: Confirmar Devolução ═══ */}
      <Dialog
        open={openConfirmDevolver}
        onClose={fecharConfirmDevolver}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, bgcolor: "background.paper", p: 1 },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            color: "text.primary",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AssignmentReturn /> Devolver condicional
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Devolver condicional para{" "}
            <strong>{condicionalParaDevolver?.clienteNome ?? "cliente"}</strong>
            ?
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            Os produtos voltarão ao estoque e o valor será removido das vendas.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={fecharConfirmDevolver}
            sx={{ textTransform: "none" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              condicionalParaDevolver && handleDevolver(condicionalParaDevolver)
            }
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Condicional;
