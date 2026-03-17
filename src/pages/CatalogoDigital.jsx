// src/pages/CatalogoDigital.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Checkbox,
  TextField,
  Chip,
  Alert,
  Paper,
  useTheme,
  CircularProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  AddShoppingCart,
  OpenInNew,
  Refresh,
  TrendingUp,
  TrendingFlat,
  TrendingDown,
  Lock,
} from "@mui/icons-material";
import { produtosService } from "../api/produtosService";
import { vendasService } from "../api/vendasService";
import { catalogoService } from "../api/catalogoService";
import { authService } from "../api/authService";
import { useEmpresa } from "../contexts/EmpresaContext";
import { showSuccess, showError } from "../utils/notifications";
import { LoadingBox } from "../components/LoadingBox";

const MIN_PRODUTOS = 20;

// Classifica produtos por vendas: mais vendidos, mediana, baixa
function classificarProdutos(produtos, vendasPorProduto) {
  const comVendas = produtos.map((p) => {
    const id = p.id ?? p.Id;
    const qtd = vendasPorProduto[id] ?? 0;
    return { ...p, _qtdVendida: qtd };
  });
  comVendas.sort((a, b) => b._qtdVendida - a._qtdVendida);
  const total = comVendas.length;
  const terco = Math.ceil(total / 3);
  return {
    maisVendidos: comVendas.slice(0, terco),
    vendaMediana: comVendas.slice(terco, terco * 2),
    baixaVenda: comVendas.slice(terco * 2),
  };
}

function sugerirPreco(produto) {
  const pv = Number(produto.precoVenda ?? produto.PrecoVenda ?? 0);
  const pc = Number(produto.precoCusto ?? produto.PrecoCusto ?? 0);
  if (pv > 0) return pv;
  if (pc > 0) return Math.round((pc * 1.5) * 100) / 100;
  return 0;
}

const nomeProduto = (p) => p.nome ?? p.Nome ?? "Produto";

