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
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Container,
  Stack,
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
  CheckCircle,
  ArrowBack,
  ArrowForward,
  QrCodeScanner,
} from "@mui/icons-material";

const FORMAS_PAGAMENTO = [
  { id: "dinheiro", label: "Dinheiro", icon: <AttachMoney /> },
  { id: "credito", label: "Crédito", icon: <CreditCard /> },
  { id: "debito", label: "Débito", icon: <CreditCard /> },
  { id: "pix", label: "PIX", icon: <Pix /> },
];

const ETAPAS = ["Produtos", "Pagamento", "Confirmação"];

function Caixa() {
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [carrinho, setCarrinho] = useState([]);
  const [searchProduto, setSearchProduto] = useState("");
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

  const podeAvancar = () => {
    if (etapaAtual === 0) return carrinho.length > 0;
    if (etapaAtual === 1) {
      if (!formaPagamento) return false;
      if (formaPagamento === "dinheiro") {
        return valorRecebido && calcularTroco() >= 0;
      }
      return true;
    }
    return false;
  };

  const avancarEtapa = () => {
    if (podeAvancar()) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const voltarEtapa = () => {
    setEtapaAtual(etapaAtual - 1);
  };

  const finalizarVenda = () => {
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
    setEtapaAtual(0);

    alert("Venda realizada com sucesso!");
  };

  const cancelarVenda = () => {
    if (window.confirm("Deseja cancelar a venda atual?")) {
      setCarrinho([]);
      setDesconto(0);
      setValorRecebido("");
      setFormaPagamento("");
      setEtapaAtual(0);
    }
  };

  // ETAPA 1: Produtos
  const renderEtapaProdutos = () => (
    <Box sx={{ height: "calc(100vh - 320px)", display: "flex", gap: 3 }}>
      {/* Área de Busca - 60% */}
      <Paper
        elevation={0}
        sx={{
          flex: "1 1 60%",
          p: 4,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
          Buscar Produtos
        </Typography>

        <TextField
          fullWidth
          placeholder="Digite o nome, código ou escaneie o código de barras..."
          value={searchProduto}
          onChange={(e) => setSearchProduto(e.target.value)}
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#9ca3af", fontSize: 28 }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <QrCodeScanner sx={{ color: "#2563eb" }} />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              fontSize: "1.1rem",
              py: 1.5,
            },
          }}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              "& fieldset": { border: "2px solid #e5e7eb" },
              "&:hover fieldset": { border: "2px solid #d1d5db" },
              "&.Mui-focused fieldset": { border: "2px solid #2563eb" },
            },
          }}
        />

        <Alert
          severity="info"
          icon={<QrCodeScanner />}
          sx={{
            borderRadius: 2,
            bgcolor: "#eff6ff",
            border: "1px solid #bfdbfe",
            "& .MuiAlert-icon": {
              color: "#2563eb",
            },
          }}
        >
          Use o campo acima ou scanner de código de barras para adicionar
          produtos ao carrinho
        </Alert>

        {/* Área para lista de produtos sugeridos */}
        <Box sx={{ flex: 1, mt: 3, overflowY: "auto" }}>
          <Typography
            variant="body2"
            sx={{ color: "#9ca3af", textAlign: "center", mt: 8 }}
          >
            Os produtos aparecerão aqui conforme você digita
          </Typography>
        </Box>
      </Paper>

      {/* Carrinho - 40% */}
      <Paper
        elevation={0}
        sx={{
          flex: "1 1 40%",
          p: 3,
          borderRadius: 2,
          border: "2px solid #2563eb",
          bgcolor: "#fafafa",
          display: "flex",
          flexDirection: "column",
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
            icon={<ShoppingCart />}
            label={`${carrinho.length} ${
              carrinho.length === 1 ? "item" : "itens"
            }`}
            sx={{
              bgcolor: "#2563eb",
              color: "white",
              fontWeight: 600,
              px: 1,
            }}
          />
        </Box>

        {/* Lista de itens */}
        <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
          {carrinho.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                color: "#9ca3af",
              }}
            >
              <ShoppingCart sx={{ fontSize: 80, mb: 2, opacity: 0.2 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                Carrinho vazio
              </Typography>
              <Typography variant="body2">
                Adicione produtos para começar
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {carrinho.map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        {item.nome}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "#2563eb", fontWeight: 500 }}
                      >
                        R$ {item.precoVenda.toFixed(2)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoverProduto(item.id)}
                      sx={{
                        color: "#dc2626",
                        "&:hover": { bgcolor: "#fee2e2" },
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleAlterarQuantidade(item.id, item.quantidade - 1)
                        }
                        sx={{
                          bgcolor: "#f3f4f6",
                          "&:hover": { bgcolor: "#e5e7eb" },
                        }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography
                        sx={{
                          minWidth: 40,
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "1.1rem",
                        }}
                      >
                        {item.quantidade}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleAlterarQuantidade(item.id, item.quantidade + 1)
                        }
                        sx={{
                          bgcolor: "#2563eb",
                          color: "white",
                          "&:hover": { bgcolor: "#1d4ed8" },
                        }}
                      >
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      R$ {(item.precoVenda * item.quantidade).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        {/* Resumo */}
        {carrinho.length > 0 && (
          <Box>
            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5} sx={{ mb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body1" sx={{ color: "#6b7280" }}>
                  Subtotal
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  R$ {calcularSubtotal().toFixed(2)}
                </Typography>
              </Box>

              <TextField
                fullWidth
                size="small"
                label="Desconto (R$)"
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
            </Stack>

            <Paper
              sx={{
                p: 2,
                bgcolor: "#eff6ff",
                border: "2px solid #2563eb",
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "#2563eb" }}
                >
                  R$ {calcularTotal().toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Paper>
    </Box>
  );

  // ETAPA 2: Pagamento
  const renderEtapaPagamento = () => (
    <Box
      sx={{
        height: "calc(100vh - 320px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          maxWidth: 700,
          width: "100%",
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, mb: 1, textAlign: "center" }}
        >
          Forma de Pagamento
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#6b7280", mb: 4, textAlign: "center" }}
        >
          Selecione como o cliente deseja pagar
        </Typography>

        {/* Valor total */}
        <Paper
          sx={{
            textAlign: "center",
            mb: 4,
            p: 4,
            bgcolor: "#f9fafb",
            borderRadius: 2,
            border: "2px dashed #e5e7eb",
          }}
        >
          <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
            Total a pagar
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 700, color: "#2563eb" }}>
            R$ {calcularTotal().toFixed(2)}
          </Typography>
        </Paper>

        {/* Formas de pagamento */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {FORMAS_PAGAMENTO.map((forma) => (
            <Grid item xs={6} key={forma.id}>
              <Card
                onClick={() => setFormaPagamento(forma.id)}
                sx={{
                  cursor: "pointer",
                  border:
                    formaPagamento === forma.id
                      ? "3px solid #2563eb"
                      : "2px solid #e5e7eb",
                  bgcolor: formaPagamento === forma.id ? "#eff6ff" : "white",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "#2563eb",
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 16px rgba(37, 99, 235, 0.2)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <Box
                    sx={{
                      color:
                        formaPagamento === forma.id ? "#2563eb" : "#6b7280",
                      mb: 2,
                      fontSize: 48,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    {forma.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {forma.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Campo de valor recebido */}
        {formaPagamento === "dinheiro" && (
          <Box>
            <TextField
              fullWidth
              label="Valor Recebido"
              type="number"
              value={valorRecebido}
              onChange={(e) => setValorRecebido(e.target.value)}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{ fontWeight: 700, fontSize: "1.5rem" }}>
                      R$
                    </Typography>
                  </InputAdornment>
                ),
              }}
              inputProps={{ step: "0.01", min: "0" }}
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  fontSize: "1.8rem",
                  fontWeight: 600,
                },
                "& .MuiInputLabel-root": {
                  fontSize: "1.2rem",
                },
              }}
            />

            {valorRecebido && (
              <Paper
                sx={{
                  p: 3,
                  bgcolor: calcularTroco() >= 0 ? "#dcfce7" : "#fee2e2",
                  border:
                    calcularTroco() >= 0
                      ? "2px solid #86efac"
                      : "2px solid #fca5a5",
                  borderRadius: 2,
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
                    variant="h6"
                    sx={{
                      color: calcularTroco() >= 0 ? "#16a34a" : "#dc2626",
                      fontWeight: 600,
                    }}
                  >
                    {calcularTroco() >= 0 ? "Troco" : "Valor insuficiente"}
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: calcularTroco() >= 0 ? "#16a34a" : "#dc2626",
                      fontWeight: 700,
                    }}
                  >
                    R$ {Math.abs(calcularTroco()).toFixed(2)}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>
        )}

        {formaPagamento && formaPagamento !== "dinheiro" && (
          <Alert
            severity="success"
            sx={{
              borderRadius: 2,
              fontSize: "1rem",
              "& .MuiAlert-message": {
                fontSize: "1rem",
              },
            }}
          >
            Forma de pagamento selecionada:{" "}
            <strong>
              {FORMAS_PAGAMENTO.find((f) => f.id === formaPagamento)?.label}
            </strong>
          </Alert>
        )}
      </Paper>
    </Box>
  );

  // ETAPA 3: Confirmação
  const renderEtapaConfirmacao = () => (
    <Box
      sx={{
        height: "calc(100vh - 320px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          maxWidth: 600,
          width: "100%",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <CheckCircle sx={{ fontSize: 100, color: "#16a34a", mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Confirmar Venda
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280" }}>
            Revise os dados antes de finalizar
          </Typography>
        </Box>

        {/* Resumo da venda */}
        <Paper
          sx={{
            p: 3,
            bgcolor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 2, color: "#6b7280" }}
          >
            ITENS DA VENDA
          </Typography>
          <Stack spacing={1} sx={{ mb: 2 }}>
            {carrinho.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body1">
                  {item.quantidade}x {item.nome}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  R$ {(item.precoVenda * item.quantidade).toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body1" sx={{ color: "#6b7280" }}>
                Subtotal
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                R$ {calcularSubtotal().toFixed(2)}
              </Typography>
            </Box>

            {desconto > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="body1" sx={{ color: "#dc2626" }}>
                  Desconto
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: "#dc2626", fontWeight: 500 }}
                >
                  - R$ {desconto.toFixed(2)}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: 2,
              bgcolor: "#eff6ff",
              borderRadius: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Total
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#2563eb" }}>
              R$ {calcularTotal().toFixed(2)}
            </Typography>
          </Box>
        </Paper>

        {/* Informações de pagamento */}
        <Paper
          sx={{
            p: 3,
            bgcolor: "#dcfce7",
            border: "1px solid #86efac",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 2, color: "#16a34a" }}
          >
            PAGAMENTO
          </Typography>
          <Stack spacing={1}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body1">Forma de pagamento</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {FORMAS_PAGAMENTO.find((f) => f.id === formaPagamento)?.label}
              </Typography>
            </Box>

            {formaPagamento === "dinheiro" && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body1">Valor recebido</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    R$ {parseFloat(valorRecebido).toFixed(2)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body1">Troco</Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, color: "#16a34a" }}
                  >
                    R$ {calcularTroco().toFixed(2)}
                  </Typography>
                </Box>
              </>
            )}
          </Stack>
        </Paper>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: "#fafafa", minHeight: "100vh" }}>
      {/* Header Fixo */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid #e5e7eb",
          px: 4,
          py: 2,
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
          Caixa / PDV
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          Ponto de Venda - Sistema em Etapas
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Stepper */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            border: "1px solid #e5e7eb",
          }}
        >
          <Stepper activeStep={etapaAtual} alternativeLabel>
            {ETAPAS.map((label) => (
              <Step key={label}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      fontSize: "2rem",
                      "&.Mui-active": {
                        color: "#2563eb",
                      },
                      "&.Mui-completed": {
                        color: "#16a34a",
                      },
                    },
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Conteúdo */}
        <Box sx={{ mb: 3 }}>
          {etapaAtual === 0 && renderEtapaProdutos()}
          {etapaAtual === 1 && renderEtapaPagamento()}
          {etapaAtual === 2 && renderEtapaConfirmacao()}
        </Box>

        {/* Barra de Ações Fixa */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "white",
            borderTop: "2px solid #e5e7eb",
            zIndex: 1000,
          }}
        >
          <Container maxWidth="xl">
            <Box
              sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
            >
              <Button
                variant="outlined"
                onClick={cancelarVenda}
                size="large"
                sx={{
                  textTransform: "none",
                  borderColor: "#dc2626",
                  color: "#dc2626",
                  fontWeight: 600,
                  px: 4,
                  "&:hover": {
                    borderColor: "#dc2626",
                    bgcolor: "#fee2e2",
                  },
                }}
              >
                Cancelar Venda
              </Button>

              <Box sx={{ display: "flex", gap: 2 }}>
                {etapaAtual > 0 && (
                  <Button
                    variant="outlined"
                    onClick={voltarEtapa}
                    startIcon={<ArrowBack />}
                    size="large"
                    sx={{
                      textTransform: "none",
                      borderColor: "#6b7280",
                      color: "#6b7280",
                      fontWeight: 600,
                      px: 4,
                      "&:hover": {
                        borderColor: "#2563eb",
                        color: "#2563eb",
                      },
                    }}
                  >
                    Voltar
                  </Button>
                )}

                {etapaAtual < 2 ? (
                  <Button
                    variant="contained"
                    onClick={avancarEtapa}
                    disabled={!podeAvancar()}
                    endIcon={<ArrowForward />}
                    size="large"
                    sx={{
                      textTransform: "none",
                      bgcolor: "#2563eb",
                      fontWeight: 600,
                      px: 5,
                      fontSize: "1rem",
                      "&:hover": { bgcolor: "#1d4ed8" },
                      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                      "&:disabled": {
                        bgcolor: "#e5e7eb",
                        color: "#9ca3af",
                      },
                    }}
                  >
                    Avançar
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={finalizarVenda}
                    startIcon={<CheckCircle />}
                    size="large"
                    sx={{
                      textTransform: "none",
                      bgcolor: "#16a34a",
                      fontWeight: 600,
                      px: 5,
                      fontSize: "1rem",
                      "&:hover": { bgcolor: "#15803d" },
                      boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)",
                    }}
                  >
                    Confirmar e Finalizar
                  </Button>
                )}
              </Box>
            </Box>
          </Container>
        </Paper>

        {/* Espaço para não sobrepor com a barra fixa */}
        <Box sx={{ height: 80 }} />
      </Container>
    </Box>
  );
}

export default Caixa;
