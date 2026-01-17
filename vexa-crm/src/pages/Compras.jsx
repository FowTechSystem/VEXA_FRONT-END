import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
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
} from "@mui/material";
import {
  ShoppingCart,
  Add,
  Edit,
  Delete,
  Close,
  AttachMoney,
  CheckCircle,
  HourglassEmpty,
} from "@mui/icons-material";

const STATUS_PEDIDO = {
  rascunho: { label: "Rascunho", color: "#6b7280", bgcolor: "#f3f4f6" },
  enviado: { label: "Enviado", color: "#2563eb", bgcolor: "#eff6ff" },
  aprovado: { label: "Aprovado", color: "#16a34a", bgcolor: "#dcfce7" },
  recebido: { label: "Recebido", color: "#059669", bgcolor: "#d1fae5" },
  cancelado: { label: "Cancelado", color: "#dc2626", bgcolor: "#fee2e2" },
};

function Compras() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [fornecedores] = useState([
    { id: 1, nome: "Fornecedor ABC Ltda" },
    { id: 2, nome: "Distribuidora XYZ" },
    { id: 3, nome: "Atacado Nacional" },
  ]);

  const [currentPedido, setCurrentPedido] = useState({
    fornecedorId: "",
    numeroPedido: "",
    dataEmissao: new Date().toISOString().split("T")[0],
    dataEntregaPrevista: "",
    status: "rascunho",
    itens: [],
    valorTotal: 0,
    frete: 0,
    desconto: 0,
    observacoes: "",
  });

  const [novoItem, setNovoItem] = useState({
    produto: "",
    quantidade: "",
    precoUnitario: "",
  });

  const handleOpenDialog = (pedido = null) => {
    if (pedido) {
      setCurrentPedido(pedido);
      setEditMode(true);
    } else {
      setCurrentPedido({
        fornecedorId: "",
        numeroPedido: `PED-${Date.now()}`,
        dataEmissao: new Date().toISOString().split("T")[0],
        dataEntregaPrevista: "",
        status: "rascunho",
        itens: [],
        valorTotal: 0,
        frete: 0,
        desconto: 0,
        observacoes: "",
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNovoItem({ produto: "", quantidade: "", precoUnitario: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentPedido({
      ...currentPedido,
      [name]: value,
    });
  };

  const handleAdicionarItem = () => {
    if (!novoItem.produto || !novoItem.quantidade || !novoItem.precoUnitario) {
      alert("Preencha todos os campos do item");
      return;
    }

    const item = {
      id: Date.now(),
      produto: novoItem.produto,
      quantidade: parseInt(novoItem.quantidade),
      precoUnitario: parseFloat(novoItem.precoUnitario),
      subtotal:
        parseInt(novoItem.quantidade) * parseFloat(novoItem.precoUnitario),
    };

    setCurrentPedido({
      ...currentPedido,
      itens: [...currentPedido.itens, item],
    });

    setNovoItem({ produto: "", quantidade: "", precoUnitario: "" });
  };

  const handleRemoverItem = (itemId) => {
    setCurrentPedido({
      ...currentPedido,
      itens: currentPedido.itens.filter((item) => item.id !== itemId),
    });
  };

  const calcularTotal = () => {
    const subtotal = currentPedido.itens.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );
    return (
      subtotal +
      parseFloat(currentPedido.frete || 0) -
      parseFloat(currentPedido.desconto || 0)
    );
  };

  const handleSave = () => {
    if (!currentPedido.fornecedorId) {
      alert("Selecione um fornecedor");
      return;
    }

    if (currentPedido.itens.length === 0) {
      alert("Adicione pelo menos um item");
      return;
    }

    const pedidoParaSalvar = {
      ...currentPedido,
      valorTotal: calcularTotal(),
      id: editMode ? currentPedido.id : Date.now(),
    };

    if (editMode) {
      setPedidos(
        pedidos.map((p) => (p.id === currentPedido.id ? pedidoParaSalvar : p))
      );
    } else {
      setPedidos([...pedidos, pedidoParaSalvar]);
    }

    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm("Deseja realmente excluir este pedido?")) {
      setPedidos(pedidos.filter((p) => p.id !== id));
    }
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
              Compras
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
              Gestão de pedidos de compra
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              borderRadius: "8px",
              px: 3,
              boxShadow: "none",
            }}
          >
            Novo Pedido
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
                <ShoppingCart sx={{ color: "#2563eb", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Total de Pedidos
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {pedidos.length}
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
                <HourglassEmpty sx={{ color: "#d97706", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Aguardando Entrega
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {pedidos.filter((p) => p.status === "aprovado").length}
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
                  Recebidos
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {pedidos.filter((p) => p.status === "recebido").length}
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
                <AttachMoney sx={{ color: "#16a34a", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Valor Total
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "#16a34a" }}
              >
                R${" "}
                {pedidos
                  .reduce((acc, p) => acc + (p.valorTotal || 0), 0)
                  .toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Tabela de Pedidos */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Nº PEDIDO
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  FORNECEDOR
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  DATA EMISSÃO
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  PREVISÃO ENTREGA
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
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#374151" }}
                >
                  AÇÕES
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pedidos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 8, color: "#9ca3af" }}
                  >
                    <ShoppingCart sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1">
                      Nenhum pedido de compra
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Clique em "Novo Pedido" para começar
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                pedidos.map((pedido) => {
                  const fornecedor = fornecedores.find(
                    (f) => f.id === pedido.fornecedorId
                  );
                  const status = STATUS_PEDIDO[pedido.status];
                  return (
                    <TableRow
                      key={pedido.id}
                      sx={{ "&:hover": { bgcolor: "#f9fafb" } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {pedido.numeroPedido}
                        </Typography>
                      </TableCell>
                      <TableCell>{fornecedor?.nome || "—"}</TableCell>
                      <TableCell>
                        {new Date(pedido.dataEmissao).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {pedido.dataEntregaPrevista
                          ? new Date(
                              pedido.dataEntregaPrevista
                            ).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        R$ {pedido.valorTotal.toFixed(2)}
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
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(pedido)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(pedido.id)}
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

      {/* Dialog de Pedido */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "12px", maxHeight: "90vh" },
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
          {editMode ? "Editar Pedido" : "Novo Pedido de Compra"}
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {/* Informações do Pedido */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#1f2937",
                mb: 3,
                fontSize: "16px",
              }}
            >
              📋 Informações do Pedido
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Número do Pedido"
                  name="numeroPedido"
                  value={currentPedido.numeroPedido}
                  onChange={handleChange}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required sx={{ bgcolor: "white" }}>
                  <InputLabel>Fornecedor</InputLabel>
                  <Select
                    name="fornecedorId"
                    value={currentPedido.fornecedorId}
                    onChange={handleChange}
                    label="Fornecedor"
                  >
                    {fornecedores.map((fornecedor) => (
                      <MenuItem key={fornecedor.id} value={fornecedor.id}>
                        {fornecedor.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ bgcolor: "white" }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={currentPedido.status}
                    onChange={handleChange}
                    label="Status"
                  >
                    {Object.entries(STATUS_PEDIDO).map(([key, value]) => (
                      <MenuItem key={key} value={key}>
                        {value.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data de Emissão"
                  name="dataEmissao"
                  type="date"
                  value={currentPedido.dataEmissao}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Previsão de Entrega"
                  name="dataEntregaPrevista"
                  type="date"
                  value={currentPedido.dataEntregaPrevista}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Itens do Pedido */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#1f2937",
                mb: 3,
                fontSize: "16px",
              }}
            >
              🛒 Itens do Pedido
            </Typography>

            {/* Adicionar Item */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Produto"
                  value={novoItem.produto}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, produto: e.target.value })
                  }
                  placeholder="Nome do produto"
                  sx={{ bgcolor: "white" }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  label="Quantidade"
                  type="number"
                  value={novoItem.quantidade}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, quantidade: e.target.value })
                  }
                  inputProps={{ min: "1" }}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Preço Unit."
                  type="number"
                  value={novoItem.precoUnitario}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, precoUnitario: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAdicionarItem}
                  sx={{
                    height: "56px",
                    textTransform: "none",
                    bgcolor: "#2563eb",
                    "&:hover": { bgcolor: "#1d4ed8" },
                    boxShadow: "none",
                  }}
                >
                  <Add />
                </Button>
              </Grid>
            </Grid>

            {/* Lista de Itens */}
            {currentPedido.itens.length > 0 && (
              <TableContainer sx={{ bgcolor: "white", borderRadius: "8px" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Quantidade
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Preço Unit.
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Subtotal
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Ação
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentPedido.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.produto}</TableCell>
                        <TableCell align="center">{item.quantidade}</TableCell>
                        <TableCell align="right">
                          R$ {item.precoUnitario.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          R$ {item.subtotal.toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleRemoverItem(item.id)}
                            sx={{ color: "#dc2626" }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* Totais */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 2,
              bgcolor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Frete"
                  name="frete"
                  type="number"
                  value={currentPedido.frete}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Desconto"
                  name="desconto"
                  type="number"
                  value={currentPedido.desconto}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                  sx={{ bgcolor: "white" }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Valor Total"
                  value={`R$ ${calcularTotal().toFixed(2)}`}
                  InputProps={{ readOnly: true }}
                  sx={{
                    bgcolor: "#dcfce7",
                    "& .MuiInputBase-input": {
                      fontWeight: 600,
                      color: "#16a34a",
                      fontSize: "18px",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  name="observacoes"
                  multiline
                  rows={2}
                  value={currentPedido.observacoes}
                  onChange={handleChange}
                  placeholder="Informações adicionais sobre o pedido..."
                  sx={{ bgcolor: "white" }}
                />
              </Grid>
            </Grid>
          </Paper>
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
            {editMode ? "Atualizar Pedido" : "Salvar Pedido"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Compras;
