import React, { useState } from "react";
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

// Dados de exemplo
const MOVIMENTACOES_EXEMPLO = [
  {
    id: 1,
    tipo: "venda",
    descricao: "Venda #1234",
    cliente: "João Silva",
    data: "2026-01-23",
    hora: "10:30",
    valor: 450.0,
    formaPagamento: "PIX",
    status: "concluido",
    observacoes: "Pagamento confirmado via PIX",
    itens: [
      { nome: "Produto A", quantidade: 2, valorUnitario: 150.0 },
      { nome: "Produto B", quantidade: 1, valorUnitario: 150.0 },
    ],
  },
  {
    id: 2,
    tipo: "compra",
    descricao: "Compra de Estoque",
    fornecedor: "Fornecedor ABC",
    data: "2026-01-23",
    hora: "09:15",
    valor: -1200.0,
    formaPagamento: "Boleto",
    status: "concluido",
    observacoes: "Nota fiscal: NF-12345",
  },
  {
    id: 3,
    tipo: "venda",
    descricao: "Venda #1235",
    cliente: "Maria Santos",
    data: "2026-01-23",
    hora: "11:45",
    valor: 780.5,
    formaPagamento: "Crédito",
    status: "concluido",
    observacoes: "Parcelado em 3x",
  },
  {
    id: 4,
    tipo: "entrada",
    descricao: "Entrada de Capital",
    data: "2026-01-22",
    hora: "14:20",
    valor: 5000.0,
    formaPagamento: "Transferência",
    status: "concluido",
  },
  {
    id: 5,
    tipo: "saida",
    descricao: "Pagamento de Aluguel",
    data: "2026-01-22",
    hora: "16:00",
    valor: -2500.0,
    formaPagamento: "Transferência",
    status: "concluido",
  },
];

function Movimentacoes() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [anchorEl, setAnchorEl] = useState(null);
  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  const calcularTotais = () => {
    const entradas = MOVIMENTACOES_EXEMPLO.filter((m) => m.valor > 0).reduce(
      (acc, m) => acc + m.valor,
      0,
    );
    const saidas = MOVIMENTACOES_EXEMPLO.filter((m) => m.valor < 0).reduce(
      (acc, m) => acc + Math.abs(m.valor),
      0,
    );
    return { entradas, saidas, saldo: entradas - saidas };
  };

  const totais = calcularTotais();

  const movimentacoesFiltradas = MOVIMENTACOES_EXEMPLO.filter((mov) => {
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
        label: "Entrada",
        color: isDark ? "#3b82f6" : "#2563eb",
        bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#dbeafe",
        icon: <TrendingUp />,
      },
      saida: {
        label: "Saída",
        color: isDark ? "#f59e0b" : "#ea580c",
        bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
        icon: <TrendingDown />,
      },
    };
    return configs[tipo] || configs.venda;
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
                      R$ {totais.entradas.toFixed(2)}
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
                      R$ {totais.saidas.toFixed(2)}
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
                      R$ {totais.saldo.toFixed(2)}
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
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    color: theme.palette.text.primary,
                    "&:hover": {
                      bgcolor: theme.palette.action.hover,
                    },
                  }}
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
                {movimentacoesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Box sx={{ color: theme.palette.text.secondary }}>
                        <Receipt sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          Nenhuma movimentação encontrada
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
                            {mov.cliente || mov.fornecedor || "-"}
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
                              {new Date(mov.data).toLocaleDateString("pt-BR")}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: theme.palette.text.secondary }}
                            >
                              {mov.hora}
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
                            sx={{
                              bgcolor: isDark
                                ? "rgba(34, 197, 94, 0.15)"
                                : "#dcfce7",
                              color: isDark ? "#22c55e" : "#16a34a",
                              fontWeight: 600,
                            }}
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
            onClick={handleMenuClose}
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
