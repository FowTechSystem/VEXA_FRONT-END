// src/pages/Vendas.jsx — Caixa (movimentações)
// Layout padronizado com o PDV/Condicional — fullscreen, grid, sem boxes coloridos.
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { vexaColors } from "../theme";
import {
  Search,
  Refresh,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  Receipt,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  CalendarToday,
  Close,
  Person,
  Payment,
  FileDownload,
  Add,
} from "@mui/icons-material";
import { caixaService } from "../api/caixaService";
import { vendasService } from "../api/vendasService";
import { comprasService } from "../api/comprasService";
import { showSuccess, showError, showWarning } from "../utils/notifications";
import {
  resolverTipoMovimentacaoLinha,
  valorMovimentacaoAssinado,
} from "../utils/movimentacaoCaixa";
import { useInAppNotifications } from "../contexts/InAppNotificationContext";
import NovaMovimentacaoDialog from "../components/Caixa/NovaMovimentacaoDialog";
import VexaDatePicker from "../components/VexaDatePicker";

const fmtBRL = (v) =>
  `R$ ${(Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function apiErrMessage(err) {
  const d = err?.response?.data;
  if (d && typeof d === "object" && d.message != null) return String(d.message);
  if (typeof d === "string" && d.trim()) return d;
  return err?.message || "Operação não concluída.";
}

// ─── Helper: Summary card (sidebar) ─────────────────────────────────────────
function SummaryCard({ label, value, color, accent, isDark }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: accent ? "2px solid" : "1px solid",
        borderColor: accent ? color : "divider",
        bgcolor: "background.paper",
        background: accent ? alpha(color, isDark ? 0.1 : 0.06) : undefined,
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
          fontSize: accent ? 22 : 18,
          color: accent ? color : "text.primary",
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

function Movimentacoes() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDark = theme.palette.mode === "dark";
  const { sincronizarMovimentacoesDoCaixa } = useInAppNotifications();

  // ─── Estado ────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [anchorEl, setAnchorEl] = useState(null);
  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [excluindo, setExcluindo] = useState(false);
  const [novaMovOpen, setNovaMovOpen] = useState(false);

  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [saldoAtual, setSaldoAtual] = useState(0);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregandoMovimentacoes, setCarregandoMovimentacoes] = useState(true);
  const [dataInicio, setDataInicio] = useState(() => {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth(), 1).toISOString().split("T")[0];
  });
  const [dataFim, setDataFim] = useState(() => {
    const h = new Date();
    return new Date(h.getFullYear(), h.getMonth() + 1, 0).toISOString().split("T")[0];
  });

  // ─── Ticket colors (mesmo padrão do Caixa) ────────────────────────────────
  const ticket = useMemo(() => {
    if (isDark) {
      return {
        text: "#e0e0e0",
        headerBg: alpha(theme.palette.primary.main, 0.08),
        theadBg: alpha("#fff", 0.04),
        rowStripe: alpha("#fff", 0.02),
        rowBorder: alpha("#fff", 0.06),
        emptyIcon: alpha("#fff", 0.15),
      };
    }
    return {
      text: "#1a1a1a",
      headerBg: "#e3f2fd",
      theadBg: "#f5f5f5",
      rowStripe: "rgba(0,0,0,0.02)",
      rowBorder: "rgba(0,0,0,0.06)",
      emptyIcon: "#b0bec5",
    };
  }, [isDark, theme]);

  const corEntrada = isDark ? "#22c55e" : "#16a34a";
  const corSaida = isDark ? "#ef4444" : "#dc2626";
  const corSaldo = theme.palette.primary.main;

  // ─── Carregar dados ────────────────────────────────────────────────────────
  const carregarMovimentacoes = () => {
    setCarregandoMovimentacoes(true);
    caixaService
      .getResumo(dataInicio, dataFim)
      .then((data) => {
        const entradas = Number(data?.totalEntradas ?? data?.TotalEntradas ?? 0) || 0;
        const saidas = Number(data?.totalSaidas ?? data?.TotalSaidas ?? 0) || 0;
        const saldo = Number(data?.saldoAtual ?? data?.SaldoAtual ?? 0) || 0;
        const mov = data?.movimentacoes ?? data?.Movimentacoes ?? [];
        const list = Array.isArray(mov) ? mov : [];
        const normalizadas = list.map((m) => {
          const tipo = resolverTipoMovimentacaoLinha(m);
          const valorBruto = Number(m.valor ?? m.Valor ?? m.valorTotal ?? 0) || 0;
          const dataStr = m.data ?? m.Data ?? m.dataVenda ?? m.dataPedido ?? m.createdAt ?? "";
          const d = dataStr ? new Date(dataStr) : null;
          const vendaId = m.vendaId ?? m.VendaId;
          const compraId = m.compraId ?? m.CompraId;
          const genericId = m.id ?? m.Id;
          const id =
            tipo === "compra"
              ? compraId ?? genericId ?? `${tipo}-${Math.random()}`
              : tipo === "venda"
                ? vendaId ?? genericId ?? `${tipo}-${Math.random()}`
                : genericId ?? `${tipo}-${Math.random()}`;
          const exclusaoTipo =
            tipo === "venda" || tipo === "compra"
              ? tipo
              : tipo === "entrada" || tipo === "saida"
                ? "movimentacao_manual"
                : null;
          const descPadrao =
            tipo === "compra"
              ? "Compra"
              : tipo === "venda"
                ? "Venda"
                : tipo === "entrada"
                  ? "Entrada"
                  : "Saída";
          return {
            id,
            tipo,
            exclusaoTipo,
            descricao: m.descricao ?? m.Descricao ?? descPadrao,
            cliente: m.cliente ?? m.Cliente ?? m.clienteNome ?? "",
            fornecedor: m.fornecedor ?? m.Fornecedor ?? m.fornecedorNome ?? "",
            data: dataStr,
            hora: d ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "",
            valor: valorMovimentacaoAssinado(tipo, valorBruto),
            formaPagamento: m.formaPagamento ?? m.FormaPagamento ?? "—",
            status: m.status ?? m.Status ?? "concluido",
          };
        });
        setTotalEntradas(entradas);
        setTotalSaidas(saidas);
        setSaldoAtual(saldo);
        setMovimentacoes(normalizadas);
        sincronizarMovimentacoesDoCaixa(list);
      })
      .catch((err) => {
        console.error("Erro ao carregar movimentações:", err);
        setTotalEntradas(0);
        setTotalSaidas(0);
        setSaldoAtual(0);
        setMovimentacoes([]);
      })
      .finally(() => setCarregandoMovimentacoes(false));
  };

  useEffect(() => {
    carregarMovimentacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim]);

  // Abre o dialog automaticamente quando a URL tem ?novaMov=1 (atalhos da Home)
  useEffect(() => {
    if (searchParams.get("novaMov") === "1") {
      setNovaMovOpen(true);
      // Remove o param da URL após abrir
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("novaMov");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const movimentacoesFiltradas = movimentacoes.filter((mov) => {
    const matchSearch =
      mov.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTipo =
      filtroTipo === "todos" ||
      mov.tipo === filtroTipo ||
      (filtroTipo === "entradas" && mov.valor > 0) ||
      (filtroTipo === "saidas" && mov.valor < 0);

    return matchSearch && matchTipo;
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleMenuOpen = (event, movimentacao) => {
    setAnchorEl(event.currentTarget);
    setMovimentacaoSelecionada(movimentacao);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleVisualizarDetalhes = () => {
    setModalDetalhesAberto(true);
    handleMenuClose();
  };

  const handleFecharModal = () => {
    setModalDetalhesAberto(false);
    setMovimentacaoSelecionada(null);
  };

  const handleAbrirExcluir = () => {
    if (!movimentacaoSelecionada?.exclusaoTipo) {
      showWarning("Este registro não pode ser excluído por aqui.");
      handleMenuClose();
      return;
    }
    setMotivoCancelamento("");
    setDialogExcluirOpen(true);
    handleMenuClose();
  };

  const handleFecharDialogExcluir = () => {
    if (excluindo) return;
    setDialogExcluirOpen(false);
    setMovimentacaoSelecionada(null);
  };

  const handleConfirmarExclusao = async () => {
    const mov = movimentacaoSelecionada;
    if (!mov?.exclusaoTipo) return;
    setExcluindo(true);
    try {
      if (mov.exclusaoTipo === "venda") {
        await vendasService.cancelar(
          mov.id,
          motivoCancelamento.trim() || "Exclusão pela tela Movimentações",
        );
      } else if (mov.exclusaoTipo === "compra") {
        await comprasService.delete(mov.id);
      } else {
        await caixaService.excluirMovimentacaoManual(mov.id);
      }
      showSuccess(mov.exclusaoTipo === "venda" ? "Venda cancelada." : "Registro excluído.");
      setDialogExcluirOpen(false);
      setMovimentacaoSelecionada(null);
      carregarMovimentacoes();
    } catch (err) {
      showError(apiErrMessage(err));
    } finally {
      setExcluindo(false);
    }
  };

  const getTipoConfig = (tipo) => {
    const configs = {
      venda: {
        label: "Venda",
        color: corEntrada,
        bgcolor: alpha(corEntrada, isDark ? 0.18 : 0.12),
        icon: <ShoppingCart sx={{ fontSize: 14 }} />,
      },
      compra: {
        label: "Compra",
        color: corSaida,
        bgcolor: alpha(corSaida, isDark ? 0.18 : 0.12),
        icon: <Receipt sx={{ fontSize: 14 }} />,
      },
      entrada: {
        label: "Entrada",
        color: isDark ? vexaColors.amareloNeon : vexaColors.azulEscuro,
        bgcolor: alpha(vexaColors.amareloNeon, isDark ? 0.22 : 0.28),
        icon: <TrendingUp sx={{ fontSize: 14 }} />,
      },
      saida: {
        label: "Despesa",
        color: isDark ? "#f59e0b" : "#ea580c",
        bgcolor: alpha("#f59e0b", isDark ? 0.18 : 0.16),
        icon: <TrendingDown sx={{ fontSize: 14 }} />,
      },
      outro: {
        label: "Movimentação",
        color: isDark ? vexaColors.cinzaAzulado : vexaColors.azulEscuro,
        bgcolor: alpha(vexaColors.cinzaAzulado, 0.16),
        icon: <Receipt sx={{ fontSize: 14 }} />,
      },
    };
    return configs[tipo] || configs.outro;
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
          <AttachMoney sx={{ fontSize: 26, color: "primary.main" }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Caixa
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Movimentações, saldo e histórico
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Chip
            label={`${movimentacoesFiltradas.length} ${movimentacoesFiltradas.length === 1 ? "registro" : "registros"}`}
            color={movimentacoesFiltradas.length > 0 ? "primary" : "default"}
            sx={{ fontWeight: 800, height: 28 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setNovaMovOpen(true)}
            sx={{ textTransform: "none", fontWeight: 700, height: 36 }}
          >
            Nova Movimentação
          </Button>
        </Stack>
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
        <Grid container spacing={1.5} sx={{ flex: 1, minHeight: 0, p: { xs: 1, md: 1.5 }, m: 0 }}>
          {/* ── Coluna principal (9/12) ── */}
          <Grid size={{ xs: 12, lg: 9 }} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            {/* Linha de filtros: Datas + Busca + Tipos + Ações */}
            <Grid container spacing={1.25} sx={{ mb: 1.25 }}>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <VexaDatePicker
                  label="Data início"
                  value={dataInicio}
                  onChange={setDataInicio}
                  fullWidth
                  minWidth={0}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 2 }}>
                <VexaDatePicker
                  label="Data fim"
                  value={dataFim}
                  onChange={setDataFim}
                  fullWidth
                  minWidth={0}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar"
                  placeholder="Descrição, cliente ou fornecedor…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchTerm("")}>
                          <Close fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack direction="row" spacing={0.75} sx={{ height: "100%" }}>
                  <Button
                    fullWidth
                    size="small"
                    variant={filtroTipo === "todos" ? "contained" : "outlined"}
                    onClick={() => setFiltroTipo("todos")}
                    sx={{ textTransform: "none", fontWeight: 700, height: 40 }}
                  >
                    Todos
                  </Button>
                  <Button
                    fullWidth
                    size="small"
                    variant={filtroTipo === "entradas" ? "contained" : "outlined"}
                    onClick={() => setFiltroTipo("entradas")}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      height: 40,
                      ...(filtroTipo === "entradas" && {
                        bgcolor: corEntrada,
                        color: "#fff",
                        "&:hover": { bgcolor: alpha(corEntrada, 0.85) },
                      }),
                      ...(filtroTipo !== "entradas" && {
                        borderColor: alpha(corEntrada, 0.5),
                        color: corEntrada,
                        "&:hover": { borderColor: corEntrada, bgcolor: alpha(corEntrada, 0.06) },
                      }),
                    }}
                  >
                    Entradas
                  </Button>
                  <Button
                    fullWidth
                    size="small"
                    variant={filtroTipo === "saidas" ? "contained" : "outlined"}
                    onClick={() => setFiltroTipo("saidas")}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      height: 40,
                      ...(filtroTipo === "saidas" && {
                        bgcolor: corSaida,
                        color: "#fff",
                        "&:hover": { bgcolor: alpha(corSaida, 0.85) },
                      }),
                      ...(filtroTipo !== "saidas" && {
                        borderColor: alpha(corSaida, 0.5),
                        color: corSaida,
                        "&:hover": { borderColor: corSaida, bgcolor: alpha(corSaida, 0.06) },
                      }),
                    }}
                  >
                    Saídas
                  </Button>
                  <Tooltip title="Atualizar">
                    <span>
                      <IconButton
                        onClick={carregarMovimentacoes}
                        disabled={carregandoMovimentacoes}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          height: 40,
                          width: 40,
                          borderRadius: 1,
                        }}
                      >
                        <Refresh fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Exportar">
                    <IconButton
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        height: 40,
                        width: 40,
                        borderRadius: 1,
                      }}
                    >
                      <FileDownload fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Grid>
            </Grid>

            {/* Tabela de movimentações */}
            <Paper
              variant="outlined"
              sx={{
                flex: 1,
                minHeight: 280,
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
                  Movimentações do período
                </Typography>
                {movimentacoesFiltradas.length > 0 && (
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>
                    {movimentacoesFiltradas.length} {movimentacoesFiltradas.length === 1 ? "item" : "itens"}
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
                      <TableCell width={120}>Tipo</TableCell>
                      <TableCell>Descrição</TableCell>
                      <TableCell width={120}>Data</TableCell>
                      <TableCell width={140} align="right">Valor</TableCell>
                      <TableCell width={140}>Pagamento</TableCell>
                      <TableCell width={110}>Status</TableCell>
                      <TableCell width={56} align="center">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {carregandoMovimentacoes ? (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ borderBottom: "none" }}>
                          <Typography sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                            Carregando movimentações…
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : movimentacoesFiltradas.length === 0 ? (
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
                            <Receipt sx={{ fontSize: 56, color: ticket.emptyIcon }} />
                            <Typography sx={{ fontWeight: 700, color: ticket.text }}>
                              Nenhuma movimentação encontrada
                            </Typography>
                            <Typography variant="body2" sx={{ textAlign: "center", maxWidth: 360 }}>
                              Ajuste o período ou os filtros para ver mais resultados.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentacoesFiltradas.map((mov) => {
                        const tipoConfig = getTipoConfig(mov.tipo);
                        const positivo = mov.valor > 0;
                        return (
                          <TableRow
                            key={mov.id}
                            hover
                            sx={{
                              "&:nth-of-type(even) td": { bgcolor: ticket.rowStripe },
                              "& td": { borderColor: ticket.rowBorder, color: ticket.text },
                            }}
                          >
                            <TableCell>
                              <Chip
                                icon={tipoConfig.icon}
                                label={tipoConfig.label}
                                size="small"
                                sx={{
                                  bgcolor: tipoConfig.bgcolor,
                                  color: tipoConfig.color,
                                  fontWeight: 700,
                                  fontSize: 11,
                                  height: 22,
                                  "& .MuiChip-icon": { color: tipoConfig.color },
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{mov.descricao}</TableCell>
                            <TableCell sx={{ fontSize: 12 }}>
                              {mov.data ? new Date(mov.data).toLocaleDateString("pt-BR") : "—"}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                fontWeight: 800,
                                whiteSpace: "nowrap",
                                color: positivo ? corEntrada : corSaida,
                              }}
                            >
                              {positivo ? "+ " : "- "}
                              {fmtBRL(Math.abs(mov.valor))}
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>
                                {mov.formaPagamento}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label="Concluído"
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 10,
                                  height: 20,
                                  bgcolor: alpha(corEntrada, isDark ? 0.18 : 0.14),
                                  color: corEntrada,
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, mov)}
                                aria-label="Ações"
                              >
                                <MoreVert fontSize="small" />
                              </IconButton>
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
          <Grid size={{ xs: 12, lg: 3 }} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0 }}>
              <SummaryCard
                label="Total de Entradas"
                value={carregandoMovimentacoes ? "…" : fmtBRL(totalEntradas)}
                color={corEntrada}
                isDark={isDark}
              />
              <SummaryCard
                label="Total de Saídas"
                value={carregandoMovimentacoes ? "…" : fmtBRL(totalSaidas)}
                color={corSaida}
                isDark={isDark}
              />
              <SummaryCard
                label="Saldo Atual"
                value={carregandoMovimentacoes ? "…" : fmtBRL(saldoAtual)}
                color={corSaldo}
                accent
                isDark={isDark}
              />

              <Box sx={{ flex: 1 }} />

              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
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
                  Período
                </Typography>
                <Typography sx={{ fontSize: 12, color: "text.primary", fontWeight: 600 }}>
                  {dataInicio ? new Date(dataInicio + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                  {" → "}
                  {dataFim ? new Date(dataFim + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                </Typography>
                <Typography sx={{ fontSize: 11, color: "text.secondary", mt: 0.5 }}>
                  Filtros: {filtroTipo === "todos" ? "Todos os tipos" : filtroTipo === "entradas" ? "Apenas entradas" : "Apenas saídas"}
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* ═══ Menu de Ações ═══ */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: 1.5, minWidth: 180 } }}
      >
        <MenuItem onClick={handleVisualizarDetalhes} sx={{ py: 1.25 }}>
          <Visibility sx={{ mr: 1.5, color: "primary.main", fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Visualizar</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ py: 1.25 }}>
          <Edit sx={{ mr: 1.5, color: "warning.main", fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Editar</Typography>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleAbrirExcluir}
          disabled={!movimentacaoSelecionada?.exclusaoTipo}
          sx={{ py: 1.25 }}
        >
          <Delete sx={{ mr: 1.5, color: corSaida, fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: corSaida }}>
            Excluir
          </Typography>
        </MenuItem>
      </Menu>

      {/* ═══ Dialog: Confirmar Exclusão ═══ */}
      <Dialog
        open={dialogExcluirOpen}
        onClose={handleFecharDialogExcluir}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {movimentacaoSelecionada?.exclusaoTipo === "venda"
            ? "Cancelar esta venda?"
            : movimentacaoSelecionada?.exclusaoTipo === "compra"
              ? "Excluir esta compra?"
              : "Excluir esta movimentação?"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {movimentacaoSelecionada?.exclusaoTipo === "venda"
              ? "A venda será cancelada no sistema (estorno de estoque e totais dependem do backend)."
              : movimentacaoSelecionada?.exclusaoTipo === "compra"
                ? "A compra será removida permanentemente, se o servidor permitir."
                : "A movimentação manual será removida do caixa."}
          </Typography>
          {movimentacaoSelecionada?.exclusaoTipo === "venda" && (
            <TextField
              fullWidth
              size="small"
              label="Motivo (opcional)"
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              placeholder="Ex.: erro no lançamento"
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleFecharDialogExcluir} disabled={excluindo} sx={{ textTransform: "none" }}>
            Voltar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmarExclusao}
            disabled={excluindo}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {excluindo ? "Processando…" : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Dialog: Detalhes ═══ */}
      <Dialog
        open={modalDetalhesAberto}
        onClose={handleFecharModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: getTipoConfig(movimentacaoSelecionada?.tipo).color,
                width: 44,
                height: 44,
              }}
            >
              {getTipoConfig(movimentacaoSelecionada?.tipo).icon}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
                Detalhes da Movimentação
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {movimentacaoSelecionada?.descricao}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleFecharModal} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {movimentacaoSelecionada && (
            <Stack spacing={2}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: "center",
                  bgcolor: alpha(
                    movimentacaoSelecionada.valor > 0 ? corEntrada : corSaida,
                    isDark ? 0.1 : 0.06,
                  ),
                  border: "2px solid",
                  borderColor: movimentacaoSelecionada.valor > 0 ? corEntrada : corSaida,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: movimentacaoSelecionada.valor > 0 ? corEntrada : corSaida,
                    textTransform: "uppercase",
                    mb: 0.5,
                  }}
                >
                  Valor da Movimentação
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 900,
                    fontSize: 32,
                    color: movimentacaoSelecionada.valor > 0 ? corEntrada : corSaida,
                  }}
                >
                  {movimentacaoSelecionada.valor > 0 ? "+ " : "- "}
                  {fmtBRL(Math.abs(movimentacaoSelecionada.valor))}
                </Typography>
              </Paper>

              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 16, color: "text.secondary", mr: 1 }} />
                      <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>
                        Data e Hora
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>
                      {movimentacaoSelecionada.data
                        ? new Date(movimentacaoSelecionada.data).toLocaleDateString("pt-BR")
                        : "—"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {movimentacaoSelecionada.hora}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                      <Payment sx={{ fontSize: 16, color: "text.secondary", mr: 1 }} />
                      <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>
                        Forma de Pagamento
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>
                      {movimentacaoSelecionada.formaPagamento}
                    </Typography>
                  </Paper>
                </Grid>

                {(movimentacaoSelecionada.cliente || movimentacaoSelecionada.fornecedor) && (
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                        <Person sx={{ fontSize: 16, color: "text.secondary", mr: 1 }} />
                        <Typography sx={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>
                          {movimentacaoSelecionada.cliente ? "Cliente" : "Fornecedor"}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 700 }}>
                        {movimentacaoSelecionada.cliente || movimentacaoSelecionada.fornecedor}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: "1px solid", borderColor: "divider", gap: 1 }}>
          <Button onClick={handleFecharModal} variant="outlined" sx={{ textTransform: "none", fontWeight: 700 }}>
            Fechar
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Editar Movimentação
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══ Dialog: Nova Movimentação ═══ */}
      <NovaMovimentacaoDialog
        open={novaMovOpen}
        onClose={() => setNovaMovOpen(false)}
        onSaved={() => carregarMovimentacoes()}
      />
    </Box>
  );
}

export default Movimentacoes;
