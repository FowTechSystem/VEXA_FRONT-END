import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Card,
  CardContent,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Divider,
  Container,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from "@mui/material";
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
} from "@mui/icons-material";
import { caixaService } from "../api/caixaService";
import { vendasService } from "../api/vendasService";
import { comprasService } from "../api/comprasService";
import { showSuccess, showError, showWarning } from "../utils/notifications";
import {
  resolverTipoMovimentacaoLinha,
  valorMovimentacaoAssinado,
} from "../utils/movimentacaoCaixa";

function apiErrMessage(err) {
  const d = err?.response?.data;
  if (d && typeof d === "object" && d.message != null) return String(d.message);
  if (typeof d === "string" && d.trim()) return d;
  return err?.message || "Operação não concluída.";
}

function Movimentacoes() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [anchorEl, setAnchorEl] = useState(null);
  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [dialogExcluirOpen, setDialogExcluirOpen] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [excluindo, setExcluindo] = useState(false);

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

  const totais = { entradas: totalEntradas, saidas: totalSaidas, saldo: saldoAtual };

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
  }, [dataInicio, dataFim]);

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

  const handleMenuOpen = (event, movimentacao) => {
    setAnchorEl(event.currentTarget);
    setMovimentacaoSelecionada(movimentacao);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
      showSuccess(
        mov.exclusaoTipo === "venda"
          ? "Venda cancelada."
          : "Registro excluído.",
      );
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
        color: isDark ? "#22c55e" : "#16a34a",
        bgcolor: isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
        icon: <ShoppingCart />,
      },
      compra: {
        label: "Compra",
        color: isDark ? "#ef4444" : "#dc2626",
        bgcolor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
        icon: <Receipt />,
      },
      entrada: {
        label: "Lucro",
        color: isDark ? "#3b82f6" : "#2563eb",
        bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#dbeafe",
        icon: <TrendingUp />,
      },
      saida: {
        label: "Despesa",
        color: isDark ? "#f59e0b" : "#ea580c",
        bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
        icon: <TrendingDown />,
      },
      outro: {
        label: "Movimentação",
        color: isDark ? "#94a3b8" : "#64748b",
        bgcolor: isDark ? "rgba(148, 163, 184, 0.12)" : "#f1f5f9",
        icon: <Receipt />,
      },
    };
    return configs[tipo] || configs.outro;
  };

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: "100vh",
        color: theme.palette.text.primary,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: 4,
          py: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
              }}
            >
              Movimentações
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
            >
              Gerencie todas as movimentações financeiras do sistema
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AttachMoney />}
            onClick={() => navigate("/vendas/nova-movimentacao")}
            sx={{
              bgcolor: isDark ? "#3b82f6" : "#2563eb",
              color: "primary.contrastText",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              "&:hover": {
                bgcolor: isDark ? "#2563eb" : "#1d4ed8",
              },
            }}
          >
            Nova Movimentação
          </Button>
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Filtro de período */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Data Início"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Data Fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Cards de Resumo */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Card Entradas */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: `2px solid ${isDark ? "rgba(34, 197, 94, 0.3)" : "#dcfce7"}`,
                borderRadius: 2,
                bgcolor: isDark ? "rgba(34, 197, 94, 0.08)" : "#f0fdf4",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDark ? "#22c55e" : "#16a34a",
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Total de Entradas
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: isDark ? "#22c55e" : "#16a34a",
                      }}
                    >
                      {carregandoMovimentacoes ? "..." : `R$ ${totais.entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: isDark ? "#22c55e" : "#16a34a",
                      width: 56,
                      height: 56,
                    }}
                  >
                    <TrendingUp sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card Saídas */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: `2px solid ${isDark ? "rgba(239, 68, 68, 0.3)" : "#fee2e2"}`,
                borderRadius: 2,
                bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "#fef2f2",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDark ? "#ef4444" : "#dc2626",
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Total de Saídas
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: isDark ? "#ef4444" : "#dc2626",
                      }}
                    >
                      {carregandoMovimentacoes ? "..." : `R$ ${totais.saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: isDark ? "#ef4444" : "#dc2626",
                      width: 56,
                      height: 56,
                    }}
                  >
                    <TrendingDown sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card Saldo */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: `2px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : "#dbeafe"}`,
                borderRadius: 2,
                bgcolor: isDark ? "rgba(59, 130, 246, 0.08)" : "#eff6ff",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isDark ? "#3b82f6" : "#2563eb",
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Saldo Atual
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: isDark ? "#3b82f6" : "#2563eb",
                      }}
                    >
                      {carregandoMovimentacoes ? "..." : `R$ ${totais.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: isDark ? "#3b82f6" : "#2563eb",
                      width: 56,
                      height: 56,
                    }}
                  >
                    <AttachMoney sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filtros e Busca */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por descrição, cliente ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: theme.palette.text.primary,
                    "& fieldset": {
                      borderColor: theme.palette.divider,
                    },
                    "&:hover fieldset": {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant={filtroTipo === "todos" ? "contained" : "outlined"}
                  onClick={() => setFiltroTipo("todos")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    ...(filtroTipo === "todos" && {
                      bgcolor: isDark ? "#3b82f6" : "#2563eb",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: isDark ? "#2563eb" : "#1d4ed8",
                      },
                    }),
                    ...(filtroTipo !== "todos" && {
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary,
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        bgcolor: theme.palette.action.hover,
                      },
                    }),
                  }}
                >
                  Todos
                </Button>
                <Button
                  variant={filtroTipo === "entradas" ? "contained" : "outlined"}
                  onClick={() => setFiltroTipo("entradas")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    ...(filtroTipo === "entradas" && {
                      bgcolor: isDark ? "#22c55e" : "#16a34a",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: isDark ? "#16a34a" : "#15803d",
                      },
                    }),
                    ...(filtroTipo !== "entradas" && {
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary,
                      "&:hover": {
                        borderColor: "#22c55e",
                        bgcolor: theme.palette.action.hover,
                      },
                    }),
                  }}
                >
                  Entradas
                </Button>
                <Button
                  variant={filtroTipo === "saidas" ? "contained" : "outlined"}
                  onClick={() => setFiltroTipo("saidas")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    ...(filtroTipo === "saidas" && {
                      bgcolor: isDark ? "#ef4444" : "#dc2626",
                      color: "primary.contrastText",
                      "&:hover": {
                        bgcolor: isDark ? "#dc2626" : "#b91c1c",
                      },
                    }),
                    ...(filtroTipo !== "saidas" && {
                      borderColor: theme.palette.divider,
                      color: theme.palette.text.primary,
                      "&:hover": {
                        borderColor: "#ef4444",
                        bgcolor: theme.palette.action.hover,
                      },
                    }),
                  }}
                >
                  Saídas
                </Button>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ borderColor: theme.palette.divider }}
                />
                <IconButton
                  onClick={carregarMovimentacoes}
                  disabled={carregandoMovimentacoes}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary,
                    "&:hover": {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                  title="Atualizar"
                >
                  <Refresh />
                </IconButton>
                <IconButton
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary,
                    "&:hover": {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
                >
                  <FileDownload />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabela de Movimentações */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            overflow: "hidden",
          }}
        >
          <TableContainer sx={{ maxHeight: "70vh" }}>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: "action.hover",
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Tipo
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Descrição
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Cliente/Fornecedor
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Data
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                    align="right"
                  >
                    Valor
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Pagamento
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                    align="center"
                  >
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carregandoMovimentacoes ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        Carregando movimentações...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : movimentacoesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Box sx={{ color: theme.palette.text.secondary }}>
                        <Receipt sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          Nenhuma movimentação encontrada no período
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  movimentacoesFiltradas.map((mov) => {
                    const tipoConfig = getTipoConfig(mov.tipo);
                    return (
                      <TableRow
                        key={mov.id}
                        hover
                        sx={{
                          "&:hover": {
                            bgcolor: theme.palette.action.hover,
                          },
                          borderBottom: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        <TableCell
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Chip
                            icon={tipoConfig.icon}
                            label={tipoConfig.label}
                            sx={{
                              bgcolor: tipoConfig.bgcolor,
                              color: tipoConfig.color,
                              fontWeight: 600,
                              "& .MuiChip-icon": {
                                color: tipoConfig.color,
                              },
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: theme.palette.text.primary,
                            }}
                          >
                            {mov.descricao}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {mov.cliente || mov.fornecedor || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 500,
                                color: theme.palette.text.primary,
                              }}
                            >
                              {mov.data ? new Date(mov.data).toLocaleDateString("pt-BR") : "—"}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              {mov.hora || "—"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color:
                                mov.valor > 0
                                  ? isDark
                                    ? "#22c55e"
                                    : "#16a34a"
                                  : isDark
                                    ? "#ef4444"
                                    : "#dc2626",
                            }}
                          >
                            {mov.valor > 0 ? "+ " : "- "}R${" "}
                            {Math.abs(mov.valor).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Chip
                            label={mov.formaPagamento}
                            size="small"
                            sx={{
                              bgcolor: isDark
                                ? "rgba(255, 255, 255, 0.08)"
                                : theme.palette.action.selected,
                              color: theme.palette.text.secondary,
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <Chip
                            label="Concluído"
                            size="small"
                            sx={(t) => ({
                              fontWeight: 600,
                              ...(t.palette.mode === "dark"
                                ? {
                                    bgcolor: "success.dark",
                                    color: "common.white",
                                    border: "1px solid",
                                    borderColor: "success.main",
                                  }
                                : {
                                    bgcolor: "success.light",
                                    color: "success.dark",
                                    border: "1px solid",
                                    borderColor: "success.main",
                                  }),
                            })}
                          />
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            borderBottom: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, mov)}
                            sx={{
                              color: theme.palette.text.primary,
                              "&:hover": {
                                bgcolor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <MoreVert />
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

        {/* Menu de Ações */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 180,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <MenuItem
            onClick={handleVisualizarDetalhes}
            sx={{
              py: 1.5,
              "&:hover": {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <Visibility
              sx={{ mr: 1.5, color: isDark ? "#3b82f6" : "#2563eb" }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: theme.palette.text.primary,
              }}
            >
              Visualizar
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={handleMenuClose}
            sx={{
              py: 1.5,
              "&:hover": {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <Edit sx={{ mr: 1.5, color: "#f59e0b" }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: theme.palette.text.primary,
              }}
            >
              Editar
            </Typography>
          </MenuItem>
          <Divider sx={{ borderColor: theme.palette.divider }} />
          <MenuItem
            onClick={handleAbrirExcluir}
            disabled={!movimentacaoSelecionada?.exclusaoTipo}
            sx={{
              py: 1.5,
              "&:hover": {
                bgcolor: theme.palette.action.hover,
              },
            }}
          >
            <Delete sx={{ mr: 1.5, color: isDark ? "#ef4444" : "#dc2626" }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                color: isDark ? "#ef4444" : "#dc2626",
              }}
            >
              Excluir
            </Typography>
          </MenuItem>
        </Menu>

        <Dialog
          open={dialogExcluirOpen}
          onClose={handleFecharDialogExcluir}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, color: "text.primary" }}>
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
              sx={{ textTransform: "none" }}
            >
              {excluindo ? "Processando…" : "Confirmar"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Detalhes */}
        <Dialog
          open={modalDetalhesAberto}
          onClose={handleFecharModal}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: "action.hover",
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              py: 2.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: getTipoConfig(movimentacaoSelecionada?.tipo).color,
                  width: 48,
                  height: 48,
                }}
              >
                {getTipoConfig(movimentacaoSelecionada?.tipo).icon}
              </Avatar>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                  }}
                >
                  Detalhes da Movimentação
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.secondary }}
                >
                  {movimentacaoSelecionada?.descricao}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleFecharModal}
              size="small"
              sx={{
                color: theme.palette.text.primary,
                "&:hover": {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 4, bgcolor: theme.palette.background.paper }}>
            {movimentacaoSelecionada && (
              <Stack spacing={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor:
                      movimentacaoSelecionada.valor > 0
                        ? isDark
                          ? "rgba(34, 197, 94, 0.15)"
                          : "#dcfce7"
                        : isDark
                          ? "rgba(239, 68, 68, 0.15)"
                          : "#fee2e2",
                    border: `2px solid ${
                      movimentacaoSelecionada.valor > 0
                        ? isDark
                          ? "#22c55e"
                          : "#16a34a"
                        : isDark
                          ? "#ef4444"
                          : "#dc2626"
                    }`,
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        movimentacaoSelecionada.valor > 0
                          ? isDark
                            ? "#22c55e"
                            : "#16a34a"
                          : isDark
                            ? "#ef4444"
                            : "#dc2626",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    VALOR DA MOVIMENTAÇÃO
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color:
                        movimentacaoSelecionada.valor > 0
                          ? isDark
                            ? "#22c55e"
                            : "#16a34a"
                          : isDark
                            ? "#ef4444"
                            : "#dc2626",
                    }}
                  >
                    {movimentacaoSelecionada.valor > 0 ? "+ " : "- "}R${" "}
                    {Math.abs(movimentacaoSelecionada.valor).toFixed(2)}
                  </Typography>
                </Paper>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        bgcolor: theme.palette.background.paper,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <CalendarToday
                          sx={{
                            fontSize: 20,
                            color: theme.palette.text.secondary,
                            mr: 1,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontWeight: 600,
                          }}
                        >
                          DATA E HORA
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {new Date(
                          movimentacaoSelecionada.data,
                        ).toLocaleDateString("pt-BR")}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {movimentacaoSelecionada.hora}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        bgcolor: theme.palette.background.paper,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Payment
                          sx={{
                            fontSize: 20,
                            color: theme.palette.text.secondary,
                            mr: 1,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontWeight: 600,
                          }}
                        >
                          FORMA DE PAGAMENTO
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {movimentacaoSelecionada.formaPagamento}
                      </Typography>
                    </Paper>
                  </Grid>

                  {(movimentacaoSelecionada.cliente ||
                    movimentacaoSelecionada.fornecedor) && (
                    <Grid item xs={12}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          bgcolor: theme.palette.background.paper,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <Person
                            sx={{
                              fontSize: 20,
                              color: theme.palette.text.secondary,
                              mr: 1,
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: theme.palette.text.secondary,
                              fontWeight: 600,
                            }}
                          >
                            {movimentacaoSelecionada.cliente
                              ? "CLIENTE"
                              : "FORNECEDOR"}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                          }}
                        >
                          {movimentacaoSelecionada.cliente ||
                            movimentacaoSelecionada.fornecedor}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                {movimentacaoSelecionada.observacoes && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: isDark ? "rgba(245, 158, 11, 0.1)" : "#fefce8",
                      border: `1px solid ${
                        isDark ? "rgba(245, 158, 11, 0.3)" : "#fde047"
                      }`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDark ? "#fbbf24" : "#854d0e",
                        fontWeight: 600,
                        mb: 1,
                        display: "block",
                      }}
                    >
                      OBSERVAÇÕES
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.text.primary, mt: 1 }}
                    >
                      {movimentacaoSelecionada.observacoes}
                    </Typography>
                  </Paper>
                )}

                {movimentacaoSelecionada.itens && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      bgcolor: theme.palette.background.paper,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        mb: 2,
                        color: theme.palette.text.primary,
                      }}
                    >
                      ITENS DA VENDA
                    </Typography>
                    <Stack spacing={1.5}>
                      {movimentacaoSelecionada.itens.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            p: 2,
                            bgcolor: isDark
                              ? "rgba(255, 255, 255, 0.05)"
                              : theme.palette.action.hover,
                            borderRadius: 1,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                              }}
                            >
                              {item.nome}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              {item.quantidade}x R${" "}
                              {item.valorUnitario.toFixed(2)}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                            }}
                          >
                            R${" "}
                            {(item.quantidade * item.valorUnitario).toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              p: 3,
              bgcolor: "action.hover",
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Button
              onClick={handleFecharModal}
              variant="outlined"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              Fechar
            </Button>
            <Button
              variant="contained"
              startIcon={<Edit />}
              sx={{
                bgcolor: isDark ? "#3b82f6" : "#2563eb",
                color: "primary.contrastText",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: isDark ? "#2563eb" : "#1d4ed8",
                },
              }}
            >
              Editar Movimentação
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default Movimentacoes;
