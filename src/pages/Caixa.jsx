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
  Tab,
  Tabs,
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
} from "@mui/material";
import { showSuccess, showError } from "../utils/notifications";
import { produtosService } from "../api/produtosService";
import { vendasService } from "../api/vendasService";
import { clientesService } from "../api/clientesService";
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
  Receipt,
  History,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
  FilterList,
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

const normalizeFormaPagamento = (fp) => {
  const s = String(fp || "").toLowerCase();
  if (s.includes("cred") || s.includes("crédito")) return "credito";
  if (s.includes("deb") || s.includes("débito")) return "debito";
  if (s.includes("pix")) return "pix";
  if (s.includes("dinheiro")) return "dinheiro";
  return "credito";
};

function Caixa() {
  const [tabAtual, setTabAtual] = useState(0);
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

  // Estados para histórico e paginação (carregado da API)
  const [vendas, setVendas] = useState([]);
  const [carregandoVendas, setCarregandoVendas] = useState(false);

  // Filtro de data - Primeiro e último dia do mês atual
  const obterPrimeiroDiaMes = () => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  };

  const obterUltimoDiaMes = () => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
  };

  const [dataInicio, setDataInicio] = useState(obterPrimeiroDiaMes());
  const [dataFim, setDataFim] = useState(obterUltimoDiaMes());

  // Estados de paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const vendasPorPagina = 10;

  // Filtrar vendas por data
  const vendasFiltradas = vendas.filter((venda) => {
    const dataVenda = new Date(venda.data).toISOString().split("T")[0];
    return dataVenda >= dataInicio && dataVenda <= dataFim;
  });

  // Cálculos de paginação
  const totalPaginas = Math.ceil(vendasFiltradas.length / vendasPorPagina);
  const indiceInicial = (paginaAtual - 1) * vendasPorPagina;
  const indiceFinal = indiceInicial + vendasPorPagina;
  const vendasPaginadas = vendasFiltradas.slice(indiceInicial, indiceFinal);

  // Funções de navegação
  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  useEffect(() => {
    let cancelled = false;
    async function carregarVendas() {
      setCarregandoVendas(true);
      try {
        const res = await vendasService.getAll({
          dataInicio,
          dataFim,
          tamanho: 500,
        });
        if (cancelled) return;
        const list = Array.isArray(res) ? res : res?.vendas ?? res?.Vendas ?? res?.items ?? res?.data ?? [];
        const normalizadas = list.map((v) => ({
          id: v.id ?? v.Id,
          data: v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? v.dataCriacao ?? "",
          itens: Array.isArray(v.itens ?? v.Itens ?? v.items) ? (v.itens ?? v.Itens ?? v.items).length : (v.itens ?? 0),
          total: Number(v.valorTotal ?? v.ValorTotal ?? v.total ?? 0) || 0,
          formaPagamento: normalizeFormaPagamento(v.formaPagamento ?? v.FormaPagamento ?? "credito"),
          desconto: Number(v.desconto ?? v.Desconto ?? 0) || 0,
          status: (v.status ?? v.Status ?? "finalizada").toString().toLowerCase(),
        }));
        setVendas(normalizadas);
      } catch (err) {
        if (!cancelled) {
          console.error("Erro ao carregar vendas:", err);
          setVendas([]);
        }
      } finally {
        if (!cancelled) setCarregandoVendas(false);
      }
    }
    if (tabAtual === 1) carregarVendas();
    return () => { cancelled = true; };
  }, [tabAtual, dataInicio, dataFim]);

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
      const vendaNorm = {
        id: criada?.id ?? criada?.Id ?? Date.now(),
        data: criada?.dataVenda ?? criada?.DataVenda ?? criada?.data ?? criada?.createdAt ?? new Date().toISOString(),
        itens: carrinho.length,
        total,
        formaPagamento,
        desconto: descontoVal,
        status: "finalizada",
      };
      setVendas((prev) => [vendaNorm, ...prev]);
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

  const handleFiltrarData = () => {
    setPaginaAtual(1); // Volta para primeira página ao filtrar
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

  const limparFiltros = () => {
    setDataInicio(obterPrimeiroDiaMes());
    setDataFim(obterUltimoDiaMes());
    setPaginaAtual(1);
  };

  // ETAPA 1: Produtos
  const renderEtapaProdutos = () => (
    <Box sx={{ height: "calc(100vh - 320px)", display: "flex", gap: 3 }}>
      {/* Área de Busca - 60% */}
      <Paper
        elevation={0}
        sx={{
          flex: "1 1 60%",
          p: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: "text.primary" }}>
          Buscar Produtos
        </Typography>

        <TextField
          fullWidth
          placeholder="Digite o nome, código ou escaneie o código de barras..."
          value={searchProduto}
          onChange={(e) => setSearchProduto(e.target.value)}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary", fontSize: 28 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <QrCodeScanner sx={{ color: "primary.main" }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              fontSize: "1.1rem",
              py: 1.5,
            },
          }}
          sx={{
            mb: 3,
            bgcolor: "background.paper",
            "& .MuiOutlinedInput-root": {
              bgcolor: "background.paper",
              color: "text.primary",
              "& fieldset": { borderWidth: "2px", borderColor: "divider" },
              "&:hover fieldset": { borderColor: "divider" },
              "&.Mui-focused fieldset": { borderWidth: "2px", borderColor: "primary.main" },
              "& input": { color: "text.primary" },
              "& input::placeholder": { color: "text.secondary", opacity: 1 },
            },
          }}
        />

        <Alert
          severity="info"
          icon={<QrCodeScanner />}
          sx={{
            borderRadius: 2,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
            "& .MuiAlert-icon": {
              color: "primary.main",
            },
          }}
        >
          Use o campo acima ou scanner de código de barras para adicionar
          produtos ao carrinho
        </Alert>

        {/* Lista de produtos */}
        <Box sx={{ flex: 1, mt: 3, overflowY: "auto" }}>
          {carregandoProdutos ? (
            <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
              Carregando produtos...
            </Typography>
          ) : produtosFiltrados.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
              {searchProduto.trim()
                ? "Nenhum produto encontrado para essa busca"
                : "Nenhum produto cadastrado. Cadastre produtos em Gestão > Produtos."}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {produtosFiltrados.map((produto) => {
                const preco = Number(produto.precoVenda ?? produto.precoCusto ?? 0) || 0;
                return (
                  <Paper
                    key={produto.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "action.hover",
                        borderColor: "primary.main",
                      },
                    }}
                    onClick={() => handleAdicionarAoCarrinho(produto)}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary" }}>
                          {produto.nome || "Produto"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {produto.sku ? `SKU: ${produto.sku}` : `#${produto.id}`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                          R$ {preco.toFixed(2)}
                        </Typography>
                        <Add sx={{ color: "primary.main", fontSize: 20 }} />
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Paper>

      {/* Carrinho - 40% */}
      <Paper
        elevation={0}
        sx={{
          flex: "1 1 40%",
          p: 3,
          borderRadius: 2,
          border: "2px solid",
          borderColor: "primary.main",
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
            Carrinho
          </Typography>
          <Chip
            icon={<ShoppingCart />}
            label={`${carrinho.length} ${
              carrinho.length === 1 ? "item" : "itens"
            }`}
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 600,
              px: 1,
            }}
          />
        </Box>

        {/* Cliente */}
        <TextField
          fullWidth
          size="small"
          label="Cliente"
          placeholder="Clique para selecionar ou buscar cliente"
          value={clienteSelecionado ? clienteSelecionado.nome : ""}
          onClick={abrirDialogCliente}
          readOnly
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person sx={{ color: "text.secondary" }} />
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
          inputProps={{ sx: { cursor: "pointer" } }}
        />

        {/* Lista de itens */}
        <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
          {carrinho.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                color: "text.secondary",
              }}
            >
              <ShoppingCart sx={{ fontSize: 80, mb: 2, opacity: 0.5, color: "text.secondary" }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}>
                Carrinho vazio
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Adicione produtos para começar
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {carrinho.map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {item.nome}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "primary.main", fontWeight: 500 }}
                      >
                        R$ {item.precoVenda.toFixed(2)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoverProduto(item.id)}
                      sx={{
                        color: "error.main",
                        "&:hover": { bgcolor: "error.light" },
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleAlterarQuantidade(item.id, item.quantidade - 1)
                        }
                        sx={{
                          bgcolor: "action.hover",
                          "&:hover": { bgcolor: "action.selected" },
                        }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography
                        sx={{
                          minWidth: 40,
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "1.1rem",
                        }}
                      >
                        {item.quantidade}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleAlterarQuantidade(item.id, item.quantidade + 1)
                        }
                        sx={{
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          "&:hover": { bgcolor: "primary.dark" },
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      R$ {(item.precoVenda * item.quantidade).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        {/* Resumo */}
        {carrinho.length > 0 && (
          <Box>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  Subtotal
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
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
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Stack>

            <Paper
              sx={{
                p: 2,
                bgcolor: "action.hover",
                border: "2px solid",
                borderColor: "primary.main",
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
                <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
                  Total
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  R$ {calcularTotal().toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );

  // ETAPA 2: Pagamento
  const renderEtapaPagamento = () => (
    <Box
      sx={{
        height: "calc(100vh - 320px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
        height: "calc(100vh - 320px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
                }}
              >
                <Typography variant="body1">
                  {item.quantidade}x {item.nome}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
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

        {/* Informações de pagamento */}
        <Paper
          sx={{
            p: 3,
            bgcolor: "success.light",
            border: "1px solid",
            borderColor: "success.main",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 2, color: "success.main" }}
          >
            PAGAMENTO
          </Typography>
          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body1">Forma de pagamento</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {FORMAS_PAGAMENTO.find((f) => f.id === formaPagamento)?.label}
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

  // HISTÓRICO DE VENDAS
  const renderHistoricoVendas = () => (
    <Box>
      {/* Filtros */}
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <FilterList sx={{ color: "text.secondary" }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
            Filtros de Período
          </Typography>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Data Início"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Data Fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFiltrarData}
                sx={{
                  textTransform: "none",
                }}
              >
                Aplicar Filtro
              </Button>
              <Button
                variant="outlined"
                onClick={limparFiltros}
                sx={{
                  textTransform: "none",
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              >
                Limpar
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Chip
            label={`${vendasFiltradas.length} ${vendasFiltradas.length === 1 ? "venda" : "vendas"} encontrada(s)`}
            sx={{ bgcolor: "action.hover", color: "primary.main", fontWeight: 500 }}
          />
          <Chip
            label={`Total: R$ ${vendasFiltradas.reduce((acc, v) => acc + v.total, 0).toFixed(2)}`}
            sx={{ bgcolor: "success.light", color: "success.main", fontWeight: 500 }}
          />
        </Box>
      </Paper>

      {/* Tabela de Vendas */}
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
                ID
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                DATA/HORA
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                ITENS
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                PAGAMENTO
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                DESCONTO
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                TOTAL
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                STATUS
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carregandoVendas ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 8, color: "text.secondary" }}
                >
                  <Typography variant="body2">Carregando vendas...</Typography>
                </TableCell>
              </TableRow>
            ) : vendasPaginadas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 8, color: "text.secondary" }}
                >
                  <Receipt sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1" sx={{ color: "text.primary" }}>
                    Nenhuma venda encontrada no período selecionado
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              vendasPaginadas.map((venda, index) => (
                <TableRow
                  key={venda.id}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom:
                      index === vendasPaginadas.length - 1
                        ? "none"
                        : "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Chip
                      label={`#${venda.id}`}
                      size="small"
                      sx={{ bgcolor: "action.hover", fontWeight: 500, color: "text.primary" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                      {new Date(venda.data).toLocaleDateString("pt-BR")}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {new Date(venda.data).toLocaleTimeString("pt-BR")}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {venda.itens}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={
                        FORMAS_PAGAMENTO.find(
                          (f) => f.id === venda.formaPagamento,
                        )?.icon
                      }
                      label={
                        FORMAS_PAGAMENTO.find(
                          (f) => f.id === venda.formaPagamento,
                        )?.label
                      }
                      size="small"
                      sx={{
                        bgcolor: "action.hover",
                        color: "primary.main",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{ color: venda.desconto > 0 ? "error.main" : "text.secondary" }}
                    >
                      {venda.desconto > 0
                        ? `- R$ ${venda.desconto.toFixed(2)}`
                        : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: "success.main" }}
                    >
                      R$ {venda.total.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label="Finalizada"
                      size="small"
                      sx={{
                        bgcolor: "success.light",
                        color: "success.main",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginação */}
        {vendasFiltradas.length > 0 && (
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
              {Math.min(indiceFinal, vendasFiltradas.length)} de{" "}
              {vendasFiltradas.length}{" "}
              {vendasFiltradas.length === 1 ? "venda" : "vendas"}
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
    </Box>
  );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header Fixo */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          px: 4,
          py: 2,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
          Caixa
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Ponto de Venda - Sistema em Etapas
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={tabAtual}
            onChange={(e, newValue) => setTabAtual(newValue)}
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              px: 2,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                color: "text.secondary",
              },
              "& .Mui-selected": {
                color: "primary.main",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
              },
            }}
          >
            <Tab icon={<Receipt />} iconPosition="start" label="Nova Venda" />
            <Tab
              icon={<History />}
              iconPosition="start"
              label="Histórico de Vendas"
            />
          </Tabs>
        </Paper>

        {tabAtual === 0 && (
          <>
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
            <Box sx={{ mb: 3 }}>
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
                        color="success"
                        onClick={finalizarVenda}
                        startIcon={<CheckCircle />}
                        size="large"
                        sx={{
                          textTransform: "none",
                          fontWeight: 600,
                          px: 5,
                          fontSize: "1rem",
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
            <Box sx={{ height: 80 }} />
          </>
        )}

        {tabAtual === 1 && renderHistoricoVendas()}
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
