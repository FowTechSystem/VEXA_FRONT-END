import React, { useState, useEffect, useMemo } from "react";
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
  Alert,
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
  useTheme,
  Slide,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { showSuccess, showError } from "../utils/notifications";
import { produtosService } from "../api/produtosService";
import { vendasService } from "../api/vendasService";
import { clientesService } from "../api/clientesService";
import { useInAppNotifications } from "../contexts/InAppNotificationContext";
import {
  ShoppingCart,
  Search,
  Delete,
  Add,
  Remove,
  AttachMoney,
  CreditCard,
  Pix,
  CheckCircle,
  QrCodeScanner,
  Person,
  PersonSearch,
  Close,
} from "@mui/icons-material";

const CatalogoProdutosTransition = React.forwardRef(function CatalogoProdutosTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const FORMAS_PAGAMENTO = [
  { id: "dinheiro", label: "Dinheiro", icon: <AttachMoney /> },
  { id: "credito", label: "Crédito", icon: <CreditCard /> },
  { id: "debito", label: "Débito", icon: <CreditCard /> },
  { id: "pix", label: "PIX", icon: <Pix /> },
];

function Caixa() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { emitirSeNovaMovimentacao } = useInAppNotifications();

  const [carrinho, setCarrinho] = useState([]);
  const [searchProduto, setSearchProduto] = useState("");
  const [listaProdutos, setListaProdutos] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [desconto, setDesconto] = useState("");

  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [openDialogCliente, setOpenDialogCliente] = useState(false);
  const [openCatalogoProdutos, setOpenCatalogoProdutos] = useState(false);
  const [searchClienteBusca, setSearchClienteBusca] = useState("");
  const [clientesBusca, setClientesBusca] = useState([]);
  const [carregandoClientesBusca, setCarregandoClientesBusca] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function carregarProdutos() {
      setCarregandoProdutos(true);
      try {
        const data = await produtosService.getAll();
        if (!cancelled) {
          const prods = Array.isArray(data) ? data : data?.produtos ?? data?.items ?? [];
          setListaProdutos(Array.isArray(prods) ? prods : []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Erro ao carregar produtos:", err);
          showError("Erro ao carregar produtos. Verifique a conexão com o servidor.");
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

  const produtosFiltrados = useMemo(() => {
    return listaProdutos.filter((p) => {
      const termo = (searchProduto || "").trim().toLowerCase();
      if (!termo) return true;
      const nome = (p.nome || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const codigo = String(p.id || "").toLowerCase();
      return nome.includes(termo) || sku.includes(termo) || codigo.includes(termo);
    });
  }, [listaProdutos, searchProduto]);

  const handleAdicionarAoCarrinho = (produto) => {
    const precoVenda = Number(produto.precoVenda ?? produto.precoCusto ?? 0) || 0;
    const item = {
      id: produto.id,
      nome: produto.nome || "Produto",
      sku: produto.sku != null && String(produto.sku).trim() !== "" ? String(produto.sku) : null,
      precoVenda,
      quantidade: 1,
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
  };

  const handleAlterarQuantidade = (id, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      handleRemoverProduto(id);
      return;
    }
    setCarrinho(
      carrinho.map((item) => (item.id === id ? { ...item, quantidade: novaQuantidade } : item)),
    );
  };

  const calcularSubtotal = () =>
    carrinho.reduce((acc, item) => acc + item.precoVenda * item.quantidade, 0);

  const calcularTotal = () => calcularSubtotal() - (Number(String(desconto).replace(",", ".")) || 0);

  const calcularTroco = () => {
    if (formaPagamento === "dinheiro" && valorRecebido) {
      const vr = parseFloat(String(valorRecebido).replace(",", "."));
      if (!Number.isFinite(vr)) return -1;
      return vr - calcularTotal();
    }
    return 0;
  };

  const podeFinalizarVenda = () => {
    if (carrinho.length === 0) return false;
    if (!formaPagamento) return false;
    if (formaPagamento === "dinheiro") {
      const vr = parseFloat(String(valorRecebido).replace(",", "."));
      if (!Number.isFinite(vr) || vr <= 0) return false;
      return calcularTroco() >= 0;
    }
    return true;
  };

  const finalizarVenda = async () => {
    if (!podeFinalizarVenda()) return;
    const total = calcularTotal();
    const descontoVal = Math.max(0, Number(String(desconto).replace(",", ".")) || 0);
    const nomeClienteVenda = clienteSelecionado?.nome;
    const payload = {
      itens: carrinho.map((item) => ({
        produtoId: Number(item.id),
        quantidade: Number(item.quantidade) || 1,
        precoUnitario: Number(item.precoVenda) || 0,
      })),
      valorTotal: Number(total.toFixed(2)),
      formaPagamento: String(formaPagamento || "credito"),
      desconto: descontoVal ?? 0,
      ...(clienteSelecionado?.id != null ? { clienteId: Number(clienteSelecionado.id) } : {}),
    };
    try {
      const criada = await vendasService.create(payload);
      const vid = criada?.id ?? criada?.Id;
      emitirSeNovaMovimentacao({
        tipo: "venda",
        vendaId: vid,
        id: vid,
        valor: total,
        descricao: nomeClienteVenda ? `Venda — ${nomeClienteVenda}` : "Venda no caixa",
        data: new Date().toISOString(),
      });
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.mensagem ??
        data?.message ??
        (Array.isArray(data?.errors) ? data.errors.flat().find(Boolean) : null) ??
        data?.title ??
        "Erro ao registrar venda. Verifique os dados e tente novamente.";
      console.error("Erro ao registrar venda:", data ?? err);
      showError(typeof msg === "string" ? msg : "Erro ao registrar venda. Tente novamente ou contate o suporte.");
      return;
    }
    setCarrinho([]);
    setDesconto("");
    setValorRecebido("");
    setFormaPagamento("");
    setClienteSelecionado(null);
    showSuccess("Venda realizada com sucesso!");
  };

  const cancelarVenda = () => {
    if (window.confirm("Deseja limpar a venda atual? Os itens serão removidos.")) {
      setCarrinho([]);
      setDesconto("");
      setValorRecebido("");
      setFormaPagamento("");
      setClienteSelecionado(null);
    }
  };

  const abrirDialogCliente = () => {
    if (clienteSelecionado) setSearchClienteBusca("");
    setOpenDialogCliente(true);
  };

  const fecharDialogCliente = () => {
    setOpenDialogCliente(false);
    setSearchClienteBusca("");
    setClientesBusca([]);
  };

  const abrirCatalogoProdutos = () => setOpenCatalogoProdutos(true);
  const fecharCatalogoProdutos = () => setOpenCatalogoProdutos(false);

  useEffect(() => {
    if (!openDialogCliente) return;
    let cancelled = false;
    const delay = searchClienteBusca.trim() ? 400 : 0;
    const t = setTimeout(async () => {
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
        const list = data?.clientes ?? data?.Clientes ?? (Array.isArray(data) ? data : data?.items ?? []);
        setClientesBusca(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setClientesBusca([]);
      } finally {
        if (!cancelled) setCarregandoClientesBusca(false);
      }
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [openDialogCliente, searchClienteBusca]);

  const selecionarCliente = (cliente) => {
    setClienteSelecionado({
      id: cliente.id ?? cliente.Id,
      nome: cliente.nomeCompleto ?? cliente.NomeCompleto ?? cliente.nome ?? cliente.Nome ?? "Cliente",
    });
    setSearchClienteBusca("");
    fecharDialogCliente();
  };

  const ticket = useMemo(() => {
    if (isDark) {
      const t = theme;
      return {
        bg: t.palette.background.paper,
        text: t.palette.text.primary,
        muted: t.palette.text.secondary,
        border: t.palette.divider,
        headerBg: alpha(t.palette.primary.main, 0.14),
        theadBg: alpha(t.palette.common.white, 0.06),
        rowStripe: alpha(t.palette.common.white, 0.04),
        rowBorder: alpha(t.palette.common.white, 0.1),
        emptyBg: alpha(t.palette.common.white, 0.04),
        emptyIcon: alpha(t.palette.common.white, 0.28),
        totalsBg: alpha(t.palette.common.white, 0.05),
        totalsBorder: alpha(t.palette.primary.main, 0.55),
        paymentBg: alpha(t.palette.common.white, 0.05),
        clienteInputBg: alpha(t.palette.common.white, 0.08),
        qtyBtnBg: alpha(t.palette.common.white, 0.1),
        qtyBtnHover: alpha(t.palette.common.white, 0.16),
        addBtn: t.palette.primary.main,
        addBtnHover: t.palette.primary.dark,
        totalLabel: "primary.light",
        totalValue: "primary.main",
        formaIdleBg: alpha(t.palette.common.white, 0.07),
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
      totalsBg: "#fafafa",
      totalsBorder: "#1976d2",
      paymentBg: "#eef1f7",
      clienteInputBg: "#fafafa",
      qtyBtnBg: "#eceff1",
      qtyBtnHover: "#cfd8dc",
      addBtn: "#1976d2",
      addBtnHover: "#1565c0",
      totalLabel: "#1565c0",
      totalValue: "#0d47a1",
      formaIdleBg: theme.palette.background.paper,
    };
  }, [isDark, theme]);

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
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          bgcolor: "background.default",
          color: ticket.text,
        }}
      >
            <Box
              sx={{
                px: 2,
                py: 1.25,
                bgcolor: ticket.headerBg,
                borderBottom: "1px solid",
                borderColor: ticket.border,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
                flexShrink: 0,
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? "primary.light" : "#1565c0" }}>
                Itens da venda
              </Typography>
              <Chip
                size="small"
                label={`${carrinho.length} ${carrinho.length === 1 ? "item" : "itens"}`}
                sx={{
                  bgcolor: isDark ? "primary.main" : "#1976d2",
                  color: isDark ? "primary.contrastText" : "#fff",
                  fontWeight: 700,
                }}
              />
            </Box>

            <TableContainer
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: carrinho.length === 0 ? "hidden" : "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {carrinho.length === 0 ? (
                <>
                  <Table size="small" stickyHeader sx={{ flexShrink: 0, width: "100%" }}>
                    <TableHead>
                      <TableRow
                        sx={{
                          "& th": {
                            bgcolor: ticket.theadBg,
                            color: ticket.text,
                            fontWeight: 700,
                            fontSize: 12,
                          },
                        }}
                      >
                        <TableCell width={40}>#</TableCell>
                        <TableCell width={88}>Cód.</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell align="center" width={112}>
                          Qtd.
                        </TableCell>
                        <TableCell align="right" width={88}>
                          Unit.
                        </TableCell>
                        <TableCell align="right" width={88}>
                          Total
                        </TableCell>
                        <TableCell align="center" width={48} />
                      </TableRow>
                    </TableHead>
                  </Table>
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: { xs: 140, sm: 180 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      textAlign: "center",
                      px: 2,
                      py: 3,
                      bgcolor: ticket.emptyBg,
                    }}
                  >
                    <ShoppingCart sx={{ fontSize: 48, color: ticket.emptyIcon, mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, color: ticket.text }}>Nenhum item ainda</Typography>
                    <Typography variant="body2" sx={{ color: ticket.muted, mt: 0.5, maxWidth: 420 }}>
                      Use o campo abaixo e o botão Pesquisar para abrir o catálogo e adicionar produtos.
                    </Typography>
                  </Box>
                </>
              ) : (
                <Table size="small" stickyHeader sx={{ width: "100%" }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        "& th": {
                          bgcolor: ticket.theadBg,
                          color: ticket.text,
                          fontWeight: 700,
                          fontSize: 12,
                        },
                      }}
                    >
                      <TableCell width={40}>#</TableCell>
                      <TableCell width={88}>Cód.</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell align="center" width={112}>
                        Qtd.
                      </TableCell>
                      <TableCell align="right" width={88}>
                        Unit.
                      </TableCell>
                      <TableCell align="right" width={88}>
                        Total
                      </TableCell>
                      <TableCell align="center" width={48} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carrinho.map((item, index) => {
                      const linha = index + 1;
                      const codigo = item.sku || `#${item.id}`;
                      const totalLinha = item.precoVenda * item.quantidade;
                      return (
                        <TableRow
                          key={item.id}
                          hover
                          sx={{
                            "&:nth-of-type(even) td": { bgcolor: ticket.rowStripe },
                            "& td": { borderColor: ticket.rowBorder, color: ticket.text },
                          }}
                        >
                          <TableCell>{linha}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{codigo}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{item.nome}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.25 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleAlterarQuantidade(item.id, item.quantidade - 1)}
                                sx={{
                                  bgcolor: ticket.qtyBtnBg,
                                  color: ticket.text,
                                  "&:hover": { bgcolor: ticket.qtyBtnHover },
                                }}
                                aria-label="Diminuir"
                              >
                                <Remove fontSize="inherit" />
                              </IconButton>
                              <Typography component="span" sx={{ minWidth: 26, textAlign: "center", fontWeight: 800, color: ticket.text }}>
                                {item.quantidade}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleAlterarQuantidade(item.id, item.quantidade + 1)}
                                sx={{
                                  bgcolor: ticket.addBtn,
                                  color: isDark ? theme.palette.primary.contrastText : "#fff",
                                  "&:hover": { bgcolor: ticket.addBtnHover },
                                }}
                                aria-label="Aumentar"
                              >
                                <Add fontSize="inherit" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            R$ {item.precoVenda.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                            R$ {totalLinha.toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" onClick={() => handleRemoverProduto(item.id)} sx={{ color: "error.main" }} aria-label="Remover">
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TableContainer>

            {carrinho.length > 0 && (
              <Box sx={{ borderTop: "2px solid", borderColor: ticket.totalsBorder, bgcolor: ticket.totalsBg, px: 2, py: 1.5, flexShrink: 0 }}>
                <Stack spacing={1.25}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body2" sx={{ color: ticket.muted }}>
                      Subtotal
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: ticket.text }}>
                      R$ {calcularSubtotal().toFixed(2)}
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Desconto (R$)"
                    type="number"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: ticket.clienteInputBg } }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", pt: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: ticket.totalLabel }}>
                      Total
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: ticket.totalValue }}>
                      R$ {calcularTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}

            <Box
              sx={{
                px: 2,
                py: 1.25,
                borderTop: "1px solid",
                borderColor: ticket.border,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                bgcolor: "background.default",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: ticket.muted }}>
                Buscar produto
              </Typography>
              <TextField
                size="small"
                placeholder="Nome, SKU ou código…"
                value={searchProduto}
                onChange={(e) => setSearchProduto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") abrirCatalogoProdutos();
                }}
                sx={{
                  flex: "1 1 200px",
                  minWidth: 0,
                  "& .MuiOutlinedInput-root": { bgcolor: ticket.clienteInputBg },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: ticket.muted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" aria-label="Código de barras" edge="end">
                        <QrCodeScanner color="primary" sx={isDark ? { color: "primary.light" } : undefined} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={abrirCatalogoProdutos}
                startIcon={<Search />}
                sx={{ textTransform: "none", fontWeight: 700, flexShrink: 0 }}
              >
                Pesquisar
              </Button>
            </Box>

            <Box
              sx={{
                px: 2,
                py: 1.25,
                borderTop: "1px solid",
                borderColor: ticket.border,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
                bgcolor: "background.default",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700, color: ticket.muted }}>
                Cliente
              </Typography>
              <TextField
                size="small"
                placeholder={clienteSelecionado ? "" : "Nome ou CPF — opcional"}
                value={clienteSelecionado ? clienteSelecionado.nome : searchClienteBusca}
                onChange={(e) => {
                  if (!clienteSelecionado) setSearchClienteBusca(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") abrirDialogCliente();
                }}
                readOnly={!!clienteSelecionado}
                sx={{
                  flex: "1 1 200px",
                  minWidth: 0,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: ticket.clienteInputBg,
                    ...(!clienteSelecionado ? {} : { cursor: "default" }),
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: ticket.muted, fontSize: 20 }} />
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
                        aria-label="Limpar cliente"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={abrirDialogCliente}
                startIcon={<PersonSearch />}
                sx={{ textTransform: "none", fontWeight: 700, flexShrink: 0 }}
              >
                Pesquisar
              </Button>
            </Box>

            <Divider sx={{ borderColor: ticket.border }} />

            <Box sx={{ px: 2, py: 2, bgcolor: ticket.paymentBg, flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: "text.primary" }}>
                Forma de pagamento
              </Typography>
              <Grid container spacing={1} sx={{ mb: formaPagamento === "dinheiro" ? 2 : 0 }}>
                {FORMAS_PAGAMENTO.map((forma) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={forma.id}>
                    <Button
                      fullWidth
                      variant={formaPagamento === forma.id ? "contained" : "outlined"}
                      color={formaPagamento === forma.id ? "primary" : "inherit"}
                      onClick={() => setFormaPagamento(forma.id)}
                      startIcon={forma.icon}
                      sx={{
                        py: 1.25,
                        textTransform: "none",
                        fontWeight: 700,
                        borderColor: "divider",
                        ...(formaPagamento === forma.id
                          ? {}
                          : {
                              bgcolor: ticket.formaIdleBg,
                              color: "text.primary",
                            }),
                      }}
                    >
                      {forma.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              {formaPagamento === "dinheiro" && (
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Valor recebido"
                    type="number"
                    value={valorRecebido}
                    onChange={(e) => setValorRecebido(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography fontWeight={700}>R$</Typography>
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{ step: "0.01", min: "0" }}
                    size="small"
                  />
                  {valorRecebido ? (
                    <Alert severity={calcularTroco() >= 0 ? "success" : "error"} variant="outlined" sx={{ borderRadius: 2 }}>
                      {calcularTroco() >= 0 ? (
                        <>
                          Troco: <strong>R$ {calcularTroco().toFixed(2)}</strong>
                        </>
                      ) : (
                        <>Valor recebido menor que o total.</>
                      )}
                    </Alert>
                  ) : null}
                </Stack>
              )}

              {formaPagamento && formaPagamento !== "dinheiro" && (
                <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                  Pagamento em <strong>{FORMAS_PAGAMENTO.find((f) => f.id === formaPagamento)?.label}</strong> — confira o total e finalize.
                </Alert>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  size="large"
                  onClick={cancelarVenda}
                  disabled={carrinho.length === 0}
                  sx={{ textTransform: "none", fontWeight: 700, flex: { sm: "0 0 auto" } }}
                >
                  Limpar venda
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={finalizarVenda}
                  disabled={!podeFinalizarVenda()}
                  startIcon={<CheckCircle />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 800,
                    flex: { sm: 1 },
                    py: 1.25,
                    color: "#fff",
                    bgcolor: "success.dark",
                    "&:hover": { bgcolor: "success.main", color: "#fff" },
                    "&.Mui-disabled": { opacity: 0.55 },
                  }}
                >
                  Finalizar venda
                </Button>
              </Stack>
            </Box>
          </Box>

      <Dialog
        fullScreen
        open={openCatalogoProdutos}
        onClose={fecharCatalogoProdutos}
        TransitionComponent={CatalogoProdutosTransition}
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Typography component="span" variant="h6" sx={{ flex: 1, fontWeight: 800 }}>
            Buscar produtos
          </Typography>
          <IconButton edge="end" color="inherit" onClick={fecharCatalogoProdutos} aria-label="Fechar catálogo">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
            p: 2,
            pt: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Nome, SKU ou código…"
            value={searchProduto}
            onChange={(e) => setSearchProduto(e.target.value)}
            autoFocus
            sx={{ mb: 1.5, flexShrink: 0 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Código de barras">
                    <QrCodeScanner color="primary" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, flexShrink: 0 }}>
            Toque para adicionar. Itens já no cupom aparecem destacados em destaque.
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {carregandoProdutos ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                Carregando…
              </Typography>
            ) : produtosFiltrados.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                {searchProduto.trim() ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                {produtosFiltrados.map((produto) => {
                  const preco = Number(produto.precoVenda ?? produto.precoCusto ?? 0) || 0;
                  const itemCarrinho = carrinho.find((c) => Number(c.id) === Number(produto.id));
                  const noCupom = !!itemCarrinho;
                  return (
                    <Paper
                      key={produto.id}
                      component="button"
                      type="button"
                      onClick={() => handleAdicionarAoCarrinho(produto)}
                      elevation={0}
                      sx={{
                        p: 1.25,
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: noCupom ? "primary.main" : "divider",
                        borderRadius: 1,
                        bgcolor: noCupom
                          ? isDark
                            ? alpha(theme.palette.primary.main, 0.18)
                            : alpha(theme.palette.primary.main, 0.1)
                          : "background.paper",
                        font: "inherit",
                        color: "inherit",
                        transition: "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
                        boxShadow: noCupom ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.45)}` : "none",
                        "&:hover": {
                          borderColor: "primary.main",
                          boxShadow: 1,
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, alignItems: "flex-start" }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>
                              {produto.nome || "Produto"}
                            </Typography>
                            {noCupom ? (
                              <Chip
                                size="small"
                                label={`${itemCarrinho.quantidade} no cupom`}
                                color="primary"
                                sx={{ height: 22, fontWeight: 800, "& .MuiChip-label": { px: 1 } }}
                              />
                            ) : null}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {produto.sku ? `SKU ${produto.sku}` : `#${produto.id}`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                          {noCupom ? <CheckCircle sx={{ fontSize: 22, color: "primary.main" }} aria-hidden /> : null}
                          <Typography variant="body2" fontWeight={800} color="primary.main">
                            R$ {preco.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={fecharCatalogoProdutos} sx={{ textTransform: "none" }} variant="contained" color="inherit">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullScreen
        open={openDialogCliente}
        onClose={fecharDialogCliente}
        TransitionComponent={CatalogoProdutosTransition}
        PaperProps={{
          sx: {
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.default",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Typography component="span" variant="h6" sx={{ flex: 1, fontWeight: 800 }}>
            Buscar cliente
          </Typography>
          <IconButton edge="end" color="inherit" onClick={fecharDialogCliente} aria-label="Fechar busca de cliente">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            flex: "1 1 auto",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
            p: 2,
            pt: 2,
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Nome, CPF ou ID…"
            value={searchClienteBusca}
            onChange={(e) => setSearchClienteBusca(e.target.value)}
            autoFocus
            sx={{ mb: 1.5, flexShrink: 0 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, flexShrink: 0 }}>
            Toque em um cliente para selecionar e fechar. Um cliente por venda.
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {carregandoClientesBusca ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                Carregando…
              </Typography>
            ) : clientesBusca.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                {searchClienteBusca.trim() ? "Nenhum cliente encontrado." : "Nenhum cliente na lista. Digite para buscar."}
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                <Paper
                  component="button"
                  type="button"
                  onClick={() => {
                    setClienteSelecionado(null);
                    setSearchClienteBusca("");
                    fecharDialogCliente();
                  }}
                  elevation={0}
                  sx={{
                    p: 1.25,
                    width: "100%",
                    textAlign: "left",
                    cursor: "pointer",
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 1,
                    bgcolor: "background.paper",
                    font: "inherit",
                    color: "inherit",
                    "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
                  }}
                >
                  <Typography variant="body2" fontWeight={700} color="text.primary">
                    Venda sem cliente
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Não vincular cliente a esta venda
                  </Typography>
                </Paper>
                {clientesBusca.map((c) => {
                  const nome = c.nomeCompleto ?? c.NomeCompleto ?? c.nome ?? c.Nome ?? `Cliente #${c.id ?? c.Id}`;
                  const sub = c.cpf ? `CPF: ${c.cpf}` : `ID: ${c.id ?? c.Id}`;
                  return (
                    <Paper
                      key={c.id ?? c.Id}
                      component="button"
                      type="button"
                      onClick={() => selecionarCliente(c)}
                      elevation={0}
                      sx={{
                        p: 1.25,
                        width: "100%",
                        textAlign: "left",
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        bgcolor: "background.paper",
                        font: "inherit",
                        color: "inherit",
                        "&:hover": {
                          borderColor: "primary.main",
                          boxShadow: 1,
                        },
                      }}
                    >
                      <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.3 }}>
                        {nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sub}
                      </Typography>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
          <Button onClick={fecharDialogCliente} sx={{ textTransform: "none" }} variant="contained" color="inherit">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Caixa;
