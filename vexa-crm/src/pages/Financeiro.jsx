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
            onChange={(e, newValue) => setTabAtual(newValue)}
            sx={{
              px: 3,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
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
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  DATA
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  TIPO
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  DESCRIÇÃO
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  CATEGORIA
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#374151" }}
                >
                  VALOR
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#374151" }}
                >
                  AÇÕES
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimentacoesFiltradas.length === 0 ? (
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
                  </TableCell>
                </TableRow>
              ) : (
                movimentacoesFiltradas.map((mov) => {
                  const tipo = TIPOS_MOVIMENTACAO[mov.tipo];
                  return (
                    <TableRow
                      key={mov.id}
                      sx={{ "&:hover": { bgcolor: "#f9fafb" } }}
                    >
                      <TableCell>
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
                          }}
                        />
                      </TableCell>
                      <TableCell>{mov.descricao}</TableCell>
                      <TableCell>{mov.categoria}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 600,
                          color: mov.tipo === "receita" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {mov.tipo === "receita" ? "+" : "-"} R${" "}
                        {mov.valor.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(mov.id)}
                          sx={{ color: "#dc2626" }}
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
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
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
              <FormControl fullWidth required>
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
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
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
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: "1px solid #e5e7eb" }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ textTransform: "none", color: "#6b7280" }}
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
