// src/pages/CatalogoPublico.jsx
// Página PÚBLICA - acessível por qualquer um com o link (sem autenticação)
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Badge,
  AppBar,
  Toolbar,
  useTheme,
  TextField,
  Snackbar,
  Alert,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AddShoppingCart, Remove, ShoppingCart, WhatsApp } from "@mui/icons-material";
import { catalogoService } from "../api/catalogoService";

function CatalogoPublico() {
  const { id } = useParams();
  const theme = useTheme();
  const [catalogo, setCatalogo] = useState(null);
  const [carrinho, setCarrinho] = useState({});
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const cat = catalogoService.getById(id);
    setCatalogo(cat);
  }, [id]);

  const getKey = (item) => String(item.produtoId ?? item.nome);

  const adicionar = (item, qtd = 1) => {
    const key = getKey(item);
    setCarrinho((prev) => ({
      ...prev,
      [key]: Math.min((prev[key] ?? 0) + qtd, 99),
    }));
    setSnack({ open: true, message: `${item.nome} adicionado ao carrinho`, severity: "success" });
  };

  const remover = (item) => {
    const key = getKey(item);
    setCarrinho((prev) => {
      const next = { ...prev };
      const atual = next[key] ?? 0;
      if (atual <= 1) delete next[key];
      else next[key] = atual - 1;
      return next;
    });
  };

  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);

  const montarMensagemWhatsApp = () => {
    if (!catalogo?.produtos) return "";
    const linhas = [];
    linhas.push(`Olá! Gostaria de fazer um pedido do catálogo *${catalogo.empresaNome ?? "Loja"}*:\n`);
    let total = 0;
    Object.entries(carrinho).forEach(([key, qtd]) => {
      if (qtd < 1) return;
      const item = catalogo.produtos.find((p) => getKey(p) === key);
      if (item) {
        const preco = Number(item.preco) || 0;
        const sub = preco * qtd;
        total += sub;
        linhas.push(`• ${item.nome}: ${qtd} un. x R$ ${preco.toFixed(2).replace(".", ",")} = R$ ${sub.toFixed(2).replace(".", ",")}`);
      }
    });
    linhas.push(`\n*Total: R$ ${total.toFixed(2).replace(".", ",")}*`);
    return encodeURIComponent(linhas.join("\n"));
  };

  const handleFinalizar = () => {
    if (totalItens < 1) {
      setSnack({ open: true, message: "Adicione itens ao carrinho primeiro", severity: "warning" });
      return;
    }
    const num = catalogo?.criadorWhatsApp ?? "";
    if (!num) {
      setSnack({ open: true, message: "WhatsApp do vendedor não configurado", severity: "error" });
      return;
    }
    const msg = montarMensagemWhatsApp();
    const url = `https://wa.me/55${num}${msg ? `?text=${msg}` : ""}`;
    window.open(url, "_blank");
    setSnack({ open: true, message: "Abrindo WhatsApp...", severity: "info" });
  };

  if (!catalogo) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default", p: 3 }}>
        <Typography color="text.secondary">Catálogo não encontrado ou link inválido.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.mode === "dark" ? "#2B2D42" : "#F0F1F5", pb: 10 }}>
      <AppBar
        position="sticky"
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
            color: "inherit",
          }}
        >
          <Typography variant="h6" fontWeight={700} color="inherit">
            {catalogo.empresaNome ?? "Catálogo"}
          </Typography>
          <Badge badgeContent={totalItens} color="secondary">
            <Button
              variant="outlined"
              sx={{
                color: "inherit",
                borderColor: alpha(theme.palette.primary.contrastText, 0.55),
                "&:hover": {
                  borderColor: theme.palette.primary.contrastText,
                  bgcolor: alpha(theme.palette.primary.contrastText, 0.12),
                },
              }}
              startIcon={<ShoppingCart />}
            >
              Carrinho ({totalItens})
            </Button>
          </Badge>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Catálogo Digital
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Selecione os produtos e clique em Finalizar para enviar o pedido via WhatsApp.
        </Typography>

        <Grid container spacing={2}>
          {catalogo.produtos?.map((item) => {
            const key = item.produtoId ?? item.nome;
            const qtdNoCarrinho = carrinho[key] ?? 0;
            const preco = Number(item.preco) || 0;
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {item.nome}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      R$ {preco.toFixed(2).replace(".", ",")}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {qtdNoCarrinho > 0 && (
                        <>
                          <IconButton size="small" onClick={() => remover(item)} color="primary">
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 24, textAlign: "center" }}>{qtdNoCarrinho}</Typography>
                        </>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddShoppingCart />}
                        onClick={() => adicionar(item)}
                      >
                        {qtdNoCarrinho > 0 ? "Adicionar" : "Adicionar"}
                      </Button>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ position: "fixed", bottom: 0, left: 0, right: 0, p: 2, bgcolor: "background.paper", boxShadow: 3, display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
          <Typography variant="body1" fontWeight={600} sx={{ alignSelf: "center" }}>
            {totalItens} item(ns) no carrinho
          </Typography>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<WhatsApp />}
            onClick={handleFinalizar}
            disabled={totalItens < 1}
          >
            Finalizar e enviar WhatsApp
          </Button>
        </Box>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CatalogoPublico;
