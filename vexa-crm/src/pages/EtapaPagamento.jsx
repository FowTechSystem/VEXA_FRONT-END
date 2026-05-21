// src/pages/Vendas/components/EtapaPagamento.jsx
import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import { Payments, CreditCard, Pix, Money, Delete } from "@mui/icons-material";

const formasPagamento = [
  { id: "dinheiro", label: "Dinheiro", icon: <Money /> },
  { id: "debito", label: "Débito", icon: <CreditCard /> },
  { id: "credito", label: "Crédito", icon: <Payments /> },
  { id: "pix", label: "PIX", icon: <Pix /> },
];

function EtapaPagamento({ venda, setVenda, totalVenda }) {
  const [formaSelecionada, setFormaSelecionada] = useState("");
  const [valorParcial, setValorParcial] = useState(totalVenda);

  const totalPago = venda.pagamentos.reduce((acc, p) => acc + p.valor, 0);
  const restante = totalVenda - totalPago;
  const troco = totalPago - totalVenda;

  useEffect(() => {
    restante > 0 ? restante : 0;
  }, [restante]);

  const adicionarPagamento = () => {
    if (!formaSelecionada || valorParcial <= 0) return;

    setVenda({
      ...venda,
      pagamentos: [
        ...venda.pagamentos,
        {
          forma: formaSelecionada,
          valor: Number(valorParcial),
        },
      ],
    });

    setFormaSelecionada("");
    setValorParcial(0);
  };

  const removerPagamento = (index) => {
    setVenda({
      ...venda,
      pagamentos: venda.pagamentos.filter((_, i) => i !== index),
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Formas de Pagamento
            </Typography>

            <ToggleButtonGroup
              value={formaSelecionada}
              exclusive
              onChange={(e, value) => setFormaSelecionada(value)}
              fullWidth
              sx={{ mb: 3 }}
            >
              {formasPagamento.map((forma) => (
                <ToggleButton key={forma.id} value={forma.id}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    {forma.icon}
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      {forma.label}
                    </Typography>
                  </Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              fullWidth
              label="Valor"
              type="number"
              value={valorParcial}
              onChange={(e) => setValorParcial(Number(e.target.value))}
              disabled={!formaSelecionada}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  adicionarPagamento();
                }
              }}
              inputProps={{ min: 0, step: 0.01 }}
              helperText={`Restante: R$ ${restante.toFixed(2)}`}
            />

            {venda.pagamentos.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Pagamentos Adicionados
                </Typography>
                <List dense>
                  {venda.pagamentos.map((pagamento, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => removerPagamento(index)}
                        >
                          <Delete />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          formasPagamento.find((f) => f.id === pagamento.forma)
                            ?.label
                        }
                        secondary={`R$ ${pagamento.valor.toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            <TextField
              fullWidth
              label="Observações"
              multiline
              rows={3}
              value={venda.observacoes}
              onChange={(e) =>
                setVenda({ ...venda, observacoes: e.target.value })
              }
              sx={{ mt: 3 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resumo do Pagamento
            </Typography>

            <Box sx={{ my: 3 }}>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography>Total da Venda:</Typography>
                <Typography variant="h6" color="primary">
                  R$ {totalVenda.toFixed(2)}
                </Typography>
              </Box>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography>Total Pago:</Typography>
                <Typography color={restante > 0 ? "error" : "success.main"}>
                  R$ {totalPago.toFixed(2)}
                </Typography>
              </Box>

              {restante > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography>Restante:</Typography>
                  <Chip
                    label={`R$ ${restante.toFixed(2)}`}
                    color="error"
                    size="small"
                  />
                </Box>
              )}

              {troco > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography>Troco:</Typography>
                  <Chip
                    label={`R$ ${troco.toFixed(2)}`}
                    color="success"
                    size="small"
                  />
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Resumo dos Itens
            </Typography>
            <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              {venda.itens.map((item) => (
                <Box
                  key={item.produtoId}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="body2">
                    {item.quantidade}x {item.nomeProduto}
                  </Typography>
                  <Typography variant="body2">
                    R${" "}
                    {(
                      item.quantidade * item.precoUnitario -
                      item.desconto
                    ).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default EtapaPagamento;
