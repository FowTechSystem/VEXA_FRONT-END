// src/components/Vendas/NovaVendaDialog.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Autocomplete,
  IconButton,
  Typography,
  Box,
  Divider,
  InputAdornment,
  Avatar,
  Paper,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import {
  Close,
  ShoppingCart,
  Person,
  Inventory,
  AccountBalanceWallet,
  LocalOffer,
} from "@mui/icons-material";
import VexaDatePicker from "../VexaDatePicker";
import {
  isProdutoBazar,
  QUANTIDADE_PRODUTO_BAZAR,
} from "../Bazar/bazarHelpers";
import { showError } from "../../utils/notifications";

const INITIAL_STATE = {
  clienteId: null,
  produtoId: null,
  quantidade: 1,
  valorUnitario: 0,
  desconto: 0,
  descontoPercentual: 0,
  valorTotal: 0,
  creditoUtilizado: 0,
  codigoBarras: "",
  observacoes: "",
  dataVenda: new Date().toISOString().split("T")[0],
};

export const NovaVendaDialog = ({
  open,
  onClose,
  clientes,
  produtos,
  onSave,
}) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFormData(INITIAL_STATE);
      setSelectedCliente(null);
      setSelectedProduto(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleClose = () => {
    if (!submitting) onClose();
  };

  const calcularValores = (dados) => {
    const {
      quantidade,
      valorUnitario,
      desconto,
      descontoPercentual,
      creditoUtilizado,
    } = dados;
    const subtotal = quantidade * valorUnitario;
    const descontoValor =
      descontoPercentual > 0 ? (subtotal * descontoPercentual) / 100 : desconto;
    const totalComDesconto = subtotal - descontoValor;
    const valorFinal = Math.max(0, totalComDesconto - creditoUtilizado);

    return { subtotal, descontoValor, totalComDesconto, valorFinal };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const valores = calcularValores(formData);
      const vendaData = {
        ...formData,
        valorTotal: valores.valorFinal,
        subtotal: valores.subtotal,
        descontoAplicado: valores.descontoValor,
      };
      const result = await onSave(vendaData);
      if (result.success) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === "quantidade" || field === "valorUnitario") {
        const valores = calcularValores(newData);
        newData.valorTotal = valores.valorFinal;
      }
      return newData;
    });
  };

  const handleProdutoChange = (value) => {
    setSelectedProduto(value);
    if (value) {
      const qty = isProdutoBazar(value)
        ? QUANTIDADE_PRODUTO_BAZAR
        : formData.quantidade;
      const newData = {
        ...formData,
        produtoId: value.id,
        quantidade: qty,
        valorUnitario: value.preco || 0,
        codigoBarras: value.codigoBarras || "",
      };
      const valores = calcularValores(newData);
      setFormData({ ...newData, valorTotal: valores.valorFinal });
    }
  };

  const handleQuantidadeChange = (quantidade) => {
    if (isProdutoBazar(selectedProduto)) {
      showError("Peças do bazar são vendidas em quantidade fixa (1 unidade).");
      return;
    }
    const qty = parseInt(quantidade) || 1;
    const newData = { ...formData, quantidade: qty };
    const valores = calcularValores(newData);
    setFormData({ ...newData, valorTotal: valores.valorFinal });
  };

  const handleDescontoChange = (valor) => {
    const desconto = parseFloat(valor) || 0;
    const newData = { ...formData, desconto, descontoPercentual: 0 };
    const valores = calcularValores(newData);
    setFormData({ ...newData, valorTotal: valores.valorFinal });
  };

  const handleDescontoPercentualChange = (percentual) => {
    const descontoPercentual = parseFloat(percentual) || 0;
    const newData = { ...formData, descontoPercentual, desconto: 0 };
    const valores = calcularValores(newData);
    setFormData({ ...newData, valorTotal: valores.valorFinal });
  };

  const handleCreditoChange = (credito) => {
    const creditoUtilizado = parseFloat(credito) || 0;
    const creditoDisponivel = selectedCliente?.credito || 0;
    const creditoFinal = Math.min(creditoUtilizado, creditoDisponivel);
    const newData = { ...formData, creditoUtilizado: creditoFinal };
    const valores = calcularValores(newData);
    setFormData({ ...newData, valorTotal: valores.valorFinal });
  };

  const valores = calcularValores(formData);
  const creditoDisponivel = selectedCliente?.credito || 0;
  const isFormValid =
    formData.clienteId &&
    formData.produtoId &&
    formData.quantidade > 0 &&
    formData.valorUnitario > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, maxHeight: "92vh" },
      }}
    >
      {/* ========== HEADER ========== */}
      <DialogTitle sx={{ pb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                bgcolor: "primary.main",
                color: "white",
                p: 1,
                borderRadius: 2,
                display: "flex",
              }}
            >
              <ShoppingCart />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Nova Venda
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Preencha os dados para registrar a venda
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} disabled={submitting}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      {/* ========== CONTENT ========== */}
      <DialogContent sx={{ pt: 3, px: 3 }}>
        <Grid container spacing={3}>
          {/* ========== COLUNA ESQUERDA ========== */}
          <Grid item xs={12} md={7}>
            {/* CLIENTE */}
            <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Person color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Cliente
                  </Typography>
                </Box>

                <Autocomplete
                  value={selectedCliente}
                  options={clientes}
                  getOptionLabel={(option) =>
                    option.nomeCompleto || option.nome || ""
                  }
                  onChange={(_, value) => {
                    setSelectedCliente(value);
                    handleFieldChange("clienteId", value?.id);
                  }}
                  disabled={submitting}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      display="flex"
                      gap={2}
                      py={1}
                    >
                      <Avatar
                        src={option.imagemUrl}
                        alt={option.nome}
                        sx={{ width: 45, height: 45 }}
                      >
                        {option.nome?.charAt(0)}
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {option.nomeCompleto || option.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email || option.telefone}
                        </Typography>
                        <Box display="flex" gap={1} mt={0.5}>
                          <Chip
                            label={`Crédito: R$ ${parseFloat(
                              option.credito || 0
                            ).toFixed(2)}`}
                            size="small"
                            color={option.credito > 0 ? "success" : "default"}
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Busque pelo nome ou documento"
                      variant="outlined"
                      required
                    />
                  )}
                />

                {/* INFO CLIENTE SELECIONADO */}
                {selectedCliente && (
                  <Box
                    mt={2}
                    p={2}
                    bgcolor="grey.50"
                    borderRadius={2}
                    display="flex"
                    gap={2}
                  >
                    <Avatar
                      src={selectedCliente.imagemUrl}
                      sx={{ width: 60, height: 60 }}
                    >
                      {selectedCliente.nome?.charAt(0)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedCliente.nomeCompleto || selectedCliente.nome}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {selectedCliente.email}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {selectedCliente.telefone}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        <Chip
                          icon={<AccountBalanceWallet sx={{ fontSize: 16 }} />}
                          label={`R$ ${creditoDisponivel.toFixed(2)}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* CRÉDITO A UTILIZAR */}
                {selectedCliente && creditoDisponivel > 0 && (
                  <TextField
                    fullWidth
                    label="Crédito a Utilizar"
                    type="number"
                    value={formData.creditoUtilizado}
                    onChange={(e) => handleCreditoChange(e.target.value)}
                    disabled={submitting}
                    sx={{ mt: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                    inputProps={{ min: 0, max: creditoDisponivel, step: 0.01 }}
                    helperText={`Disponível: R$ ${creditoDisponivel.toFixed(
                      2
                    )}`}
                  />
                )}
              </CardContent>
            </Card>

            {/* PRODUTO */}
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Inventory color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Produto
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={8}>
                    <Autocomplete
                      value={selectedProduto}
                      options={produtos}
                      getOptionLabel={(option) => option.nome || ""}
                      onChange={(_, value) => handleProdutoChange(value)}
                      disabled={submitting}
                      renderOption={(props, option) => (
                        <Box
                          component="li"
                          {...props}
                          display="flex"
                          gap={2}
                          py={1}
                        >
                          <Avatar
                            src={option.imagemUrl}
                            alt={option.nome}
                            variant="rounded"
                            sx={{ width: 50, height: 50 }}
                          >
                            📦
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={600}>
                              {option.nome}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {option.codigoBarras &&
                                `Cód: ${option.codigoBarras}`}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="primary"
                              display="block"
                              fontWeight={600}
                            >
                              R$ {parseFloat(option.preco || 0).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Busque por nome ou código"
                          required
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      label="Quantidade"
                      type="number"
                      value={
                        isProdutoBazar(selectedProduto)
                          ? QUANTIDADE_PRODUTO_BAZAR
                          : formData.quantidade
                      }
                      onChange={(e) => handleQuantidadeChange(e.target.value)}
                      disabled={submitting || isProdutoBazar(selectedProduto)}
                      helperText={
                        isProdutoBazar(selectedProduto)
                          ? "Peça única do bazar (fixo em 1)"
                          : undefined
                      }
                      inputProps={{
                        min: 1,
                        max: isProdutoBazar(selectedProduto)
                          ? QUANTIDADE_PRODUTO_BAZAR
                          : undefined,
                        step: 1,
                      }}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Código de Barras"
                      value={formData.codigoBarras}
                      onChange={(e) =>
                        handleFieldChange("codigoBarras", e.target.value)
                      }
                      disabled={submitting}
                      placeholder="EAN-13"
                      size="small"
                    />
                  </Grid>
                </Grid>

                {/* INFO PRODUTO SELECIONADO */}
                {selectedProduto && (
                  <Box
                    mt={2}
                    p={2}
                    bgcolor="grey.50"
                    borderRadius={2}
                    display="flex"
                    gap={2}
                  >
                    <Avatar
                      src={selectedProduto.imagemUrl}
                      variant="rounded"
                      sx={{ width: 70, height: 70 }}
                    >
                      📦
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedProduto.nome}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {selectedProduto.descricao}
                      </Typography>
                      <Box display="flex" gap={1} mt={1}>
                        <Chip
                          label={`R$ ${parseFloat(
                            selectedProduto.preco || 0
                          ).toFixed(2)}`}
                          size="small"
                          color="primary"
                        />
                        {selectedProduto.estoque !== undefined && (
                          <Chip
                            label={`Estoque: ${selectedProduto.estoque}`}
                            size="small"
                            color={
                              selectedProduto.estoque > 0 ? "success" : "error"
                            }
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ========== COLUNA DIREITA ========== */}
          <Grid item xs={12} md={5}>
            {/* VALORES */}
            <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <LocalOffer color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Valores e Descontos
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Valor Unitário"
                      type="number"
                      value={formData.valorUnitario}
                      onChange={(e) =>
                        handleFieldChange(
                          "valorUnitario",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={submitting}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">R$</InputAdornment>
                        ),
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                      required
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Desconto R$"
                      type="number"
                      value={formData.desconto}
                      onChange={(e) => handleDescontoChange(e.target.value)}
                      disabled={submitting || formData.descontoPercentual > 0}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">R$</InputAdornment>
                        ),
                      }}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Desconto %"
                      type="number"
                      value={formData.descontoPercentual}
                      onChange={(e) =>
                        handleDescontoPercentualChange(e.target.value)
                      }
                      disabled={submitting || formData.desconto > 0}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">%</InputAdornment>
                        ),
                      }}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <VexaDatePicker
                      label="Data da Venda"
                      value={formData.dataVenda}
                      onChange={(v) => handleFieldChange("dataVenda", v)}
                      disabled={submitting}
                      fullWidth
                      minWidth={0}
                      slotProps={{ textField: { required: true } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Observações"
                      multiline
                      rows={3}
                      value={formData.observacoes}
                      onChange={(e) =>
                        handleFieldChange("observacoes", e.target.value)
                      }
                      disabled={submitting}
                      placeholder="Informações adicionais..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* RESUMO */}
            {selectedProduto && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  bgcolor: "primary.50",
                  border: "2px solid",
                  borderColor: "primary.main",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                  color="primary"
                >
                  💰 Resumo da Venda
                </Typography>

                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal ({formData.quantidade}x)
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    R$ {valores.subtotal.toFixed(2)}
                  </Typography>
                </Box>

                {valores.descontoValor > 0 && (
                  <Box display="flex" justifyContent="space-between" py={1}>
                    <Typography variant="body2" color="text.secondary">
                      Desconto
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="error.main"
                    >
                      - R$ {valores.descontoValor.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                {formData.creditoUtilizado > 0 && (
                  <Box display="flex" justifyContent="space-between" py={1}>
                    <Typography variant="body2" color="text.secondary">
                      Crédito Utilizado
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="success.main"
                    >
                      - R$ {formData.creditoUtilizado.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6" fontWeight={700}>
                    Total
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    color="primary.main"
                  >
                    R$ {valores.valorFinal.toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      {/* ========== FOOTER ========== */}
      <DialogActions sx={{ px: 3, py: 2.5 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          sx={{ textTransform: "none", px: 3 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || submitting}
          size="large"
          sx={{
            textTransform: "none",
            px: 4,
            fontWeight: 600,
          }}
        >
          {submitting ? "Salvando..." : "Finalizar Venda"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
