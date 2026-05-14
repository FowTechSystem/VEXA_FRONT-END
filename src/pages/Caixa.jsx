import React, { useState, useEffect } from "react";
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
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Container,
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
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
} from "@mui/material";
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
  ArrowBack,
  ArrowForward,
  QrCodeScanner,
  Person,
  PersonSearch,
} from "@mui/icons-material";

const FORMAS_PAGAMENTO = [
  { id: "dinheiro", label: "Dinheiro", icon: <AttachMoney /> },
  { id: "credito", label: "Crédito", icon: <CreditCard /> },
  { id: "debito", label: "Débito", icon: <CreditCard /> },
  { id: "pix", label: "PIX", icon: <Pix /> },
];

const ETAPAS = ["Produtos", "Pagamento", "Confirmação"];

function Caixa() {
  const { emitirSeNovaMovimentacao } = useInAppNotifications();
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [carrinho, setCarrinho] = useState([]);
  const [searchProduto, setSearchProduto] = useState("");
  const [listaProdutos, setListaProdutos] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [desconto, setDesconto] = useState("");

  // Cliente da venda (opcional)
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [openDialogCliente, setOpenDialogCliente] = useState(false);
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
    return () => { cancelled = true; };
  }, []);

  const produtosFiltrados = listaProdutos.filter((p) => {
    const termo = (searchProduto || "").trim().toLowerCase();
    if (!termo) return true;
    const nome = (p.nome || "").toLowerCase();
    const sku = (p.sku || "").toLowerCase();
    const codigo = String(p.id || "").toLowerCase();
    return nome.includes(termo) || sku.includes(termo) || codigo.includes(termo);
  });

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
      carrinho.map((item) =>
        item.id === id ? { ...item, quantidade: novaQuantidade } : item,
      ),
    );
  };

  const calcularSubtotal = () => {
    return carrinho.reduce(
      (acc, item) => acc + item.precoVenda * item.quantidade,
      0,
    );
  };

  const calcularTotal = () => {
    return calcularSubtotal() - (Number(desconto) || 0);
  };

  const calcularTroco = () => {
    if (formaPagamento === "dinheiro" && valorRecebido) {
      return parseFloat(valorRecebido) - calcularTotal();
    }
    return 0;
  };

  const podeAvancar = () => {
    if (etapaAtual === 0) return carrinho.length > 0;
    if (etapaAtual === 1) {
      if (!formaPagamento) return false;
      if (formaPagamento === "dinheiro") {
        return valorRecebido && calcularTroco() >= 0;
      }
      return true;
    }
    return false;
  };

  const avancarEtapa = () => {
    if (podeAvancar()) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const voltarEtapa = () => {
    setEtapaAtual(etapaAtual - 1);
  };

  const finalizarVenda = async () => {
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
      const msg = data?.mensagem
        ?? data?.message
        ?? (Array.isArray(data?.errors) ? data.errors.flat().find(Boolean) : null)
        ?? data?.title
        ?? "Erro ao registrar venda. Verifique os dados e tente novamente.";
      console.error("Erro ao registrar venda:", data ?? err);
      showError(typeof msg === "string" ? msg : "Erro ao registrar venda. Tente novamente ou contate o suporte.");
      return;
    }
    setCarrinho([]);
    setDesconto("");
    setValorRecebido("");
    setFormaPagamento("");
    setClienteSelecionado(null);
    setEtapaAtual(0);
    showSuccess("Venda realizada com sucesso!");
  };

  const cancelarVenda = () => {
    if (window.confirm("Deseja cancelar a venda atual?")) {
      setCarrinho([]);
      setDesconto("");
      setValorRecebido("");
      setFormaPagamento("");
      setClienteSelecionado(null);
      setEtapaAtual(0);
    }
  };

  const abrirDialogCliente = () => {
    setOpenDialogCliente(true);
    setSearchClienteBusca("");
    setClientesBusca([]);
    setCarregandoClientesBusca(true);
  };

  const fecharDialogCliente = () => {
    setOpenDialogCliente(false);
    setSearchClienteBusca("");
    setClientesBusca([]);
  };

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
      } catch (err) {
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
    fecharDialogCliente();
  };

  // ETAPA 1: Produtos — PDV: área central clara com tabela dos itens (referência tipo cupom fiscal)
  const renderEtapaProdutos = () => (
    <Box
      sx={{
        bgcolor: "#eceff1",
        borderRadius: 2,
        p: { xs: 1, sm: 2 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        {/* Cupom / lista de itens — fundo branco fixo para leitura clara */}
        <Paper
          elevation={0}
          sx={{
            flex: "1 1 58%",
            order: { xs: 2, lg: 1 },
            display: "flex",
            flexDirection: "column",
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid #cfd8dc",
            bgcolor: "#ffffff",
            color: "#212121",
            minHeight: { xs: 360, md: 480 },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: "#e3f2fd",
              borderBottom: "1px solid #90caf9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#1565c0" }}>
              Itens da venda
            </Typography>
            <Chip
              size="small"
              label={`${carrinho.length} ${carrinho.length === 1 ? "item" : "itens"}`}
              sx={{ bgcolor: "#1976d2", color: "#fff", fontWeight: 600 }}
            />
          </Box>

          <TableContainer sx={{ flex: 1, maxHeight: { xs: 280, md: "min(52vh, 520px)" } }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: "#f5f5f5", color: "#424242", fontWeight: 700, fontSize: 12 } }}>
                  <TableCell width={44}>#</TableCell>
                  <TableCell width={100}>Cód.</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell align="center" width={120}>
                    Qtd.
                  </TableCell>
                  <TableCell align="right" width={100}>
                    Unit.
                  </TableCell>
                  <TableCell align="right" width={100}>
                    Total
                  </TableCell>
                  <TableCell align="center" width={56} />
                </TableRow>
              </TableHead>
              <TableBody>
                {carrinho.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 8, textAlign: "center", bgcolor: "#fafafa", border: 0 }}>
                      <ShoppingCart sx={{ fontSize: 56, color: "#b0bec5", mb: 1 }} />
                      <Typography sx={{ fontWeight: 600, color: "#546e7a", mb: 0.5 }}>
                        Nenhum produto na venda
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#78909c" }}>
                        Use a busca à direita para localizar e adicionar itens
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  carrinho.map((item, index) => {
                    const linha = index + 1;
                    const codigo = item.sku || `#${item.id}`;
                    const totalLinha = item.precoVenda * item.quantidade;
                    return (
                      <TableRow
                        key={item.id}
                        hover
                        sx={{ "&:nth-of-type(even)": { bgcolor: "#fafafa" }, "& td": { borderColor: "#eceff1", color: "#212121" } }}
                      >
                        <TableCell>{linha}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{codigo}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{item.nome}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleAlterarQuantidade(item.id, item.quantidade - 1)}
                              sx={{ bgcolor: "#eceff1", "&:hover": { bgcolor: "#cfd8dc" } }}
                              aria-label="Diminuir quantidade"
                            >
                              <Remove fontSize="inherit" />
                            </IconButton>
                            <Typography component="span" sx={{ minWidth: 28, textAlign: "center", fontWeight: 700 }}>
                              {item.quantidade}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleAlterarQuantidade(item.id, item.quantidade + 1)}
                              sx={{ bgcolor: "#1976d2", color: "#fff", "&:hover": { bgcolor: "#1565c0" } }}
                              aria-label="Aumentar quantidade"
                            >
                              <Add fontSize="inherit" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          R$ {item.precoVenda.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                          R$ {totalLinha.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoverProduto(item.id)}
                            sx={{ color: "#c62828" }}
                            aria-label="Remover item"
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
          </TableContainer>

          {carrinho.length > 0 && (
            <Box sx={{ borderTop: "2px solid #1976d2", bgcolor: "#fafafa", px: 2, py: 2 }}>
              <Stack spacing={1.5}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ color: "#546e7a" }}>
                    Subtotal
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#212121" }}>
                    R$ {calcularSubtotal().toFixed(2)}
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Desconto (R$)"
                  type="number"
                  placeholder="0"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
                  }}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pt: 1,
                    borderTop: "1px dashed #b0bec5",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "#1565c0" }}>
                    Total a pagar
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#0d47a1" }}>
                    R$ {calcularTotal().toFixed(2)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderTop: "1px solid #e0e0e0",
              bgcolor: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: "#546e7a" }}>
              Cliente:
            </Typography>
            <TextField
              size="small"
              placeholder="Clique para buscar cliente"
              value={clienteSelecionado ? clienteSelecionado.nome : ""}
              onClick={abrirDialogCliente}
              readOnly
              sx={{ flex: "1 1 220px", minWidth: 0, "& .MuiOutlinedInput-root": { bgcolor: "#fafafa", cursor: "pointer" } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "#78909c", fontSize: 20 }} />
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
          </Box>
        </Paper>

        {/* Busca e catálogo — painel lateral neutro */}
        <Paper
          elevation={0}
          sx={{
            flex: { xs: "1 1 auto", lg: "0 0 320px" },
            order: { xs: 1, lg: 2 },
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#f5f5f5",
            display: "flex",
            flexDirection: "column",
            maxHeight: { lg: "min(90vh, 720px)" },
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "text.primary" }}>
            Buscar produto
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Nome, SKU, código ou código de barras..."
            value={searchProduto}
            onChange={(e) => setSearchProduto(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary", fontSize: 22 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Leitor de código de barras">
                    <QrCodeScanner sx={{ color: "primary.main" }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1.5,
              "& .MuiOutlinedInput-root": { bgcolor: "#fff" },
            }}
          />
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
            Toque em um produto para incluir na venda (ou clique no +).
          </Typography>
          <Box sx={{ flex: 1, overflowY: "auto", minHeight: { xs: 200, lg: 280 } }}>
            {carregandoProdutos ? (
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                Carregando produtos...
              </Typography>
            ) : produtosFiltrados.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                {searchProduto.trim()
                  ? "Nenhum produto encontrado"
                  : "Nenhum produto cadastrado."}
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                {produtosFiltrados.map((produto) => {
                  const preco = Number(produto.precoVenda ?? produto.precoCusto ?? 0) || 0;
                  return (
                    <Paper
                      key={produto.id}
                      elevation={0}
                      onClick={() => handleAdicionarAoCarrinho(produto)}
                      sx={{
                        p: 1.25,
                        cursor: "pointer",
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        bgcolor: "#fff",
                        "&:hover": {
                          borderColor: "#1976d2",
                          boxShadow: 1,
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
                            {produto.nome || "Produto"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {produto.sku ? `SKU ${produto.sku}` : `# ${produto.id}`}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1565c0" }}>
                            R$ {preco.toFixed(2)}
                          </Typography>
                          <Add sx={{ color: "#1976d2", fontSize: 18 }} />
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );


  // ETAPA 2: Pagamento
  const renderEtapaPagamento = () => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        py: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          maxWidth: 700,
          width: "100%",
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, mb: 1, textAlign: "center" }}
        >
          Forma de Pagamento
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", mb: 4, textAlign: "center" }}
        >
          Selecione como o cliente deseja pagar
        </Typography>

        {/* Valor total */}
        <Paper
          sx={{
            textAlign: "center",
            mb: 4,
            p: 4,
            bgcolor: "action.hover",
            borderRadius: 2,
            border: "2px dashed",
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            Total a pagar
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700, color: "primary.main" }}>
            R$ {calcularTotal().toFixed(2)}
          </Typography>
        </Paper>

        {/* Formas de pagamento */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {FORMAS_PAGAMENTO.map((forma) => (
            <Grid size={{ xs: 6 }} key={forma.id}>
              <Card
                onClick={() => setFormaPagamento(forma.id)}
                sx={{
                  cursor: "pointer",
                  border:
                    formaPagamento === forma.id
                      ? "3px solid"
                      : "2px solid",
                  borderColor: formaPagamento === forma.id ? "primary.main" : "divider",
                  bgcolor: formaPagamento === forma.id ? "action.hover" : "background.paper",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    transform: "translateY(-4px)",
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <Box
                    sx={{
                      color:
                        formaPagamento === forma.id ? "primary.main" : "text.secondary",
                      mb: 2,
                      fontSize: 48,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {forma.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {forma.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Campo de valor recebido */}
        {formaPagamento === "dinheiro" && (
          <Box>
            <TextField
              fullWidth
              label="Valor Recebido"
              type="number"
              value={valorRecebido}
              onChange={(e) => setValorRecebido(e.target.value)}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ fontWeight: 700, fontSize: "1.5rem" }}>
                      R$
                    </Typography>
                  </InputAdornment>
                ),
              }}
              inputProps={{ step: "0.01", min: "0" }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  fontSize: "1.8rem",
                  fontWeight: 600,
                },
                "& .MuiInputLabel-root": {
                  fontSize: "1.2rem",
                },
              }}
            />

            {valorRecebido && (
              <Paper
                sx={{
                  p: 3,
                  bgcolor: calcularTroco() >= 0 ? "success.light" : "error.light",
                  border: "2px solid",
                  borderColor: calcularTroco() >= 0 ? "success.main" : "error.main",
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      color: calcularTroco() >= 0 ? "success.main" : "error.main",
                      fontWeight: 600,
                    }}
                  >
                    {calcularTroco() >= 0 ? "Troco" : "Valor insuficiente"}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: calcularTroco() >= 0 ? "success.main" : "error.main",
                      fontWeight: 700,
                    }}
                  >
                    R$ {Math.abs(calcularTroco()).toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>
        )}

        {formaPagamento && formaPagamento !== "dinheiro" && (
          <Alert
            severity="success"
            sx={{
              borderRadius: 2,
              fontSize: "1rem",
              "& .MuiAlert-message": {
                fontSize: "1rem",
              },
            }}
          >
            Forma de pagamento selecionada:{" "}
            <strong>
              {FORMAS_PAGAMENTO.find((f) => f.id === formaPagamento)?.label}
            </strong>
          </Alert>
        )}
      </Paper>
    </Box>
  );

  // ETAPA 3: Confirmação
  const renderEtapaConfirmacao = () => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        py: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          maxWidth: 600,
          width: "100%",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <CheckCircle sx={{ fontSize: 100, color: "success.main", mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}>
            Confirmar Venda
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Revise os dados antes de finalizar
          </Typography>
        </Box>

        {/* Resumo da venda */}
        <Paper
          sx={{
            p: 3,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 2, color: "text.secondary" }}
          >
            ITENS DA VENDA
          </Typography>
          <Stack spacing={1} sx={{ mb: 2 }}>
            {carrinho.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Tooltip title={`${item.quantidade}× ${item.nome}`} enterDelay={500}>
                  <Typography
                    variant="body1"
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {item.quantidade}x {item.nome}
                  </Typography>
                </Tooltip>
                <Typography variant="body1" sx={{ fontWeight: 600, flexShrink: 0 }}>
                  R$ {(item.precoVenda * item.quantidade).toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Subtotal
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                R$ {calcularSubtotal().toFixed(2)}
              </Typography>
            </Box>

            {(Number(desconto) || 0) > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body1" sx={{ color: "error.main" }}>
                  Desconto
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "error.main", fontWeight: 500 }}
                >
                  - R$ {(Number(desconto) || 0).toFixed(2)}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 2,
              bgcolor: "action.hover",
              borderRadius: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              Total
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
              R$ {calcularTotal().toFixed(2)}
            </Typography>
          </Box>
        </Paper>

        {/* Informações de pagamento — borda verde + fundo neutro para contraste legível */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: "action.hover",
            border: "2px solid",
            borderColor: "success.main",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: "success.main",
              letterSpacing: 0.6,
            }}
          >
            PAGAMENTO
          </Typography>
          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 1,
              }}
            >
              <Typography variant="body1" sx={{ color: "text.primary" }}>
                Forma de pagamento
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary", textAlign: "right", wordBreak: "break-word" }}>
                {FORMAS_PAGAMENTO.find((f) => f.id === formaPagamento)?.label ?? "—"}
              </Typography>
            </Box>

            {formaPagamento === "dinheiro" && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body1">Valor recebido</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    R$ {parseFloat(valorRecebido).toFixed(2)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body1">Troco</Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: "success.main" }}
                  >
                    R$ {calcularTroco().toFixed(2)}
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        </Paper>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Título da página: fluxo normal (sem sticky) para não “competir” com o scroll do layout */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: { xs: 2, sm: 4 },
          py: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
          Vendas
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Ponto de venda — fluxo em etapas (produtos, pagamento e confirmação)
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
            {/* Stepper */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Stepper activeStep={etapaAtual} alternativeLabel>
                {ETAPAS.map((label) => (
                  <Step key={label}>
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          fontSize: "2rem",
                          "&.Mui-active": {
                            color: "primary.main",
                          },
                          "&.Mui-completed": {
                            color: "success.main",
                          },
                        },
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>

            {/* Conteúdo */}
            <Box sx={{ mb: 3, pb: etapaAtual === 2 ? { xs: 14, sm: 12 } : 3 }}>
              {etapaAtual === 0 && renderEtapaProdutos()}
              {etapaAtual === 1 && renderEtapaPagamento()}
              {etapaAtual === 2 && renderEtapaConfirmacao()}
            </Box>

            {/* Barra de Ações Fixa */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: "background.paper",
                borderTop: "2px solid",
                borderColor: "divider",
                zIndex: 1000,
              }}
            >
              <Container maxWidth="xl">
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={cancelarVenda}
                    size="large"
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      px: 4,
                      "&:hover": {
                        bgcolor: "error.light",
                      },
                    }}
                  >
                    Cancelar Venda
                  </Button>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    {etapaAtual > 0 && (
                      <Button
                        variant="outlined"
                        onClick={voltarEtapa}
                        startIcon={<ArrowBack />}
                        size="large"
                        sx={{
                          textTransform: "none",
                          borderColor: "divider",
                          color: "text.secondary",
                          fontWeight: 600,
                          px: 4,
                          "&:hover": {
                            borderColor: "primary.main",
                            color: "primary.main",
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        Voltar
                      </Button>
                    )}

                    {etapaAtual < 2 ? (
                      <Button
                        variant="contained"
                        onClick={avancarEtapa}
                        disabled={!podeAvancar()}
                        endIcon={<ArrowForward />}
                        size="large"
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          px: 5,
                          fontSize: "1rem",
                          "&:disabled": {
                            bgcolor: "action.disabledBackground",
                            color: "text.disabled",
                          },
                        }}
                      >
                        Avançar
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={finalizarVenda}
                        startIcon={<CheckCircle sx={{ color: "inherit" }} />}
                        size="large"
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          px: 5,
                          fontSize: "1rem",
                          color: "#fff",
                          bgcolor: "success.dark",
                          boxShadow: "none",
                          "&:hover": {
                            bgcolor: "success.main",
                            color: "#fff",
                            boxShadow: (t) => t.shadows[4],
                          },
                        }}
                      >
                        Confirmar e Finalizar
                      </Button>
                    )}
                  </Box>
                </Box>
              </Container>
            </Paper>

            {/* Espaço para não sobrepor com a barra fixa */}
            <Box sx={{ height: { xs: 120, sm: 100 } }} />
      </Container>

      {/* Dialog Buscar Cliente */}
      <Dialog
        open={openDialogCliente}
        onClose={fecharDialogCliente}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonSearch /> Buscar cliente
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Digite o nome ou busque pelo ID do cliente..."
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
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                Carregando clientes...
              </Typography>
            ) : clientesBusca.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                {searchClienteBusca.trim() ? "Nenhum cliente encontrado." : "Digite acima para buscar ou liste todos."}
              </Typography>
            ) : (
              <List dense disablePadding>
                <ListItemButton onClick={() => { setClienteSelecionado(null); fecharDialogCliente(); }} sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 1, mb: 1 }}>
                  <ListItemText primary="Venda sem cliente" secondary="Não vincular a nenhum cliente" />
                </ListItemButton>
                {clientesBusca.map((c) => {
                  const nome = c.nomeCompleto ?? c.NomeCompleto ?? c.nome ?? c.Nome ?? `Cliente #${c.id ?? c.Id}`;
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
                      <ListItemText primary={nome} secondary={c.cpf ? `CPF: ${c.cpf}` : `ID: ${c.id ?? c.Id}`} />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={fecharDialogCliente} sx={{ textTransform: "none" }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Caixa;
