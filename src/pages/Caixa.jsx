// src/pages/Caixa.jsx
// PDV — redesenhado com Tabs (Itens / Finalização), header com fotos e hotkeys
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tabs,
  Tab,
  Tooltip,
  Avatar,
  useTheme,
  Slide,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { showSuccess, showError } from "../utils/notifications";
import {
  isProdutoBazar,
  QUANTIDADE_PRODUTO_BAZAR,
} from "../components/Bazar/bazarHelpers";
import { produtosService } from "../api/produtosService";
import { vendasService } from "../api/vendasService";
import { clientesService } from "../api/clientesService";
import { authService } from "../api/authService";
import { useInAppNotifications } from "../contexts/InAppNotificationContext";
import { isCaixaAberto, CAIXA_CHANGED_EVENT } from "../utils/caixaStatus";
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
  ArrowBack,
  QrCode2,
  ImageNotSupported,
  Badge as BadgeIcon,
  PointOfSale,
  Discount,
  TrendingUp,
  Lock,
} from "@mui/icons-material";

const CatalogoProdutosTransition = React.forwardRef(
  function CatalogoProdutosTransition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  },
);

const FORMAS_PAGAMENTO = [
  { id: "dinheiro", label: "Dinheiro", Icon: AttachMoney },
  { id: "credito", label: "Crédito", Icon: CreditCard },
  { id: "debito", label: "Débito", Icon: CreditCard },
  { id: "pix", label: "PIX", Icon: Pix },
];

const fmtBRL = (v) => `R$ ${(Number(v) || 0).toFixed(2)}`;

// (PhotoBox e HotkeyButton removidos — fotos agora aparecem inline na tabela)

// ─── Helper: Summary card (sidebar direita) ──────────────────────────────────
function SummaryCard({
  label,
  value,
  highlight,
  editable,
  onChange,
  valuePrefix,
  isDark,
}) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: highlight ? "2px solid" : "1px solid",
        borderColor: highlight ? "primary.main" : "divider",
        bgcolor: highlight
          ? alpha("#000", isDark ? 0 : 0) // placeholder, overridden via sx below
          : "background.paper",
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
      {editable ? (
        <TextField
          size="small"
          type="number"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          inputProps={{
            step: "0.01",
            min: "0",
            style: { fontWeight: 800, fontSize: 18 },
          }}
          InputProps={{
            startAdornment: valuePrefix ? (
              <InputAdornment position="start">
                <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                  {valuePrefix}
                </Typography>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            mt: 0.25,
            "& .MuiOutlinedInput-root": {
              bgcolor: "background.default",
              height: 36,
            },
          }}
        />
      ) : (
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
      )}
    </Box>
  );
}

