import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material";
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Add,
  Edit,
  Delete,
  Close,
  Receipt,
  AccountBalance,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

const TIPOS_MOVIMENTACAO = {
  receita: { label: "Receita", color: "#16a34a", bgcolor: "#dcfce7" },
  despesa: { label: "Despesa", color: "#dc2626", bgcolor: "#fee2e2" },
};

const CATEGORIAS_RECEITA = [
  "Vendas",
  "Prestação de Serviços",
  "Recebimento de Cliente",
  "Outras Receitas",
];

const CATEGORIAS_DESPESA = [
  "Fornecedores",
  "Salários",
  "Aluguel",
  "Energia",
  "Internet",
  "Marketing",
  "Impostos",
  "Outras Despesas",
];

function Financeiro() {
  const [tabAtual, setTabAtual] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [movimentacoes, setMovimentacoes] = useState([]);

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const movimentacoesPorPagina = 10;

  const [currentMovimentacao, setCurrentMovimentacao] = useState({
    tipo: "receita",
    descricao: "",
    valor: "",
    categoria: "",
    data: new Date().toISOString().split("T")[0],
    observacoes: "",
  });

  const handleOpenDialog = () => {
    setCurrentMovimentacao({
      tipo: "receita",
      descricao: "",
      valor: "",
      categoria: "",
      data: new Date().toISOString().split("T")[0],
      observacoes: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentMovimentacao({
      ...currentMovimentacao,
      [name]: value,
    });
  };

  const handleSave = () => {
    if (!currentMovimentacao.descricao || !currentMovimentacao.valor) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const novaMovimentacao = {
      ...currentMovimentacao,
      id: Date.now(),
      valor: parseFloat(currentMovimentacao.valor),
    };

    setMovimentacoes([novaMovimentacao, ...movimentacoes]);
    setPaginaAtual(1); // Volta para a primeira página
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm("Deseja realmente excluir esta movimentação?")) {
      setMovimentacoes(movimentacoes.filter((m) => m.id !== id));
    }
  };

  const calcularTotais = () => {
    const receitas = movimentacoes
      .filter((m) => m.tipo === "receita")
      .reduce((acc, m) => acc + m.valor, 0);

    const despesas = movimentacoes
      .filter((m) => m.tipo === "despesa")
      .reduce((acc, m) => acc + m.valor, 0);

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  };

  const totais = calcularTotais();

  const movimentacoesFiltradas =
    tabAtual === 0
      ? movimentacoes
      : tabAtual === 1
        ? movimentacoes.filter((m) => m.tipo === "receita")
        : movimentacoes.filter((m) => m.tipo === "despesa");

  // Cálculos de paginação
  const totalPaginas = Math.ceil(
    movimentacoesFiltradas.length / movimentacoesPorPagina,
  );
  const indiceInicial = (paginaAtual - 1) * movimentacoesPorPagina;
  const indiceFinal = indiceInicial + movimentacoesPorPagina;
  const movimentacoesPaginadas = movimentacoesFiltradas.slice(
    indiceInicial,
    indiceFinal,
  );

  // Funções de navegação de página
  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  const handleTabChange = (e, newValue) => {
    setTabAtual(newValue);
    setPaginaAtual(1); // Volta para a primeira página ao mudar de aba
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
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
            <Typography variant="h4" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
              Financeiro
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
              Gestão financeira e fluxo de caixa
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              borderRadius: "8px",
              px: 3,
              boxShadow: "none",
            }}
          >
            Nova Movimentação
          </Button>
        </Box>

        {/* Cards de resumo */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                bgcolor: "#dcfce7",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TrendingUp sx={{ color: "#16a34a", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#166534" }}>
                  Receitas
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "#16a34a" }}
              >
                R$ {totais.receitas.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                bgcolor: "#fee2e2",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TrendingDown sx={{ color: "#dc2626", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#991b1b" }}>
                  Despesas
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "#dc2626" }}
              >
                R$ {totais.despesas.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                bgcolor: totais.saldo >= 0 ? "#dbeafe" : "#fef3c7",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AccountBalance
                  sx={{
                    color: totais.saldo >= 0 ? "#2563eb" : "#d97706",
                    mr: 1,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: totais.saldo >= 0 ? "#1e40af" : "#92400e" }}
                >
                  Saldo
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: totais.saldo >= 0 ? "#2563eb" : "#d97706",
                }}
              >
                R$ {totais.saldo.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs e Tabela */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: "1px solid #e5e7eb" }}>
          <Tabs
            value={tabAtual}
            onChange={handleTabChange}
            sx={{
              px: 3,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                color: "#6b7280",
              },
              "& .Mui-selected": {
                color: "#2563eb",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#2563eb",
              },
            }}
          >
            <Tab label="Todas" />
            <Tab label="Receitas" />
            <Tab label="Despesas" />
          </Tabs>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "13px",
                    py: 2,
                  }}
                >
                  DATA
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
                >
                  TIPO
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
                >
                  DESCRIÇÃO
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
                >
                  CATEGORIA
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
                >
                  VALOR
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
                >
                  AÇÕES
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimentacoesPaginadas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 8, color: "#9ca3af" }}
                  >
                    <AttachMoney sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1">
                      Nenhuma movimentação financeira
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Clique em "Nova Movimentação" para começar
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
                        "&:hover": { bgcolor: "#f9fafb" },
                        borderBottom:
                          index === movimentacoesPaginadas.length - 1
                            ? "none"
                            : "1px solid #f3f4f6",
                      }}
                    >
                      <TableCell
                        sx={{ py: 2.5, color: "#6b7280", fontSize: "14px" }}
                      >
                        {new Date(mov.data).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tipo.label}
                          size="small"
                          sx={{
                            bgcolor: tipo.bgcolor,
                            color: tipo.color,
                            fontWeight: 500,
                            fontSize: "12px",
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "#111827",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {mov.descricao}
                      </TableCell>
                      <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                        {mov.categoria}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: mov.tipo === "receita" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {mov.tipo === "receita" ? "+" : "-"} R${" "}
                        {mov.valor.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          sx={{
                            color: "#6b7280",
                            "&:hover": { bgcolor: "#f3f4f6", color: "#2563eb" },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(mov.id)}
                          sx={{
                            color: "#6b7280",
                            "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
                          }}
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

        {/* Controles de Paginação */}
        {movimentacoesFiltradas.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              py: 2,
              borderTop: "1px solid #e5e7eb",
              bgcolor: "#fafafa",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", fontSize: "14px" }}
            >
              Mostrando {indiceInicial + 1} a{" "}
              {Math.min(indiceFinal, movimentacoesFiltradas.length)} de{" "}
              {movimentacoesFiltradas.length}{" "}
              {movimentacoesFiltradas.length === 1
                ? "movimentação"
                : "movimentações"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Botão Primeira Página */}
              <IconButton
                onClick={irParaPrimeiraPagina}
                disabled={paginaAtual === 1}
                size="small"
                sx={{
                  color: "#6b7280",
                  "&:hover": { bgcolor: "#f3f4f6" },
                  "&.Mui-disabled": { color: "#d1d5db" },
                }}
              >
                <FirstPage fontSize="small" />
              </IconButton>

              {/* Botão Página Anterior */}
              <IconButton
                onClick={irParaPaginaAnterior}
                disabled={paginaAtual === 1}
                size="small"
                sx={{
                  color: "#6b7280",
                  "&:hover": { bgcolor: "#f3f4f6" },
                  "&.Mui-disabled": { color: "#d1d5db" },
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>

              {/* Números de Página */}
              <Box sx={{ display: "flex", gap: 0.5, mx: 1 }}>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (numeroPagina) => {
                    // Mostra apenas páginas próximas à atual
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
                              paginaAtual === numeroPagina ? "#fff" : "#6b7280",
                            bgcolor:
                              paginaAtual === numeroPagina
                                ? "#2563eb"
                                : "transparent",
                            "&:hover": {
                              bgcolor:
                                paginaAtual === numeroPagina
                                  ? "#1d4ed8"
                                  : "#f3f4f6",
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
                          sx={{ px: 1, color: "#9ca3af" }}
                        >
                          ...
                        </Typography>
                      );
                    }
                    return null;
                  },
                )}
              </Box>

              {/* Botão Próxima Página */}
              <IconButton
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas}
                size="small"
                sx={{
                  color: "#6b7280",
                  "&:hover": { bgcolor: "#f3f4f6" },
                  "&.Mui-disabled": { color: "#d1d5db" },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>

              {/* Botão Última Página */}
              <IconButton
                onClick={irParaUltimaPagina}
                disabled={paginaAtual === totalPaginas}
                size="small"
                sx={{
                  color: "#6b7280",
                  "&:hover": { bgcolor: "#f3f4f6" },
                  "&.Mui-disabled": { color: "#d1d5db" },
                }}
              >
                <LastPage fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "12px" },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: "20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
            px: 3,
          }}
        >
          Nova Movimentação Financeira
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  name="tipo"
                  value={currentMovimentacao.tipo}
                  onChange={handleChange}
                  label="Tipo"
                >
                  <MenuItem value="receita">Receita</MenuItem>
                  <MenuItem value="despesa">Despesa</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Descrição"
                name="descricao"
                value={currentMovimentacao.descricao}
                onChange={handleChange}
                placeholder="Ex: Venda de produtos, Pagamento de fornecedor"
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Valor"
                name="valor"
                type="number"
                value={currentMovimentacao.valor}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                inputProps={{ step: "0.01", min: "0" }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Data"
                name="data"
                type="date"
                value={currentMovimentacao.data}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  name="categoria"
                  value={currentMovimentacao.categoria}
                  onChange={handleChange}
                  label="Categoria"
                >
                  {(currentMovimentacao.tipo === "receita"
                    ? CATEGORIAS_RECEITA
                    : CATEGORIAS_DESPESA
                  ).map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                name="observacoes"
                multiline
                rows={3}
                value={currentMovimentacao.observacoes}
                onChange={handleChange}
                placeholder="Informações adicionais..."
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{ px: 3, pb: 2.5, pt: 2, borderTop: "1px solid #e5e7eb" }}
        >
          <Button
            onClick={handleCloseDialog}
            sx={{
              textTransform: "none",
              color: "#6b7280",
              "&:hover": { bgcolor: "#f3f4f6" },
              px: 3,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              boxShadow: "none",
              px: 4,
            }}
          >
            Salvar Movimentação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Financeiro;
