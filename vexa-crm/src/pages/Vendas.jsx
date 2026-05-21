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
} from "@mui/material";
import {
  Search,
  FilterList,
  FileDownload,
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
} from "@mui/icons-material";

// Dados de exemplo - substitua pela sua API
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [anchorEl, setAnchorEl] = useState(null);
  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState(null);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);

  // Calcular totais
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

  // Filtrar movimentações
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

  const handleEditar = () => {
    console.log("Editar movimentação:", movimentacaoSelecionada);
    handleMenuClose();
    // Implementar lógica de edição
  };

  const handleExcluir = () => {
    if (
      window.confirm(
        `Deseja realmente excluir a movimentação "${movimentacaoSelecionada?.descricao}"?`,
      )
    ) {
      console.log("Excluir movimentação:", movimentacaoSelecionada);
      // Implementar lógica de exclusão
    }
    handleMenuClose();
  };

  const getTipoConfig = (tipo) => {
    const configs = {
      venda: {
        label: "Venda",
        color: "#16a34a",
        bgcolor: "#dcfce7",
        icon: <ShoppingCart />,
      },
      compra: {
        label: "Compra",
        color: "#dc2626",
        bgcolor: "#fee2e2",
        icon: <Receipt />,
      },
      entrada: {
        label: "Entrada",
        color: "#2563eb",
        bgcolor: "#dbeafe",
        icon: <TrendingUp />,
      },
      saida: {
        label: "Saída",
        color: "#f59e0b",
        bgcolor: "#fef3c7",
        icon: <TrendingDown />,
      },
    };
    return configs[tipo] || configs.venda;
  };

  return (
    <Box sx={{ bgcolor: "#fafafa", height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid #e5e7eb",
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
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
              Movimentações
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
              Gerencie todas as movimentações financeiras do sistema
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AttachMoney />}
            sx={{
              bgcolor: "#2563eb",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.5,
              borderRadius: 2,
              fontSize: "1rem",
              "&:hover": { bgcolor: "#1d4ed8" },
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            Nova Movimentação
          </Button>
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Cards de Resumo */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: "2px solid #dcfce7",
                borderRadius: 2,
                bgcolor: "#f0fdf4",
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
                      sx={{ color: "#16a34a", fontWeight: 600, mb: 1 }}
                    >
                      Total de Entradas
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#16a34a" }}
                    >
                      R$ {totais.entradas.toFixed(2)}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: "#16a34a",
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

          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: "2px solid #fee2e2",
                borderRadius: 2,
                bgcolor: "#fef2f2",
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
                      sx={{ color: "#dc2626", fontWeight: 600, mb: 1 }}
                    >
                      Total de Saídas
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#dc2626" }}
                    >
                      R$ {totais.saidas.toFixed(2)}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: "#dc2626",
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

          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: "2px solid #dbeafe",
                borderRadius: 2,
                bgcolor: "#eff6ff",
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
                      sx={{ color: "#2563eb", fontWeight: 600, mb: 1 }}
                    >
                      Saldo Atual
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#2563eb" }}
                    >
                      R$ {totais.saldo.toFixed(2)}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: "#2563eb",
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
            border: "1px solid #e5e7eb",
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por descrição, cliente ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#9ca3af" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { border: "2px solid #e5e7eb" },
                    "&:hover fieldset": { border: "2px solid #d1d5db" },
                    "&.Mui-focused fieldset": { border: "2px solid #2563eb" },
                  },
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
                    borderColor: "#e5e7eb",
                    color: filtroTipo === "todos" ? "white" : "#6b7280",
                    bgcolor: filtroTipo === "todos" ? "#2563eb" : "transparent",
                    "&:hover": {
                      borderColor: "#2563eb",
                      bgcolor: filtroTipo === "todos" ? "#1d4ed8" : "#eff6ff",
                    },
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
                    borderColor: "#e5e7eb",
                    color: filtroTipo === "entradas" ? "white" : "#6b7280",
                    bgcolor:
                      filtroTipo === "entradas" ? "#16a34a" : "transparent",
                    "&:hover": {
                      borderColor: "#16a34a",
                      bgcolor:
                        filtroTipo === "entradas" ? "#15803d" : "#dcfce7",
                    },
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
                    borderColor: "#e5e7eb",
                    color: filtroTipo === "saidas" ? "white" : "#6b7280",
                    bgcolor:
                      filtroTipo === "saidas" ? "#dc2626" : "transparent",
                    "&:hover": {
                      borderColor: "#dc2626",
                      bgcolor: filtroTipo === "saidas" ? "#b91c1c" : "#fee2e2",
                    },
                  }}
                >
                  Saídas
                </Button>
                <Divider orientation="vertical" flexItem />
                <IconButton
                  sx={{
                    border: "2px solid #e5e7eb",
                    "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" },
                  }}
                >
                  <Refresh />
                </IconButton>
                <IconButton
                  sx={{
                    border: "2px solid #e5e7eb",
                    "&:hover": { borderColor: "#2563eb", bgcolor: "#eff6ff" },
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
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <TableContainer
            sx={{
              maxHeight: "70vh",
              overflow: "auto",
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f9fafb" }}>
                  <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                    Tipo
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                    Descrição
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                    Cliente/Fornecedor
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                    Data
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: "#374151" }}
                    align="right"
                  >
                    Valor
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                    Pagamento
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#374151" }}>
                    Status
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 700, color: "#374151" }}
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
                      <Box sx={{ color: "#9ca3af" }}>
                        <Receipt sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          Nenhuma movimentação encontrada
                        </Typography>
                        <Typography variant="body2">
                          Clique em "Nova Movimentação" para começar
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
                          "&:hover": { bgcolor: "#f9fafb" },
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <TableCell>
                          <Chip
                            icon={tipoConfig.icon}
                            label={tipoConfig.label}
                            sx={{
                              bgcolor: tipoConfig.bgcolor,
                              color: tipoConfig.color,
                              fontWeight: 600,
                              border: `2px solid ${tipoConfig.color}30`,
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "#1f2937" }}
                          >
                            {mov.descricao}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            {mov.cliente || mov.fornecedor || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500, color: "#1f2937" }}
                            >
                              {new Date(mov.data).toLocaleDateString("pt-BR")}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#9ca3af" }}
                            >
                              {mov.hora}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: mov.valor > 0 ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {mov.valor > 0 ? "+ " : "- "}R${" "}
                            {Math.abs(mov.valor).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={mov.formaPagamento}
                            size="small"
                            sx={{
                              bgcolor: "#f3f4f6",
                              color: "#6b7280",
                              fontWeight: 500,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label="Concluído"
                            size="small"
                            sx={{
                              bgcolor: "#dcfce7",
                              color: "#16a34a",
                              fontWeight: 600,
                              border: "1px solid #86efac",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, mov)}
                            sx={{
                              "&:hover": { bgcolor: "#eff6ff" },
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
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: 180,
            },
          }}
        >
          <MenuItem
            onClick={handleVisualizarDetalhes}
            sx={{
              py: 1.5,
              "&:hover": { bgcolor: "#eff6ff" },
            }}
          >
            <Visibility sx={{ mr: 1.5, color: "#2563eb" }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Visualizar
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={handleEditar}
            sx={{
              py: 1.5,
              "&:hover": { bgcolor: "#fef3c7" },
            }}
          >
            <Edit sx={{ mr: 1.5, color: "#f59e0b" }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Editar
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={handleExcluir}
            sx={{
              py: 1.5,
              "&:hover": { bgcolor: "#fee2e2" },
            }}
          >
            <Delete sx={{ mr: 1.5, color: "#dc2626" }} />
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#dc2626" }}
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
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
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
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Detalhes da Movimentação
                </Typography>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  {movimentacaoSelecionada?.descricao}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleFecharModal} size="small">
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            {movimentacaoSelecionada && (
              <Stack spacing={3}>
                {/* Informações Principais */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: "#f9fafb",
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Grid container spacing={3}>
                    <Grid item xs={6}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        TIPO
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          icon={
                            getTipoConfig(movimentacaoSelecionada.tipo).icon
                          }
                          label={
                            getTipoConfig(movimentacaoSelecionada.tipo).label
                          }
                          sx={{
                            bgcolor: getTipoConfig(movimentacaoSelecionada.tipo)
                              .bgcolor,
                            color: getTipoConfig(movimentacaoSelecionada.tipo)
                              .color,
                            fontWeight: 600,
                            border: `2px solid ${
                              getTipoConfig(movimentacaoSelecionada.tipo).color
                            }30`,
                          }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        STATUS
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label="Concluído"
                          sx={{
                            bgcolor: "#dcfce7",
                            color: "#16a34a",
                            fontWeight: 600,
                            border: "2px solid #86efac",
                          }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Valor */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor:
                      movimentacaoSelecionada.valor > 0 ? "#dcfce7" : "#fee2e2",
                    border:
                      movimentacaoSelecionada.valor > 0
                        ? "2px solid #86efac"
                        : "2px solid #fca5a5",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        movimentacaoSelecionada.valor > 0
                          ? "#16a34a"
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
                          ? "#16a34a"
                          : "#dc2626",
                    }}
                  >
                    {movimentacaoSelecionada.valor > 0 ? "+ " : "- "}R${" "}
                    {Math.abs(movimentacaoSelecionada.valor).toFixed(2)}
                  </Typography>
                </Paper>

                {/* Informações Detalhadas */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <CalendarToday
                          sx={{ fontSize: 20, color: "#6b7280", mr: 1 }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: "#6b7280", fontWeight: 600 }}
                        >
                          DATA E HORA
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {new Date(
                          movimentacaoSelecionada.data,
                        ).toLocaleDateString("pt-BR")}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        {movimentacaoSelecionada.hora}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        border: "1px solid #e5e7eb",
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Payment
                          sx={{ fontSize: 20, color: "#6b7280", mr: 1 }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: "#6b7280", fontWeight: 600 }}
                        >
                          FORMA DE PAGAMENTO
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
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
                          border: "1px solid #e5e7eb",
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <Person
                            sx={{ fontSize: 20, color: "#6b7280", mr: 1 }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ color: "#6b7280", fontWeight: 600 }}
                          >
                            {movimentacaoSelecionada.cliente
                              ? "CLIENTE"
                              : "FORNECEDOR"}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {movimentacaoSelecionada.cliente ||
                            movimentacaoSelecionada.fornecedor}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                {/* Observações */}
                {movimentacaoSelecionada.observacoes && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      bgcolor: "#fefce8",
                      border: "1px solid #fde047",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "#854d0e", fontWeight: 600, mb: 1 }}
                    >
                      OBSERVAÇÕES
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#713f12", mt: 1 }}
                    >
                      {movimentacaoSelecionada.observacoes}
                    </Typography>
                  </Paper>
                )}

                {/* Itens (se houver) */}
                {movimentacaoSelecionada.itens && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      border: "1px solid #e5e7eb",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 2, color: "#374151" }}
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
                            bgcolor: "#f9fafb",
                            borderRadius: 1,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {item.nome}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b7280" }}
                            >
                              {item.quantidade}x R${" "}
                              {item.valorUnitario.toFixed(2)}
                            </Typography>
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
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
              bgcolor: "#f9fafb",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <Button
              onClick={handleFecharModal}
              variant="outlined"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "#d1d5db",
                color: "#6b7280",
                "&:hover": {
                  borderColor: "#9ca3af",
                  bgcolor: "#f3f4f6",
                },
              }}
            >
              Fechar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default Movimentacoes;
