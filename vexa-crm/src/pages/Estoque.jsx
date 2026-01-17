import React, { useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
} from "@mui/material";
import {
  Inventory,
  Add,
  Remove,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Edit,
  Search,
  Warning,
  CheckCircle,
  Close,
} from "@mui/icons-material";

const TIPOS_MOVIMENTACAO = {
  entrada: { label: "Entrada", icon: <TrendingUp />, color: "#16a34a" },
  saida: { label: "Saída", icon: <TrendingDown />, color: "#dc2626" },
  ajuste: { label: "Ajuste", icon: <SwapHoriz />, color: "#2563eb" },
  inventario: { label: "Inventário", icon: <Inventory />, color: "#9333ea" },
};

function Estoque() {
  const [tabAtual, setTabAtual] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [produtos, setProdutos] = useState([
    {
      id: 1,
      nome: "Camiseta Básica",
      sku: "CAM-001",
      estoqueAtual: 45,
      estoqueMinimo: 20,
      estoqueMaximo: 100,
      valorUnitario: 29.9,
    },
    {
      id: 2,
      nome: "Calça Jeans",
      sku: "CAL-002",
      estoqueAtual: 8,
      estoqueMinimo: 15,
      estoqueMaximo: 50,
      valorUnitario: 89.9,
    },
  ]);

  const [movimentacoes, setMovimentacoes] = useState([]);
  const [currentMovimentacao, setCurrentMovimentacao] = useState({
    tipo: "entrada",
    produtoId: "",
    quantidade: "",
    motivo: "",
    observacoes: "",
    data: new Date().toISOString().split("T")[0],
  });

  const handleOpenDialog = () => {
    setCurrentMovimentacao({
      tipo: "entrada",
      produtoId: "",
      quantidade: "",
      motivo: "",
      observacoes: "",
      data: new Date().toISOString().split("T")[0],
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

  const handleSaveMovimentacao = () => {
    const produto = produtos.find(
      (p) => p.id === parseInt(currentMovimentacao.produtoId)
    );

    if (!produto) {
      alert("Selecione um produto");
      return;
    }

    const quantidade = parseInt(currentMovimentacao.quantidade);
    if (!quantidade || quantidade <= 0) {
      alert("Quantidade inválida");
      return;
    }

    // Atualizar estoque
    const novoEstoque = [...produtos];
    const index = novoEstoque.findIndex((p) => p.id === produto.id);

    if (currentMovimentacao.tipo === "entrada") {
      novoEstoque[index].estoqueAtual += quantidade;
    } else if (currentMovimentacao.tipo === "saida") {
      if (novoEstoque[index].estoqueAtual < quantidade) {
        alert("Estoque insuficiente");
        return;
      }
      novoEstoque[index].estoqueAtual -= quantidade;
    } else if (currentMovimentacao.tipo === "ajuste") {
      novoEstoque[index].estoqueAtual = quantidade;
    }

    setProdutos(novoEstoque);

    // Registrar movimentação
    const novaMovimentacao = {
      id: Date.now(),
      ...currentMovimentacao,
      produtoNome: produto.nome,
      produtoSku: produto.sku,
      timestamp: new Date().toISOString(),
    };
    setMovimentacoes([novaMovimentacao, ...movimentacoes]);

    handleCloseDialog();
  };

  const getProdutoStatus = (produto) => {
    if (produto.estoqueAtual <= produto.estoqueMinimo) {
      return { label: "Crítico", color: "#dc2626", bgcolor: "#fee2e2" };
    } else if (produto.estoqueAtual <= produto.estoqueMinimo * 1.5) {
      return { label: "Baixo", color: "#d97706", bgcolor: "#fef3c7" };
    }
    return { label: "Normal", color: "#16a34a", bgcolor: "#dcfce7" };
  };

  const calcularValorEstoque = () => {
    return produtos.reduce(
      (acc, p) => acc + p.estoqueAtual * p.valorUnitario,
      0
    );
  };

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Estoque
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
              Controle e movimentação de estoque
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
          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Inventory sx={{ color: "#2563eb", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Total de Produtos
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {produtos.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Warning sx={{ color: "#d97706", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Estoque Baixo
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {
                  produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo)
                    .length
                }
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CheckCircle sx={{ color: "#16a34a", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Itens em Estoque
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {produtos.reduce((acc, p) => acc + p.estoqueAtual, 0)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Valor Total
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "#16a34a" }}
              >
                R$ {calcularValorEstoque().toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: "1px solid #e5e7eb", px: 3 }}>
          <Tabs
            value={tabAtual}
            onChange={(e, newValue) => setTabAtual(newValue)}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
              },
            }}
          >
            <Tab label="Visão Geral" />
            <Tab label="Movimentações" />
            <Tab label="Inventário" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Tab Visão Geral */}
          {tabAtual === 0 && (
            <Box>
              <TextField
                fullWidth
                placeholder="Buscar produto por nome ou SKU..."
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
                  mb: 3,
                  bgcolor: "white",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { border: "1px solid #e5e7eb" },
                    "&:hover fieldset": { border: "1px solid #d1d5db" },
                    "&.Mui-focused fieldset": { border: "1px solid #2563eb" },
                  },
                }}
              />

              {produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo)
                .length > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Existem{" "}
                    {
                      produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo)
                        .length
                    }{" "}
                    produtos com estoque baixo ou crítico
                  </Typography>
                </Alert>
              )}

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        PRODUTO
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        SKU
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 600, color: "#374151" }}
                      >
                        ESTOQUE ATUAL
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 600, color: "#374151" }}
                      >
                        ESTOQUE MÍN/MÁX
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, color: "#374151" }}
                      >
                        VALOR UNIT.
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 600, color: "#374151" }}
                      >
                        VALOR TOTAL
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 600, color: "#374151" }}
                      >
                        STATUS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {produtosFiltrados.map((produto) => {
                      const status = getProdutoStatus(produto);
                      return (
                        <TableRow
                          key={produto.id}
                          sx={{ "&:hover": { bgcolor: "#f9fafb" } }}
                        >
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {produto.nome}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={produto.sku}
                              size="small"
                              sx={{
                                bgcolor: "#f3f4f6",
                                fontSize: "11px",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, fontSize: "16px" }}
                            >
                              {produto.estoqueAtual}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b7280" }}
                            >
                              {produto.estoqueMinimo} / {produto.estoqueMaximo}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            R$ {produto.valorUnitario.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            R${" "}
                            {(
                              produto.estoqueAtual * produto.valorUnitario
                            ).toFixed(2)}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={status.label}
                              size="small"
                              sx={{
                                bgcolor: status.bgcolor,
                                color: status.color,
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab Movimentações */}
          {tabAtual === 1 && (
            <Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        DATA/HORA
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        TIPO
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        PRODUTO
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 600, color: "#374151" }}
                      >
                        QUANTIDADE
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        MOTIVO
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                        OBSERVAÇÕES
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimentacoes.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          sx={{ py: 8, color: "#9ca3af" }}
                        >
                          <SwapHoriz
                            sx={{ fontSize: 48, mb: 2, opacity: 0.5 }}
                          />
                          <Typography variant="body1">
                            Nenhuma movimentação registrada
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentacoes.map((mov) => {
                        const tipo = TIPOS_MOVIMENTACAO[mov.tipo];
                        return (
                          <TableRow
                            key={mov.id}
                            sx={{ "&:hover": { bgcolor: "#f9fafb" } }}
                          >
                            <TableCell>
                              <Typography
                                variant="caption"
                                sx={{ color: "#6b7280" }}
                              >
                                {new Date(mov.timestamp).toLocaleString()}
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
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {mov.produtoNome}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "#6b7280" }}
                              >
                                {mov.produtoSku}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {mov.tipo === "saida" ? "-" : "+"}
                                {mov.quantidade}
                              </Typography>
                            </TableCell>
                            <TableCell>{mov.motivo || "—"}</TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                sx={{ color: "#6b7280" }}
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
              </TableContainer>
            </Box>
          )}

          {/* Tab Inventário */}
          {tabAtual === 2 && (
            <Box sx={{ textAlign: "center", py: 8, color: "#9ca3af" }}>
              <Inventory sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                Inventário em desenvolvimento
              </Typography>
              <Typography variant="body2">
                Aqui você poderá realizar contagens de estoque
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Dialog de Movimentação */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
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
          Nova Movimentação de Estoque
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Movimentação</InputLabel>
                <Select
                  name="tipo"
                  value={currentMovimentacao.tipo}
                  onChange={handleChange}
                  label="Tipo de Movimentação"
                >
                  {Object.entries(TIPOS_MOVIMENTACAO).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {value.icon}
                        {value.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Produto</InputLabel>
                <Select
                  name="produtoId"
                  value={currentMovimentacao.produtoId}
                  onChange={handleChange}
                  label="Produto"
                >
                  {produtos.map((produto) => (
                    <MenuItem key={produto.id} value={produto.id}>
                      {produto.nome} ({produto.sku}) - Estoque:{" "}
                      {produto.estoqueAtual}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label={
                  currentMovimentacao.tipo === "ajuste"
                    ? "Novo Estoque"
                    : "Quantidade"
                }
                name="quantidade"
                type="number"
                value={currentMovimentacao.quantidade}
                onChange={handleChange}
                inputProps={{ min: "1" }}
                helperText={
                  currentMovimentacao.tipo === "ajuste"
                    ? "Digite o valor correto do estoque"
                    : "Quantidade a movimentar"
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data"
                name="data"
                type="date"
                value={currentMovimentacao.data}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivo"
                name="motivo"
                value={currentMovimentacao.motivo}
                onChange={handleChange}
                placeholder="Ex: Compra, Venda, Devolução, Ajuste de inventário"
              />
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
                placeholder="Informações adicionais sobre a movimentação..."
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
            onClick={handleSaveMovimentacao}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              boxShadow: "none",
              px: 4,
            }}
          >
            Confirmar Movimentação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Estoque;
