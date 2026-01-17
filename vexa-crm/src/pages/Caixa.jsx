import React, { useState } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from "@mui/material";
import {
  ShoppingCart,
  Search,
  Delete,
  Add,
  Remove,
  AttachMoney,
  CreditCard,
  Pix,
  Close,
} from "@mui/icons-material";

const FORMAS_PAGAMENTO = [
  { id: "dinheiro", label: "Dinheiro", icon: <AttachMoney /> },
  { id: "credito", label: "Crédito", icon: <CreditCard /> },
  { id: "debito", label: "Débito", icon: <CreditCard /> },
  { id: "pix", label: "PIX", icon: <Pix /> },
];

function Caixa() {
  const [carrinho, setCarrinho] = useState([]);
  const [searchProduto, setSearchProduto] = useState("");
  const [openPagamento, setOpenPagamento] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [desconto, setDesconto] = useState(0);

  const handleRemoverProduto = (id) => {
    setCarrinho(carrinho.filter((item) => item.id !== id));
  };

  const handleAlterarQuantidade = (id, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      handleRemoverProduto(id);
      return;
    }
    setCarrinho(
      carrinho.map((item) =>
        item.id === id ? { ...item, quantidade: novaQuantidade } : item
      )
    );
  };

  const calcularSubtotal = () => {
    return carrinho.reduce(
      (acc, item) => acc + item.precoVenda * item.quantidade,
      0
    );
  };

  const calcularTotal = () => {
    return calcularSubtotal() - desconto;
  };

  const calcularTroco = () => {
    if (formaPagamento === "dinheiro" && valorRecebido) {
      return parseFloat(valorRecebido) - calcularTotal();
    }
    return 0;
  };

  const handleFinalizarVenda = () => {
    if (carrinho.length === 0) {
      alert("Adicione produtos ao carrinho");
      return;
    }
    setOpenPagamento(true);
  };

  const handleConfirmarPagamento = () => {
    console.log("Venda finalizada:", {
      itens: carrinho,
      subtotal: calcularSubtotal(),
      desconto,
      total: calcularTotal(),
      formaPagamento,
      valorRecebido,
      troco: calcularTroco(),
    });

    setCarrinho([]);
    setDesconto(0);
    setValorRecebido("");
    setFormaPagamento("");
    setOpenPagamento(false);

    alert("Venda realizada com sucesso!");
  };

  const handleCancelarVenda = () => {
    if (window.confirm("Deseja cancelar a venda atual?")) {
      setCarrinho([]);
      setDesconto(0);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
          Caixa / PDV
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
          Ponto de Venda
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Área de busca e produtos */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              minHeight: "calc(100vh - 200px)",
            }}
          >
            <TextField
              fullWidth
              placeholder="Buscar produto por nome, código ou código de barras..."
              value={searchProduto}
              onChange={(e) => setSearchProduto(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { border: "1px solid #e5e7eb" },
                  "&:hover fieldset": { border: "1px solid #d1d5db" },
                  "&.Mui-focused fieldset": { border: "1px solid #2563eb" },
                },
              }}
            />

            <Typography variant="body2" sx={{ color: "#6b7280", mb: 2 }}>
              Use o campo de busca ou scanner de código de barras
            </Typography>
          </Paper>
        </Grid>

        {/* Carrinho e resumo */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              position: "sticky",
              top: 20,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Carrinho
              </Typography>
              <Chip
                label={`${carrinho.length} ${
                  carrinho.length === 1 ? "item" : "itens"
                }`}
                size="small"
                sx={{ bgcolor: "#eff6ff", color: "#2563eb" }}
              />
            </Box>

            {/* Itens do carrinho */}
            <Box sx={{ mb: 3, maxHeight: 400, overflowY: "auto" }}>
              {carrinho.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    color: "#9ca3af",
                  }}
                >
                  <ShoppingCart sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body2">Carrinho vazio</Typography>
                </Box>
              ) : (
                carrinho.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                      p: 2,
                      bgcolor: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.nome}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#6b7280" }}>
                        R$ {item.precoVenda.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleAlterarQuantidade(item.id, item.quantidade - 1)
                        }
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 30, textAlign: "center" }}>
                        {item.quantidade}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleAlterarQuantidade(item.id, item.quantidade + 1)
                        }
                      >
                        <Add fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoverProduto(item.id)}
                        sx={{ color: "#dc2626" }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Resumo */}
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Subtotal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  R$ {calcularSubtotal().toFixed(2)}
                </Typography>
              </Box>

              <Box sx={{ mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Desconto"
                  type="number"
                  value={desconto}
                  onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#2563eb" }}
                >
                  R$ {calcularTotal().toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Botões de ação */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCancelarVenda}
                disabled={carrinho.length === 0}
                sx={{
                  textTransform: "none",
                  borderColor: "#e5e7eb",
                  color: "#6b7280",
                  "&:hover": {
                    borderColor: "#dc2626",
                    bgcolor: "#fef2f2",
                    color: "#dc2626",
                  },
                }}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFinalizarVenda}
                disabled={carrinho.length === 0}
                sx={{
                  textTransform: "none",
                  bgcolor: "#2563eb",
                  "&:hover": { bgcolor: "#1d4ed8" },
                  boxShadow: "none",
                }}
              >
                Finalizar Venda
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog de Pagamento */}
      <Dialog
        open={openPagamento}
        onClose={() => setOpenPagamento(false)}
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
          Finalizar Pagamento
          <IconButton onClick={() => setOpenPagamento(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ textAlign: "center", mb: 1 }}>
              R$ {calcularTotal().toFixed(2)}
            </Typography>
            <Typography
              variant="body2"
              sx={{ textAlign: "center", color: "#6b7280" }}
            >
              Total a pagar
            </Typography>
          </Box>

          <Typography
            variant="subtitle2"
            sx={{ mb: 2, fontWeight: 600, color: "#374151" }}
          >
            Forma de Pagamento
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {FORMAS_PAGAMENTO.map((forma) => (
              <Grid item xs={6} key={forma.id}>
                <Card
                  onClick={() => setFormaPagamento(forma.id)}
                  sx={{
                    cursor: "pointer",
                    border:
                      formaPagamento === forma.id
                        ? "2px solid #2563eb"
                        : "1px solid #e5e7eb",
                    bgcolor: formaPagamento === forma.id ? "#eff6ff" : "white",
                    "&:hover": {
                      borderColor: "#2563eb",
                      bgcolor: "#f9fafb",
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Box sx={{ color: "#2563eb", mb: 1 }}>{forma.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {forma.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {formaPagamento === "dinheiro" && (
            <Box>
              <TextField
                fullWidth
                label="Valor Recebido"
                type="number"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                inputProps={{ step: "0.01", min: "0" }}
                sx={{ mb: 2 }}
              />
              {valorRecebido && calcularTroco() >= 0 && (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "#dcfce7",
                    border: "1px solid #86efac",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "#16a34a", fontWeight: 500 }}
                    >
                      Troco
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#16a34a", fontWeight: 600 }}
                    >
                      R$ {calcularTroco().toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: "1px solid #e5e7eb" }}>
          <Button
            onClick={() => setOpenPagamento(false)}
            sx={{ textTransform: "none", color: "#6b7280" }}
          >
            Voltar
          </Button>
          <Button
            onClick={handleConfirmarPagamento}
            variant="contained"
            disabled={
              !formaPagamento ||
              (formaPagamento === "dinheiro" && calcularTroco() < 0)
            }
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              boxShadow: "none",
              px: 4,
            }}
          >
            Confirmar Pagamento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Caixa;