function CatalogoDigital() {
  const theme = useTheme();
  const { empresaAtiva } = useEmpresa();
  const user = authService.getUsuario();
  const [carregando, setCarregando] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [classificados, setClassificados] = useState({
    maisVendidos: [],
    vendaMediana: [],
    baixaVenda: [],
  });
  const [selecionados, setSelecionados] = useState({});
  const [precosSugeridos, setPrecosSugeridos] = useState({});
  const [gerando, setGerando] = useState(false);

  const buscarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [prodsRes, vendasRes] = await Promise.all([
        produtosService.getAll({ tamanho: 500 }),
        vendasService.getAll({ pagina: 1, tamanho: 500 }),
      ]);
      const prods = Array.isArray(prodsRes) ? prodsRes : prodsRes?.produtos ?? prodsRes?.items ?? [];
      setProdutos(prods);

      const vendasList = Array.isArray(vendasRes) ? vendasRes : vendasRes?.vendas ?? vendasRes?.Vendas ?? vendasRes?.items ?? [];
      const vendasPorProduto = {};
      vendasList.forEach((v) => {
        if ((v.status ?? v.Status ?? "").toString().toLowerCase() === "cancelada") return;
        const itens = v.itens ?? v.Itens ?? v.items ?? [];
        itens.forEach((i) => {
          const pid = i.produtoId ?? i.produto?.id ?? i.ProdutoId;
          if (pid) {
            vendasPorProduto[pid] = (vendasPorProduto[pid] ?? 0) + (Number(i.quantidade ?? i.Quantidade) || 0);
          }
        });
      });

      const cls = classificarProdutos(prods, vendasPorProduto);
      setClassificados(cls);

      const precos = {};
      prods.forEach((p) => {
        const id = p.id ?? p.Id;
        if (id) precos[id] = sugerirPreco(p);
      });
      setPrecosSugeridos(precos);
    } catch (err) {
      console.error(err);
      showError("Erro ao carregar produtos e vendas.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  const toggleSelecao = (id) => {
    setSelecionados((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const setPreco = (id, valor) => {
    const v = parseFloat(valor);
    if (!isNaN(v) && v >= 0) {
      setPrecosSugeridos((prev) => ({ ...prev, [id]: v }));
    }
  };

  const totalSelecionados = Object.values(selecionados).filter(Boolean).length;
  const podeGerar = totalSelecionados >= MIN_PRODUTOS;

  const handleGerarCatalogo = () => {
    if (!podeGerar) {
      showError(`Selecione pelo menos ${MIN_PRODUTOS} produtos.`);
      return;
    }
    setGerando(true);
    try {
      const itens = [];
      Object.keys(selecionados).forEach((id) => {
        if (!selecionados[id]) return;
        const p = produtos.find((x) => String(x.id ?? x.Id) === String(id));
        if (p) {
          itens.push({
            produtoId: p.id ?? p.Id,
            nome: nomeProduto(p),
            preco: precosSugeridos[p.id ?? p.Id] ?? sugerirPreco(p),
            quantidade: 1,
          });
        }
      });

      const config = JSON.parse(localStorage.getItem("vexa_config") || "{}");
      const telefone = config.telefone || user.telefone || "";
      const whatsapp = String(telefone).replace(/\D/g, "");

      const catalogoId = catalogoService.criar({
        produtos: itens,
        criadorNome: user.nome ?? user.Nome ?? user.email,
        criadorWhatsApp: whatsapp,
        empresaNome: empresaAtiva?.nome ?? empresaAtiva?.nomeFantasia ?? user.empresaNome ?? "Loja",
      });

      const link = catalogoService.getLinkPublico(catalogoId);
      window.open(link, "_blank", "noopener,noreferrer");
      showSuccess("Catálogo criado! Nova aba aberta.");

      setSelecionados({});
    } catch (err) {
      showError("Erro ao gerar catálogo.");
    } finally {
      setGerando(false);
    }
  };

  const renderProdutoCard = (p, icone) => {
    const id = String(p.id ?? p.Id);
    const sel = !!selecionados[id];
    const preco = precosSugeridos[id] ?? sugerirPreco(p);
    return (
      <Card
        key={id}
        variant="outlined"
        sx={{
          height: "100%",
          border: sel ? `2px solid ${theme.palette.primary.main}` : "1px solid",
          borderColor: "divider",
          "&:hover": { borderColor: theme.palette.primary.light },
        }}
      >
        <CardContent sx={{ p: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <Checkbox
              checked={sel}
              onChange={() => toggleSelecao(id)}
              size="small"
              sx={{ mt: -0.5 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap title={nomeProduto(p)}>
                {nomeProduto(p)}
              </Typography>
              <TextField
                size="small"
                type="number"
                label="Preço sugerido"
                value={preco}
                onChange={(e) => setPreco(id, e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ mt: 1, "& .MuiInputBase-input": { fontSize: 13 } }}
                fullWidth
              />
            </Box>
            <Box sx={{ color: "text.secondary" }}>{icone}</Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (carregando) return <LoadingBox />;

  return (
    <Box sx={{ position: "relative", p: { xs: 2, md: 3 }, bgcolor: "background.default", minHeight: "100vh" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Catálogo Digital
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Selecione pelo menos {MIN_PRODUTOS} produtos para montar seu catálogo. O cliente acessa pelo link e finaliza via WhatsApp.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={buscarDados} variant="outlined" size="medium">
            Atualizar
          </Button>
          <Button
            startIcon={<OpenInNew />}
            onClick={handleGerarCatalogo}
            disabled={!podeGerar || gerando}
            variant="contained"
            size="medium"
          >
            {gerando ? "Gerando..." : `Gerar catálogo (${totalSelecionados}/${MIN_PRODUTOS})`}
          </Button>
        </Box>
      </Box>

      {!podeGerar && totalSelecionados > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Selecione pelo menos {MIN_PRODUTOS} produtos. Faltam {MIN_PRODUTOS - totalSelecionados}.
        </Alert>
      )}

      {produtos.length === 0 && (
        <Alert severity="warning">Nenhum produto encontrado. Cadastre produtos primeiro.</Alert>
      )}

      {produtos.length > 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUp color="success" /> Produtos mais vendidos
            </Typography>
            <Grid container spacing={1.5}>
              {classificados.maisVendidos.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id ?? p.Id}>
                  {renderProdutoCard(p, <TrendingUp fontSize="small" color="success" />)}
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingFlat color="action" /> Produtos de venda mediana
            </Typography>
            <Grid container spacing={1.5}>
              {classificados.vendaMediana.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id ?? p.Id}>
                  {renderProdutoCard(p, <TrendingFlat fontSize="small" color="action" />)}
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingDown color="disabled" /> Produtos com baixa venda
            </Typography>
            <Grid container spacing={1.5}>
              {classificados.baixaVenda.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id ?? p.Id}>
                  {renderProdutoCard(p, <TrendingDown fontSize="small" color="disabled" />)}
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Chip
          icon={<AddShoppingCart />}
          label={`${totalSelecionados} produtos selecionados`}
          color={podeGerar ? "success" : "default"}
          variant="outlined"
        />
      </Box>

      {/* Overlay bloqueado - funcionalidade em desenvolvimento */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          backgroundColor: "rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 4,
            maxWidth: 400,
            textAlign: "center",
            borderRadius: 2,
          }}
        >
          <Lock sx={{ fontSize: 56, color: "action.disabled", mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Funcionalidade em desenvolvimento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Em breve você poderá criar e compartilhar catálogos digitais.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

export default CatalogoDigital;
