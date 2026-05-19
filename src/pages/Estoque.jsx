import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  Grid,
  InputAdornment,
  Alert,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Inventory,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Search,
  Warning,
  CheckCircle,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { comprasService } from "../api/comprasService";
import { vendasService } from "../api/vendasService";
import { LoadingBox } from "../components/LoadingBox";

const TIPOS_MOVIMENTACAO = {
  entrada: { label: "Entrada", icon: <TrendingUp />, color: "#16a34a" },
  saida: { label: "Saída", icon: <TrendingDown />, color: "#dc2626" },
  ajuste: { label: "Ajuste", icon: <SwapHoriz />, color: "#F8F32B" },
  inventario: { label: "Inventário", icon: <Inventory />, color: "#9333ea" },
};

// Componente de Paginação Reutilizável - FORA do componente principal
const PaginationControls = ({
  paginaAtual,
  totalPaginas,
  indiceInicial,
  indiceFinal,
  totalItens,
  itemLabel,
  onPrimeira,
  onAnterior,
  onProxima,
  onUltima,
  onPagina,
}) => {
  if (totalItens === 0) return null;

  return (
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
      <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "14px" }}>
        Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, totalItens)} de{" "}
        {totalItens} {totalItens === 1 ? itemLabel : `${itemLabel}s`}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={onPrimeira}
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
          onClick={onAnterior}
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
                    onClick={() => onPagina(numeroPagina)}
                    size="small"
                    sx={{
                      minWidth: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: paginaAtual === numeroPagina ? "primary.contrastText" : "text.secondary",
                      bgcolor:
                        paginaAtual === numeroPagina
                          ? "primary.main"
                          : "transparent",
                      "&:hover": {
                        bgcolor:
                          paginaAtual === numeroPagina ? "primary.dark" : "action.hover",
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
          onClick={onProxima}
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
          onClick={onUltima}
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
  );
};

function Estoque() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [tabAtual, setTabAtual] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [carregando, setCarregando] = useState(true);

  // Estados para paginação
  const [paginaAtualEntradas, setPaginaAtualEntradas] = useState(1);
  const [paginaAtualMovimentacoes, setPaginaAtualMovimentacoes] = useState(1);
  const itensPorPagina = 10;

  const [produtos, setProdutos] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function carregarEstoque() {
      setCarregando(true);
      try {
        const [comprasRes, vendasRes] = await Promise.all([
          comprasService.getAll(),
          vendasService.getAll(),
        ]);

        if (cancelled) return;

        const comprasList = Array.isArray(comprasRes)
          ? comprasRes
          : comprasRes?.compras ?? comprasRes?.items ?? comprasRes?.data ?? [];
        const vendasList = Array.isArray(vendasRes)
          ? vendasRes
          : vendasRes?.vendas ?? vendasRes?.items ?? vendasRes?.data ?? [];

        // Produtos apenas de compras recebidas (estoque atualizado pelas compras)
        const comprasRecebidas = (Array.isArray(comprasList) ? comprasList : []).filter(
          (c) => (c.status || "").toLowerCase() === "recebida"
        );

        const mapaProdutos = {}; // produtoId -> { id, nome, sku, entradas, saidas, valorUnitario, estoqueMinimo, estoqueMaximo }

        for (const compra of comprasRecebidas) {
          const itens = compra.itens ?? compra.items ?? [];
          for (const item of itens) {
            const produtoId = item.produtoId ?? item.produto?.id;
            if (!produtoId) continue;
            const produto = item.produto ?? {};
            const nome = produto.nome ?? item.produtoNome ?? item.nome ?? "Produto";
            const sku = produto.sku ?? item.produtoSku ?? item.sku ?? `#${produtoId}`;
            const qty = Number(item.quantidade) || 0;
            const preco = Number(item.precoUnitario ?? produto.precoVenda ?? produto.precoCusto ?? 0) || 0;

            if (!mapaProdutos[produtoId]) {
              mapaProdutos[produtoId] = {
                id: produtoId,
                nome,
                sku,
                entradas: 0,
                saidas: 0,
                valorUnitario: preco,
                estoqueMinimo: produto.estoqueMinimo ?? 0,
                estoqueMaximo: produto.estoqueMaximo ?? 999,
              };
            }
            mapaProdutos[produtoId].entradas += qty;
            if (preco > 0 && (!mapaProdutos[produtoId].valorUnitario || mapaProdutos[produtoId].valorUnitario === 0)) {
              mapaProdutos[produtoId].valorUnitario = preco;
            }
          }
        }

        // Subtrair saídas das vendas (somente vendas concluídas, excluir canceladas)
        for (const venda of vendasList) {
          const status = (venda.status || "").toLowerCase();
          if (status === "cancelada") continue;
          const itens = venda.itens ?? venda.items ?? [];
          for (const item of itens) {
            const produtoId = item.produtoId ?? item.produto?.id;
            if (!produtoId) continue;
            const qty = Number(item.quantidade) || 0;
            if (mapaProdutos[produtoId]) {
              mapaProdutos[produtoId].saidas += qty;
            }
          }
        }

        const produtosEstoque = Object.values(mapaProdutos).map((p) => ({
          id: p.id,
          nome: p.nome,
          sku: p.sku,
          estoqueAtual: Math.max(0, p.entradas - p.saidas),
          estoqueMinimo: p.estoqueMinimo,
          estoqueMaximo: p.estoqueMaximo,
          valorUnitario: p.valorUnitario,
        }));

        setProdutos(produtosEstoque);

        // ─── Entradas (compras recebidas) — cada item é uma entrada ──────────
        const entradasList = [];
        let entradaId = 1;
        const comprasOrdenadas = [...comprasRecebidas].sort(
          (a, b) =>
            new Date(b.dataPedido || b.data || b.createdAt || 0) -
            new Date(a.dataPedido || a.data || a.createdAt || 0)
        );

        for (const compra of comprasOrdenadas) {
          const itens = compra.itens ?? compra.items ?? [];
          const dataCompra = compra.dataPedido ?? compra.data ?? compra.createdAt ?? new Date().toISOString();
          const fornecedor =
            compra.fornecedor?.razaoSocial ??
            compra.fornecedor?.nome ??
            compra.fornecedorNome ??
            (typeof compra.fornecedor === "string" ? compra.fornecedor : "") ??
            "—";
          const compraNumero = compra.id ?? entradaId;

          for (const item of itens) {
            const produto = item.produto ?? {};
            const produtoNome = produto.nome ?? item.nomeProduto ?? item.produtoNome ?? item.nome ?? "Produto";
            const produtoSku = produto.sku ?? item.produtoSku ?? item.sku ?? "";
            const quantidade = Number(item.quantidade) || 0;
            const precoUnitario = Number(item.precoUnitario ?? produto.precoCusto ?? produto.precoVenda ?? 0) || 0;
            if (quantidade <= 0) continue;

            entradasList.push({
              id: entradaId++,
              timestamp: dataCompra,
              tipo: "entrada",
              origem: "compra",
              origemLabel: `Compra #${compraNumero}`,
              produtoNome,
              produtoSku,
              quantidade,
              precoUnitario,
              subtotal: quantidade * precoUnitario,
              motivo: `Compra #${compraNumero}`,
              observacoes: fornecedor ? `Fornecedor: ${fornecedor}` : "—",
            });
          }
        }

        setEntradas(entradasList);

        // ─── Saídas (vendas) — cada item é uma saída ─────────────────────────
        const saidasList = [];
        let saidaId = 1;
        const vendasOrdenadas = [...vendasList]
          .filter((v) => (v.status || "").toLowerCase() !== "cancelada")
          .sort((a, b) => new Date(b.dataVenda || b.data || b.createdAt || 0) - new Date(a.dataVenda || a.data || a.createdAt || 0));

        for (const venda of vendasOrdenadas) {
          const itens = venda.itens ?? venda.items ?? [];
          const dataVenda = venda.dataVenda ?? venda.data ?? venda.createdAt ?? new Date().toISOString();
          const vendaNumero = venda.id ?? saidaId;

          for (const item of itens) {
            const produto = item.produto ?? {};
            const produtoNome = produto.nome ?? item.nomeProduto ?? item.produtoNome ?? item.nome ?? "Produto";
            const produtoSku = produto.sku ?? item.produtoSku ?? item.sku ?? "";
            const quantidade = Number(item.quantidade) || 0;
            if (quantidade <= 0) continue;

            saidasList.push({
              id: `saida-${saidaId++}`,
              timestamp: dataVenda,
              tipo: "saida",
              origem: "venda",
              origemLabel: `Venda #${vendaNumero}`,
              produtoNome,
              produtoSku,
              quantidade,
              motivo: `Venda #${vendaNumero}`,
              observacoes: venda.observacoes ?? ((venda.nomeCliente || venda.cliente) ? `Cliente: ${venda.nomeCliente || venda.cliente}` : "—"),
            });
          }
        }

        // ─── Movimentações = Entradas + Saídas (ordenado por data desc) ──────
        const todasMovs = [
          ...entradasList.map((e) => ({ ...e, id: `entrada-${e.id}` })),
          ...saidasList,
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setMovimentacoes(todasMovs);
      } catch (err) {
        if (!cancelled) {
          console.error("Erro ao carregar estoque:", err);
          setProdutos([]);
          setEntradas([]);
          setMovimentacoes([]);
        }
      } finally {
        if (!cancelled) setCarregando(false);
      }
    }

    carregarEstoque();
    return () => { cancelled = true; };
  }, []);

  const calcularValorEstoque = () => {
    return produtos.reduce(
      (acc, p) => acc + p.estoqueAtual * p.valorUnitario,
      0,
    );
  };

  // Filtro de entradas (busca por nome do produto, SKU ou origem)
  const entradasFiltradas = entradas.filter((e) => {
    const t = searchTerm.toLowerCase();
    if (!t) return true;
    return (
      (e.produtoNome || "").toLowerCase().includes(t) ||
      (e.produtoSku || "").toLowerCase().includes(t) ||
      (e.origemLabel || "").toLowerCase().includes(t)
    );
  });

  // Cálculos de paginação para entradas
  const totalPaginasEntradas = Math.ceil(
    entradasFiltradas.length / itensPorPagina,
  );
  const indiceInicialEntradas = (paginaAtualEntradas - 1) * itensPorPagina;
  const indiceFinalEntradas = indiceInicialEntradas + itensPorPagina;
  const entradasPaginadas = entradasFiltradas.slice(
    indiceInicialEntradas,
    indiceFinalEntradas,
  );

  // Cálculos de paginação para movimentações
  const totalPaginasMovimentacoes = Math.ceil(
    movimentacoes.length / itensPorPagina,
  );
  const indiceInicialMovimentacoes =
    (paginaAtualMovimentacoes - 1) * itensPorPagina;
  const indiceFinalMovimentacoes = indiceInicialMovimentacoes + itensPorPagina;
  const movimentacoesPaginadas = movimentacoes.slice(
    indiceInicialMovimentacoes,
    indiceFinalMovimentacoes,
  );

  // Funções de navegação - Entradas
  const irParaPrimeiraPaginaEntradas = () => setPaginaAtualEntradas(1);
  const irParaUltimaPaginaEntradas = () =>
    setPaginaAtualEntradas(totalPaginasEntradas);
  const irParaPaginaAnteriorEntradas = () =>
    setPaginaAtualEntradas((prev) => Math.max(prev - 1, 1));
  const irParaProximaPaginaEntradas = () =>
    setPaginaAtualEntradas((prev) => Math.min(prev + 1, totalPaginasEntradas));

  // Funções de navegação - Movimentações
  const irParaPrimeiraPaginaMovimentacoes = () =>
    setPaginaAtualMovimentacoes(1);
  const irParaUltimaPaginaMovimentacoes = () =>
    setPaginaAtualMovimentacoes(totalPaginasMovimentacoes);
  const irParaPaginaAnteriorMovimentacoes = () =>
    setPaginaAtualMovimentacoes((prev) => Math.max(prev - 1, 1));
  const irParaProximaPaginaMovimentacoes = () =>
    setPaginaAtualMovimentacoes((prev) =>
      Math.min(prev + 1, totalPaginasMovimentacoes),
    );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPaginaAtualEntradas(1);
  };

  const handleTabChange = (e, newValue) => {
    setTabAtual(newValue);
    // Mantém as páginas atuais ao trocar de aba
  };

  if (carregando) {
    return <LoadingBox />;
  }

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "background.default",
        minHeight: "100vh",
        color: "text.primary",
      }}
    >
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
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
              Estoque
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
              Consulta de estoque. O estoque é atualizado automaticamente pelas compras recebidas.
            </Typography>
          </Box>
        </Box>

        {/* Stats inline — sem boxes */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 0 }}
          divider={<Divider orientation="vertical" flexItem sx={{ borderColor: "divider" }} />}
          sx={{
            mb: 3,
            py: 2,
            px: { xs: 0, md: 1 },
            alignItems: { xs: "flex-start", md: "stretch" },
          }}
        >
          {[
            {
              icon: <Inventory sx={{ fontSize: 20 }} />,
              color: theme.palette.primary.main,
              label: "Total de Produtos",
              value: produtos.length.toString(),
            },
            {
              icon: <Warning sx={{ fontSize: 20 }} />,
              color: "#f59e0b",
              label: "Estoque Baixo",
              value: produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo).length.toString(),
            },
            {
              icon: <CheckCircle sx={{ fontSize: 20 }} />,
              color: isDark ? "#22c55e" : "#16a34a",
              label: "Itens em Estoque",
              value: produtos.reduce((acc, p) => acc + p.estoqueAtual, 0).toString(),
            },
            {
              icon: <TrendingUp sx={{ fontSize: 20 }} />,
              color: isDark ? "#22c55e" : "#16a34a",
              label: "Valor Total",
              value: `R$ ${calcularValorEstoque().toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              accent: true,
            },
          ].map((s) => (
            <Box
              key={s.label}
              sx={{
                flex: 1,
                px: { xs: 0, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(s.color, isDark ? 0.18 : 0.12),
                    color: s.color,
                  }}
                >
                  {s.icon}
                </Box>
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "text.secondary",
                  }}
                >
                  {s.label}
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: 28,
                  lineHeight: 1.1,
                  color: s.accent ? s.color : "text.primary",
                  wordBreak: "break-word",
                }}
              >
                {s.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
                borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: "1px solid",
          borderColor: "divider", px: 3 }}>
          <Tabs
            value={tabAtual}
            onChange={handleTabChange}
            sx={{
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
            <Tab label="Entradas" />
            <Tab label="Movimentações" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Tab Entradas (compras + devoluções de compra) */}
          {tabAtual === 0 && (
            <Box>
              <TextField
                fullWidth
                placeholder="Buscar entrada por produto, SKU ou origem..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  bgcolor: "background.paper",
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

              <TableContainer
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px" }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px", py: 2 }}>
                        DATA
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
                        PRODUTO
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
                        SKU
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
                        QUANTIDADE
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
                        VALOR UNIT.
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
                        SUBTOTAL
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
                        ORIGEM
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entradasPaginadas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8, color: "text.secondary" }}>
                          <TrendingUp sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                          <Typography variant="body1">
                            Nenhuma entrada registrada
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            As entradas vêm das compras recebidas e devoluções de compra.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      entradasPaginadas.map((entrada, index) => (
                        <TableRow
                          key={entrada.id}
                          sx={{
                            "&:hover": { bgcolor: "action.hover" },
                            borderBottom:
                              index === entradasPaginadas.length - 1
                                ? "none"
                                : "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <TableCell sx={{ py: 2.5 }}>
                            <Typography variant="body2" sx={{ color: "text.primary", fontWeight: 500 }}>
                              {new Date(entrada.timestamp).toLocaleDateString("pt-BR")}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              {new Date(entrada.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                              {entrada.produtoNome}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={entrada.produtoSku || "—"}
                              size="small"
                              sx={{ bgcolor: "action.hover", fontSize: "11px" }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main", fontSize: "15px" }}>
                              + {entrada.quantidade}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500, fontSize: "14px" }}>
                            R$ {entrada.precoUnitario.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: "14px", color: "primary.main" }}>
                            R$ {entrada.subtotal.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={<TrendingUp sx={{ fontSize: 14 }} />}
                              label={entrada.origemLabel}
                              size="small"
                              sx={{
                                bgcolor: alpha("#16a34a", isDark ? 0.18 : 0.12),
                                color: isDark ? "#22c55e" : "#16a34a",
                                fontWeight: 600,
                                fontSize: "11px",
                                "& .MuiChip-icon": { color: "inherit" },
                              }}
                            />
                            <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
                              {entrada.observacoes}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <PaginationControls
                  paginaAtual={paginaAtualEntradas}
                  totalPaginas={totalPaginasEntradas}
                  indiceInicial={indiceInicialEntradas}
                  indiceFinal={indiceFinalEntradas}
                  totalItens={entradasFiltradas.length}
                  itemLabel="entrada"
                  onPrimeira={irParaPrimeiraPaginaEntradas}
                  onAnterior={irParaPaginaAnteriorEntradas}
                  onProxima={irParaProximaPaginaEntradas}
                  onUltima={irParaUltimaPaginaEntradas}
                  onPagina={setPaginaAtualEntradas}
                />
              </TableContainer>
            </Box>
          )}

          {/* Tab Movimentações */}
          {tabAtual === 1 && (
            <Box>
              <TableContainer
                sx={{ border: "1px solid",
                borderColor: "divider", borderRadius: "8px" }}
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
                        DATA/HORA
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        TIPO
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        PRODUTO
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        QUANTIDADE
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        MOTIVO
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        OBSERVAÇÕES
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimentacoesPaginadas.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          sx={{ py: 8, color: "text.secondary" }}
                        >
                          <SwapHoriz
                            sx={{ fontSize: 48, mb: 2, opacity: 0.5 }}
                          />
                          <Typography variant="body1">
                            Nenhuma movimentação registrada
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Aqui aparecem todas as movimentações do sistema (entradas de compras e saídas de vendas).
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentacoesPaginadas.map((mov, index) => {
                        const tipo = TIPOS_MOVIMENTACAO[mov.tipo];
                        return (
                          <TableRow
                            key={mov.id}
                            sx={{
                              "&:hover": { bgcolor: "action.hover" },
                              borderBottom:
                                index === movimentacoesPaginadas.length - 1
                                  ? "none"
                                  : "1px solid",
                                  borderColor: "divider",
                            }}
                          >
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {new Date(mov.timestamp).toLocaleString(
                                  "pt-BR",
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={tipo.icon}
                                label={tipo.label}
                                size="small"
                                sx={{
                                  bgcolor: `${tipo.color}20`,
                                  color: tipo.color,
                                  fontWeight: 500,
                                  fontSize: "12px",
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, color: "text.primary" }}
                              >
                                {mov.produtoNome}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {mov.produtoSku}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color:
                                    mov.tipo === "saida"
                                      ? "error.main"
                                      : "success.main",
                                }}
                              >
                                {mov.tipo === "saida" ? "-" : "+"}
                                {mov.quantidade}
                              </Typography>
                            </TableCell>
                            <TableCell
                              sx={{ color: "text.secondary", fontSize: "14px" }}
                            >
                              {mov.motivo || "—"}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {mov.observacoes || "—"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Paginação - Movimentações */}
                <PaginationControls
                  paginaAtual={paginaAtualMovimentacoes}
                  totalPaginas={totalPaginasMovimentacoes}
                  indiceInicial={indiceInicialMovimentacoes}
                  indiceFinal={indiceFinalMovimentacoes}
                  totalItens={movimentacoes.length}
                  itemLabel="movimentação"
                  onPrimeira={irParaPrimeiraPaginaMovimentacoes}
                  onAnterior={irParaPaginaAnteriorMovimentacoes}
                  onProxima={irParaProximaPaginaMovimentacoes}
                  onUltima={irParaUltimaPaginaMovimentacoes}
                  onPagina={setPaginaAtualMovimentacoes}
                />
              </TableContainer>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default Estoque;