function Caixa() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { emitirSeNovaMovimentacao } = useInAppNotifications();

  // ─── Estado do Caixa (abertura) ────────────────────────────────────────────
  const [caixaAberto, setCaixaAberto] = useState(() => isCaixaAberto());

  useEffect(() => {
    const sync = () => setCaixaAberto(isCaixaAberto());
    window.addEventListener(CAIXA_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(CAIXA_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  // ─── Estado existente (preservado) ─────────────────────────────────────────
  const [carrinho, setCarrinho] = useState([]);
  const [searchProduto, setSearchProduto] = useState("");
  const [listaProdutos, setListaProdutos] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [etapaPdv, setEtapaPdv] = useState("itens");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [parcelas, setParcelas] = useState(1);
  const [desconto, setDesconto] = useState("");

  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [openDialogCliente, setOpenDialogCliente] = useState(false);
  const [openCatalogoProdutos, setOpenCatalogoProdutos] = useState(false);
  const [searchClienteBusca, setSearchClienteBusca] = useState("");
  const [clientesBusca, setClientesBusca] = useState([]);
  const [carregandoClientesBusca, setCarregandoClientesBusca] = useState(false);

  // ─── Estado novo (redesign) ────────────────────────────────────────────────
  const [itemSelecionadoId, setItemSelecionadoId] = useState(null);
  const [ultimoAdicionadoId, setUltimoAdicionadoId] = useState(null);
  const [observacao, setObservacao] = useState("");
  const [acrescimo, setAcrescimo] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("aVista"); // visual toggle
  const produtoSearchRef = useRef(null);

  // ─── Vendedor (do usuário logado) ──────────────────────────────────────────
  const vendedor = useMemo(() => {
    try {
      const u = authService.getUsuario();
      const nome = u?.nome ?? u?.Nome ?? u?.name ?? "";
      if (nome && String(nome).trim()) return String(nome).trim();
      const email = u?.email ?? u?.Email ?? "";
      const local = String(email).split("@")[0];
      return local || "Vendedor";
    } catch {
      return "Vendedor";
    }
  }, []);
  const vendedorInicial = (vendedor || "?").charAt(0).toUpperCase();

  // ─── Helpers de imagem do produto ──────────────────────────────────────────
  const getProdutoImagem = (item) => {
    if (item?.id == null) return null;
    const tipoItem = item.tipo ?? "normal";
    const produto = listaProdutos.find(
      (p) =>
        Number(p.id) === Number(item.id) && (p.tipo ?? "normal") === tipoItem,
    );
    if (!produto) return null;
    return (
      produto.imagemUrl ||
      produto.ImagemUrl ||
      produto.imagem ||
      produto.Imagem ||
      produto.foto1 ||
      produto.Foto1 ||
      (Array.isArray(produto.imagens)
        ? produto.imagens[0]?.url || produto.imagens[0]
        : null) ||
      null
    );
  };

  // ─── Carregar produtos ─────────────────────────────────────────────────────
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
      } catch (err) {
        if (!cancelled) {
          console.error("Erro ao carregar produtos:", err);
          showError(
            "Erro ao carregar produtos. Verifique a conexão com o servidor.",
          );
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
      return (
        nome.includes(termo) || sku.includes(termo) || codigo.includes(termo)
      );
    });
  }, [listaProdutos, searchProduto]);

  const produtosPreview = useMemo(() => {
    const termo = (searchProduto || "").trim();
    const list = termo ? produtosFiltrados : listaProdutos;
    return list.slice(0, 5);
  }, [listaProdutos, produtosFiltrados, searchProduto]);

  // ─── Handlers (lógica preservada, só com update de ultimoAdicionadoId) ─────
  const handleAdicionarAoCarrinho = (produto) => {
    const precoVenda =
      Number(produto.precoVenda ?? produto.precoCusto ?? 0) || 0;
    const tipo = produto.tipo ?? "normal";
    // Chave composta: produto normal e peça de bazar podem ter o mesmo id numérico
    const chave = `${tipo}-${produto.id}`;
    const item = {
      chave,
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
    const jaNoCarrinho = carrinho.find((c) => c.chave === chave);
    if (jaNoCarrinho) {
      if (isProdutoBazar(item)) {
        showError("Esta peça do bazar já está no carrinho (quantidade fixa: 1 unidade).");
        return;
      }
      handleAlterarQuantidade(chave, jaNoCarrinho.quantidade + 1);
    } else {
      setCarrinho([...carrinho, item]);
    }
    setUltimoAdicionadoId(chave);
  };

  const handleRemoverProduto = (chave) => {
    setCarrinho(carrinho.filter((item) => item.chave !== chave));
    if (itemSelecionadoId === chave) setItemSelecionadoId(null);
    if (ultimoAdicionadoId === chave) setUltimoAdicionadoId(null);
  };

  const handleAlterarQuantidade = (chave, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      handleRemoverProduto(chave);
      return;
    }
    const item = carrinho.find((c) => c.chave === chave);
    if (item && isProdutoBazar(item)) {
      if (novaQuantidade !== QUANTIDADE_PRODUTO_BAZAR) {
        showError("Peças do bazar são vendidas em quantidade fixa (1 unidade).");
        return;
      }
    }
    setCarrinho(
      carrinho.map((item) =>
        item.chave === chave ? { ...item, quantidade: novaQuantidade } : item,
      ),
    );
  };

  const calcularSubtotal = () =>
    carrinho.reduce((acc, item) => acc + item.precoVenda * item.quantidade, 0);

  const descontoNum = useMemo(
    () => Math.max(0, Number(String(desconto).replace(",", ".")) || 0),
    [desconto],
  );
  const acrescimoNum = useMemo(
    () => Math.max(0, Number(String(acrescimo).replace(",", ".")) || 0),
    [acrescimo],
  );

  const calcularTotal = () => calcularSubtotal() + acrescimoNum - descontoNum;

  const calcularTroco = () => {
    if (formaPagamento === "dinheiro" && valorRecebido) {
      const vr = parseFloat(String(valorRecebido).replace(",", "."));
      if (!Number.isFinite(vr)) return -1;
      return vr - calcularTotal();
    }
    return 0;
  };

  const podeIrParaPagamento = () => carrinho.length > 0;

  const podeConfirmarPagamento = () => {
    if (carrinho.length === 0) return false;
    if (!formaPagamento) return false;
    if (formaPagamento === "dinheiro") {
      const vr = parseFloat(String(valorRecebido).replace(",", "."));
      if (!Number.isFinite(vr) || vr <= 0) return false;
      return calcularTroco() >= 0;
    }
    if (formaPagamento === "credito" || formaPagamento === "debito") {
      return parcelas >= 1 && parcelas <= 12;
    }
    return true;
  };

  const irParaPagamento = () => {
    if (!podeIrParaPagamento()) return;
    setEtapaPdv("pagamento");
  };

  const voltarDePagamento = () => {
    setEtapaPdv("itens");
  };

  const confirmarPagamento = async () => {
    if (!isCaixaAberto()) {
      showError("O caixa está fechado. Abra o caixa para realizar vendas.");
      navigate("/caixa");
      return;
    }
    if (!podeConfirmarPagamento()) return;
    const total = calcularTotal();
    const descontoVal = descontoNum;
    const nomeClienteVenda = clienteSelecionado?.nome;
    const payload = {
      itens: carrinho.map((item) => ({
        produtoId: Number(item.id),
        tipo: item.tipo ?? "normal",
        quantidade: isProdutoBazar(item)
          ? QUANTIDADE_PRODUTO_BAZAR
          : Number(item.quantidade) || 1,
        precoUnitario: Number(item.precoVenda) || 0,
      })),
      valorTotal: Number(total.toFixed(2)),
      formaPagamento: String(formaPagamento || "credito"),
      desconto: descontoVal ?? 0,
      ...(clienteSelecionado?.id != null
        ? { clienteId: Number(clienteSelecionado.id) }
        : {}),
      ...(formaPagamento === "credito" || formaPagamento === "debito"
        ? { parcelas: Number(parcelas) || 1 }
        : {}),
      ...(observacao ? { observacao: String(observacao) } : {}),
    };
    try {
      const criada = await vendasService.create(payload);
      const vid = criada?.id ?? criada?.Id;
      emitirSeNovaMovimentacao({
        tipo: "venda",
        vendaId: vid,
        id: vid,
        valor: total,
        descricao: nomeClienteVenda
          ? `Venda — ${nomeClienteVenda}`
          : "Venda no caixa",
        data: new Date().toISOString(),
      });
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.mensagem ??
        data?.message ??
        (Array.isArray(data?.errors)
          ? data.errors.flat().find(Boolean)
          : null) ??
        data?.title ??
        "Erro ao registrar venda. Verifique os dados e tente novamente.";
      console.error("Erro ao registrar venda:", data ?? err);
      showError(
        typeof msg === "string"
          ? msg
          : "Erro ao registrar venda. Tente novamente ou contate o suporte.",
      );
      return;
    }
    // Reset
    setCarrinho([]);
    setDesconto("");
    setAcrescimo("");
    setValorRecebido("");
    setFormaPagamento("");
    setParcelas(1);
    setObservacao("");
    setClienteSelecionado(null);
    setItemSelecionadoId(null);
    setUltimoAdicionadoId(null);
    setEtapaPdv("itens");
    showSuccess("Venda realizada com sucesso!");
  };

  const cancelarVenda = () => {
    if (
      window.confirm("Deseja limpar a venda atual? Os itens serão removidos.")
    ) {
      setCarrinho([]);
      setDesconto("");
      setAcrescimo("");
      setValorRecebido("");
      setFormaPagamento("");
      setParcelas(1);
      setObservacao("");
      setClienteSelecionado(null);
      setItemSelecionadoId(null);
      setUltimoAdicionadoId(null);
      setEtapaPdv("itens");
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

  // ─── Hotkeys F2/F5/F6 ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      if (e.key === "F2") {
        e.preventDefault();
        navigate("/condicional");
      } else if (e.key === "F5") {
        e.preventDefault();
        produtoSearchRef.current?.focus();
      } else if (e.key === "F6") {
        e.preventDefault();
        abrirDialogCliente();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  // ─── Busca de clientes (preservado) ────────────────────────────────────────
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
    }, delay);
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
        cliente.Nome ??
        "Cliente",
      cpf: cliente.cpf ?? cliente.CPF ?? null,
    });
    setSearchClienteBusca("");
    fecharDialogCliente();
  };

  // ─── Lista virtual de parcelas (para Finalização tab) ──────────────────────
  const parcelasVisuais = useMemo(() => {
    const total = calcularTotal();
    if (total <= 0 || !formaPagamento) return [];
    const tipoLabel =
      formaPagamento === "credito"
        ? "À Prazo"
        : formaPagamento === "debito"
          ? "À Vista"
          : formaPagamento === "pix"
            ? "À Vista"
            : "À Vista";
    const meioLabel =
      FORMAS_PAGAMENTO.find((f) => f.id === formaPagamento)?.label || "";
    const nParc =
      formaPagamento === "credito" || formaPagamento === "debito"
        ? Math.max(1, Number(parcelas) || 1)
        : 1;
    const valorParcela = total / nParc;
    const hoje = new Date();
    return Array.from({ length: nParc }, (_, i) => {
      const venc = new Date(hoje);
      venc.setDate(venc.getDate() + i * 30);
      return {
        parcela: i + 1,
        tipo: tipoLabel,
        meio: meioLabel,
        vencimento: venc.toLocaleDateString("pt-BR"),
        valor: valorParcela,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrinho, formaPagamento, parcelas, desconto, acrescimo]);

  // ─── ticket (paleta dinâmica) ──────────────────────────────────────────────
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

  const tabValue = etapaPdv === "itens" ? 0 : 1;
  const handleTabChange = (_e, v) => {
    if (v === 1) {
      if (!podeIrParaPagamento()) {
        showError("Adicione ao menos um item antes de ir para a finalização.");
        return;
      }
      setEtapaPdv("pagamento");
    } else {
      setEtapaPdv("itens");
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <Box
      sx={{
        position: "relative",
        flex: 1,
        minHeight: "calc(100dvh - 64px)",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        color: "text.primary",
        overflow: "hidden",
      }}
    >
      {/* ═══ Header geral: título + chip ═══ */}
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
          <PointOfSale sx={{ fontSize: 26, color: "primary.main" }} />
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Venda
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Ponto de venda — atalhos F2 / F5 / F6
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
          value={tabValue}
          onChange={handleTabChange}
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
          <Tab label="Itens" />
          <Tab label="Finalização" disabled={!podeIrParaPagamento()} />
        </Tabs>
      </Box>

      {/* Header de hotkeys removido — atalhos F2/F5/F6 continuam funcionando via teclado */}

      {/* ═══ Conteúdo (varia por tab) ═══ */}
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
        {etapaPdv === "itens" ? (
          // ════════════════════════════════════════════════
          // TAB: ITENS
          // ════════════════════════════════════════════════
          <Grid
            container
            spacing={1.5}
            sx={{ flex: 1, minHeight: 0, p: { xs: 1, md: 1.5 }, m: 0 }}
          >
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
                          <BadgeIcon
                            sx={{ color: "text.secondary", fontSize: 18 }}
                          />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: ticket.clienteInputBg,
                        opacity: 0.9,
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8, md: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    inputRef={produtoSearchRef}
                    label="Produto"
                    placeholder="Nome, SKU ou código de barras…  (F5)"
                    value={searchProduto}
                    onChange={(e) => setSearchProduto(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") abrirCatalogoProdutos();
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search
                            sx={{ color: "primary.main", fontSize: 20 }}
                          />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Abrir catálogo">
                            <IconButton
                              size="small"
                              onClick={abrirCatalogoProdutos}
                              aria-label="Abrir catálogo"
                            >
                              <QrCodeScanner sx={{ color: "primary.main" }} />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: ticket.clienteInputBg,
                        "& fieldset": {
                          borderColor: alpha(theme.palette.primary.main, 0.45),
                          borderWidth: 1.5,
                        },
                        "&:hover fieldset": { borderColor: "primary.main" },
                        "&.Mui-focused fieldset": {
                          borderColor: "primary.main",
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cliente"
                    value={
                      clienteSelecionado
                        ? clienteSelecionado.nome
                        : "Não informado"
                    }
                    onClick={abrirDialogCliente}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person
                            sx={{
                              color: clienteSelecionado
                                ? "primary.main"
                                : "text.secondary",
                              fontSize: 18,
                            }}
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
                            aria-label="Limpar cliente"
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                    sx={{
                      cursor: "pointer",
                      "& .MuiInputBase-input": {
                        cursor: "pointer",
                        fontStyle: clienteSelecionado ? "normal" : "italic",
                      },
                      "& .MuiOutlinedInput-root": {
                        bgcolor: ticket.clienteInputBg,
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Preview de produtos buscados */}
              {(searchProduto || "").trim() && produtosPreview.length > 0 ? (
                <Paper
                  variant="outlined"
                  sx={{ mb: 1.25, p: 1, bgcolor: "background.paper" }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.75, fontWeight: 700 }}
                  >
                    {carregandoProdutos
                      ? "Carregando…"
                      : "Resultados — clique para adicionar"}
                  </Typography>
                  <Stack
                    spacing={0.5}
                    sx={{ maxHeight: 160, overflowY: "auto" }}
                  >
                    {produtosPreview.map((produto) => {
                      const preco =
                        Number(produto.precoVenda ?? produto.precoCusto ?? 0) ||
                        0;
                      const noCupom = carrinho.some(
                        (c) =>
                          Number(c.id) === Number(produto.id) &&
                          (c.tipo ?? "normal") === (produto.tipo ?? "normal"),
                      );
                      return (
                        <Box
                          key={`${produto.tipo ?? "normal"}-${produto.id}`}
                          component="button"
                          type="button"
                          onClick={() => handleAdicionarAoCarrinho(produto)}
                          sx={{
                            p: 1,
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                            textAlign: "left",
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: noCupom ? "primary.main" : "divider",
                            borderRadius: 1,
                            bgcolor: noCupom
                              ? alpha(theme.palette.primary.main, 0.08)
                              : "background.paper",
                            font: "inherit",
                            color: "inherit",
                            transition: "background-color 0.2s",
                            "&:hover": {
                              bgcolor: "action.hover",
                              borderColor: "primary.main",
                            },
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {produto.nome || "Produto"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {produto.sku
                                ? `SKU ${produto.sku}`
                                : `#${produto.id}`}
                            </Typography>
                          </Box>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{ flexShrink: 0 }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              color="primary.main"
                            >
                              R$ {preco.toFixed(2)}
                            </Typography>
                            <Box
                              component="span"
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                color: "primary.main",
                              }}
                            >
                              <Add fontSize="small" />
                            </Box>
                          </Stack>
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
                    Itens da venda
                  </Typography>
                  {carrinho.length > 0 && (
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "text.secondary",
                      }}
                    >
                      Clique na linha para ver a foto
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
                        <TableCell width={56} align="center">
                          Foto
                        </TableCell>
                        <TableCell width={100}>Código</TableCell>
                        <TableCell>Descrição</TableCell>
                        <TableCell align="center" width={120}>
                          Qtd.
                        </TableCell>
                        <TableCell align="right" width={96}>
                          P. Unit.
                        </TableCell>
                        <TableCell align="right" width={108}>
                          Preço
                        </TableCell>
                        <TableCell align="center" width={64}>
                          Vend.
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {carrinho.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} sx={{ borderBottom: "none" }}>
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
                                Use a busca acima ou pressione{" "}
                                <strong>F5</strong> para abrir o catálogo.
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        carrinho.map((item) => {
                          const codigo = item.sku || `#${item.id}`;
                          const totalLinha = item.precoVenda * item.quantidade;
                          const selecionada = itemSelecionadoId === item.chave;
                          return (
                            <TableRow
                              key={item.chave}
                              hover
                              onClick={() => setItemSelecionadoId(item.chave)}
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
                                    handleRemoverProduto(item.chave);
                                  }}
                                  sx={{ color: "error.main" }}
                                  aria-label="Remover"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </TableCell>
                              <TableCell align="center" sx={{ py: 0.5 }}>
                                {selecionada
                                  ? (() => {
                                      const imgUrl = getProdutoImagem(item);
                                      return imgUrl ? (
                                        <Box
                                          component="img"
                                          src={imgUrl}
                                          alt={item.nome}
                                          sx={{
                                            width: 44,
                                            height: 44,
                                            objectFit: "cover",
                                            borderRadius: 1,
                                            border: "1px solid",
                                            borderColor: "divider",
                                          }}
                                          onError={(e) => {
                                            e.currentTarget.style.display =
                                              "none";
                                          }}
                                        />
                                      ) : (
                                        <ImageNotSupported
                                          sx={{
                                            fontSize: 22,
                                            color: "text.disabled",
                                          }}
                                        />
                                      );
                                    })()
                                  : null}
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
                                    disabled={isProdutoBazar(item)}
                                    onClick={() =>
                                      handleAlterarQuantidade(
                                        item.chave,
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
                                    disabled={isProdutoBazar(item)}
                                    onClick={() =>
                                      handleAlterarQuantidade(
                                        item.chave,
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
                                R$ {item.precoVenda.toFixed(2)}
                              </TableCell>
                              <TableCell
                                align="right"
                                sx={{
                                  fontWeight: 800,
                                  whiteSpace: "nowrap",
                                  color: "primary.main",
                                }}
                              >
                                R$ {totalLinha.toFixed(2)}
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

            {/* Sidebar direita */}
            <Grid
              size={{ xs: 12, lg: 3 }}
              sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0 }}>
                <SummaryCard
                  label="Itens"
                  value={String(carrinho.length)}
                  isDark={isDark}
                />
                <SummaryCard
                  label="Valor"
                  value={fmtBRL(calcularSubtotal())}
                  isDark={isDark}
                />
                <SummaryCard
                  label="Desconto"
                  value={desconto}
                  editable
                  onChange={setDesconto}
                  valuePrefix="R$"
                  isDark={isDark}
                />
                <SummaryCard
                  label="Valor Líquido"
                  value={fmtBRL(calcularTotal())}
                  highlight
                  isDark={isDark}
                />
              </Stack>
            </Grid>
          </Grid>
        ) : (
          // ════════════════════════════════════════════════
          // TAB: FINALIZAÇÃO
          // ════════════════════════════════════════════════
          <Grid
            container
            spacing={1.5}
            sx={{
              flex: 1,
              minHeight: 0,
              p: { xs: 1, md: 1.5 },
              m: 0,
              overflow: "auto",
            }}
          >
            <Grid
              size={{ xs: 12, lg: 9 }}
              sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
            >
              {/* Bloco Cliente */}
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: clienteSelecionado
                      ? alpha(theme.palette.primary.main, 0.25)
                      : alpha(theme.palette.text.disabled, 0.18),
                    color: clienteSelecionado
                      ? "primary.main"
                      : "text.disabled",
                  }}
                >
                  {clienteSelecionado ? (
                    (clienteSelecionado.nome || "?").charAt(0).toUpperCase()
                  ) : (
                    <Person />
                  )}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Cliente
                  </Typography>
                  <Typography
                    sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}
                  >
                    {clienteSelecionado
                      ? clienteSelecionado.nome
                      : "Não informado"}
                  </Typography>
                  {clienteSelecionado?.cpf ? (
                    <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                      CPF: {clienteSelecionado.cpf}
                    </Typography>
                  ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={abrirDialogCliente}
                    startIcon={<PersonSearch />}
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    {clienteSelecionado ? "Trocar" : "Selecionar"}
                  </Button>
                  {clienteSelecionado ? (
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      onClick={() => setClienteSelecionado(null)}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      Limpar
                    </Button>
                  ) : null}
                </Stack>
              </Paper>

              {/* Observação */}
              <TextField
                label="Observação"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                size="small"
                multiline
                minRows={1}
                maxRows={2}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: ticket.clienteInputBg,
                  },
                }}
              />

              {/* Bloco Pagamento */}
              <Paper
                variant="outlined"
                sx={{ p: 1.5, bgcolor: "background.paper" }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 13,
                    color: isDark ? "primary.light" : "#1565c0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    mb: 1.25,
                  }}
                >
                  Forma de Pagamento
                </Typography>

                {/* Toggle condição (visual) */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    mb: 1.5,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "text.secondary",
                      mr: 1,
                    }}
                  >
                    Condição:
                  </Typography>
                  {["aVista", "aPrazo"].map((c) => (
                    <Button
                      key={c}
                      size="small"
                      variant={
                        condicaoPagamento === c ? "contained" : "outlined"
                      }
                      onClick={() => setCondicaoPagamento(c)}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        minWidth: 90,
                      }}
                    >
                      {c === "aVista" ? "À Vista" : "À Prazo"}
                    </Button>
                  ))}
                </Box>

                <Grid container spacing={1}>
                  {FORMAS_PAGAMENTO.map((forma) => {
                    const IconF = forma.Icon;
                    const selected = formaPagamento === forma.id;
                    return (
                      <Grid size={{ xs: 6, sm: 3 }} key={forma.id}>
                        <Paper
                          component="button"
                          type="button"
                          onClick={() => {
                            setFormaPagamento(forma.id);
                            if (forma.id !== "dinheiro") setValorRecebido("");
                            if (forma.id !== "credito" && forma.id !== "debito")
                              setParcelas(1);
                          }}
                          elevation={0}
                          sx={{
                            width: "100%",
                            minHeight: 86,
                            p: 1.25,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.5,
                            cursor: "pointer",
                            border: "2px solid",
                            borderColor: selected ? "primary.main" : "divider",
                            bgcolor: selected
                              ? alpha(theme.palette.primary.main, 0.14)
                              : "background.paper",
                            font: "inherit",
                            color: "inherit",
                            transition: "all 0.2s ease-out",
                            transform: selected ? "scale(1.02)" : "scale(1)",
                            boxShadow: selected
                              ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                              : "none",
                            "&:hover": { borderColor: "primary.main" },
                          }}
                        >
                          <IconF
                            sx={{
                              fontSize: 28,
                              color: selected
                                ? "primary.main"
                                : "text.secondary",
                            }}
                          />
                          <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                            {forma.label}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Extras */}
                {formaPagamento === "dinheiro" && (
                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    <TextField
                      fullWidth
                      size="small"
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
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: ticket.clienteInputBg,
                        },
                      }}
                    />
                    {valorRecebido ? (
                      <Alert
                        severity={calcularTroco() >= 0 ? "success" : "error"}
                        variant="outlined"
                      >
                        Troco: <strong>R$ {calcularTroco().toFixed(2)}</strong>
                      </Alert>
                    ) : null}
                  </Stack>
                )}

                {(formaPagamento === "credito" ||
                  formaPagamento === "debito") && (
                  <FormControl
                    fullWidth
                    size="small"
                    sx={{
                      mt: 1.5,
                      "& .MuiOutlinedInput-root": {
                        bgcolor: ticket.clienteInputBg,
                      },
                    }}
                  >
                    <InputLabel id="pdv-parcelas-label">Parcelas</InputLabel>
                    <Select
                      labelId="pdv-parcelas-label"
                      label="Parcelas"
                      value={parcelas}
                      onChange={(e) => setParcelas(Number(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <MenuItem key={n} value={n}>
                          {n}x
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {formaPagamento === "pix" && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 2,
                      borderRadius: 2,
                      border: "2px dashed",
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      textAlign: "center",
                      bgcolor: ticket.clienteInputBg,
                    }}
                  >
                    <QrCode2
                      sx={{
                        fontSize: 56,
                        color: alpha(theme.palette.primary.main, 0.5),
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Confirme o PIX no app do banco antes de gravar
                    </Typography>
                  </Box>
                )}
              </Paper>

              {/* Tabela de parcelas (visual) */}
              {parcelasVisuais.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{ overflow: "hidden", bgcolor: "background.paper" }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      bgcolor: ticket.headerBg,
                      borderBottom: "1px solid",
                      borderColor: "divider",
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
                      Parcelas
                    </Typography>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            "& th": {
                              bgcolor: ticket.theadBg,
                              fontWeight: 700,
                              fontSize: 11,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            },
                          }}
                        >
                          <TableCell width={80}>Parcela</TableCell>
                          <TableCell width={100}>Tipo</TableCell>
                          <TableCell>Meio de Pagamento</TableCell>
                          <TableCell width={120}>Vencimento</TableCell>
                          <TableCell width={120} align="right">
                            Valor
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parcelasVisuais.map((p, idx) => (
                          <TableRow
                            key={p.parcela}
                            sx={{
                              "& td": { borderColor: ticket.rowBorder },
                              bgcolor:
                                idx % 2 === 0
                                  ? "background.paper"
                                  : ticket.rowStripe,
                            }}
                          >
                            <TableCell sx={{ fontWeight: 700 }}>
                              {p.parcela}
                            </TableCell>
                            <TableCell>{p.tipo}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {p.meio}
                            </TableCell>
                            <TableCell>{p.vencimento}</TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 800, color: "primary.main" }}
                            >
                              R$ {p.valor.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Grid>

            {/* Sidebar Finalização */}
            <Grid
              size={{ xs: 12, lg: 3 }}
              sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              <Stack spacing={1.25}>
                <SummaryCard
                  label="Valor Total"
                  value={fmtBRL(calcularSubtotal())}
                  isDark={isDark}
                />
                <SummaryCard
                  label="Desconto"
                  value={desconto}
                  editable
                  onChange={setDesconto}
                  valuePrefix="R$"
                  isDark={isDark}
                />
                <SummaryCard
                  label="Acréscimo"
                  value={acrescimo}
                  editable
                  onChange={setAcrescimo}
                  valuePrefix="R$"
                  isDark={isDark}
                />
                <SummaryCard
                  label="Crédito Cliente"
                  value="R$ 0,00"
                  isDark={isDark}
                />
                <SummaryCard label="Cashback" value="R$ 0,00" isDark={isDark} />
                <SummaryCard
                  label="Valor Líquido"
                  value={fmtBRL(calcularTotal())}
                  highlight
                  isDark={isDark}
                />
              </Stack>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* ═══ Footer (sticky) ═══ */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: "2px solid",
          borderColor: "divider",
          px: { xs: 1.5, md: 2.5 },
          py: 1.25,
          bgcolor: "background.paper",
          display: "flex",
          gap: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="outlined"
          color="error"
          size="large"
          onClick={cancelarVenda}
          disabled={carrinho.length === 0 && !clienteSelecionado}
          sx={{ textTransform: "none", fontWeight: 800, minWidth: 140 }}
        >
          Cancelar
        </Button>

        {etapaPdv === "itens" ? (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={irParaPagamento}
            disabled={!podeIrParaPagamento()}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              minWidth: 220,
              py: 1.1,
              boxShadow: (t) =>
                `0 4px 16px ${alpha(t.palette.primary.main, 0.4)}`,
              "&.Mui-disabled": { opacity: 0.55 },
            }}
          >
            Finalização →
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="large"
              onClick={voltarDePagamento}
              startIcon={<ArrowBack />}
              sx={{ textTransform: "none", fontWeight: 700, minWidth: 140 }}
            >
              Retornar
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={confirmarPagamento}
              disabled={!podeConfirmarPagamento()}
              startIcon={<CheckCircle />}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                minWidth: 180,
                py: 1.1,
                color: "#fff",
                bgcolor: "success.dark",
                "&:hover": { bgcolor: "success.main" },
                "&.Mui-disabled": { opacity: 0.55 },
              }}
            >
              Gravar
            </Button>
          </Stack>
        )}
      </Box>

      {/* ═══════════ Dialog: Catálogo de Produtos ═══════════ */}
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
          <Typography
            component="span"
            variant="h6"
            sx={{ flex: 1, fontWeight: 800 }}
          >
            Buscar produtos
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={fecharCatalogoProdutos}
            aria-label="Fechar catálogo"
          >
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1, flexShrink: 0 }}
          >
            Toque para adicionar. Itens já no cupom aparecem destacados.
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {carregandoProdutos ? (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ py: 4 }}
              >
                Carregando…
              </Typography>
            ) : produtosFiltrados.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ py: 4 }}
              >
                {searchProduto.trim()
                  ? "Nenhum produto encontrado."
                  : "Nenhum produto cadastrado."}
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                {produtosFiltrados.map((produto) => {
                  const preco =
                    Number(produto.precoVenda ?? produto.precoCusto ?? 0) || 0;
                  const itemCarrinho = carrinho.find(
                    (c) =>
                      Number(c.id) === Number(produto.id) &&
                      (c.tipo ?? "normal") === (produto.tipo ?? "normal"),
                  );
                  const noCupom = !!itemCarrinho;
                  return (
                    <Paper
                      key={`${produto.tipo ?? "normal"}-${produto.id}`}
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
                        transition:
                          "background-color 0.2s, border-color 0.2s, box-shadow 0.2s",
                        boxShadow: noCupom
                          ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.45)}`
                          : "none",
                        "&:hover": {
                          borderColor: "primary.main",
                          boxShadow: 1,
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                          alignItems: "flex-start",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="text.primary"
                              sx={{ lineHeight: 1.3 }}
                            >
                              {produto.nome || "Produto"}
                            </Typography>
                            {noCupom ? (
                              <Chip
                                size="small"
                                label={`${itemCarrinho.quantidade} no cupom`}
                                color="primary"
                                sx={{
                                  height: 22,
                                  fontWeight: 800,
                                  "& .MuiChip-label": { px: 1 },
                                }}
                              />
                            ) : null}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {produto.sku
                              ? `SKU ${produto.sku}`
                              : `#${produto.id}`}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          {noCupom ? (
                            <CheckCircle
                              sx={{ fontSize: 22, color: "primary.main" }}
                              aria-hidden
                            />
                          ) : null}
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color="primary.main"
                          >
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
        <DialogActions
          sx={{
            px: 2,
            py: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            onClick={fecharCatalogoProdutos}
            sx={{ textTransform: "none" }}
            variant="contained"
            color="inherit"
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════ Dialog: Buscar Cliente ═══════════ */}
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
          <Typography
            component="span"
            variant="h6"
            sx={{ flex: 1, fontWeight: 800 }}
          >
            Buscar cliente
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={fecharDialogCliente}
            aria-label="Fechar busca de cliente"
          >
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1, flexShrink: 0 }}
          >
            Toque em um cliente para selecionar e fechar. Um cliente por venda.
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {carregandoClientesBusca ? (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ py: 4 }}
              >
                Carregando…
              </Typography>
            ) : clientesBusca.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={{ py: 4 }}
              >
                {searchClienteBusca.trim()
                  ? "Nenhum cliente encontrado."
                  : "Nenhum cliente na lista. Digite para buscar."}
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
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="text.primary"
                  >
                    Venda sem cliente
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Não vincular cliente a esta venda
                  </Typography>
                </Paper>
                {clientesBusca.map((c) => {
                  const nome =
                    c.nomeCompleto ??
                    c.NomeCompleto ??
                    c.nome ??
                    c.Nome ??
                    `Cliente #${c.id ?? c.Id}`;
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
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="text.primary"
                        sx={{ lineHeight: 1.3 }}
                      >
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
        <DialogActions
          sx={{
            px: 2,
            py: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            onClick={fecharDialogCliente}
            sx={{ textTransform: "none" }}
            variant="contained"
            color="inherit"
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Overlay: Caixa fechado bloqueia vendas ═══ */}
      {!caixaAberto && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            backgroundColor: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              p: 4,
              maxWidth: 440,
              textAlign: "center",
              borderRadius: 2,
            }}
          >
            <Lock sx={{ fontSize: 56, color: "error.main", mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Caixa fechado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Para realizar vendas você precisa abrir o caixa. Vá até a tela de Caixa e clique em <strong>Abrir Caixa</strong>.
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={<PointOfSale />}
              onClick={() => navigate("/caixa")}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Ir para o Caixa
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default Caixa;
