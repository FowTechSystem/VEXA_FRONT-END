// src/pages/CatalogoDigital.jsx
// Layout fullscreen alinhado ao padrão do PDV/Caixa/Condicional.
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
  InputAdornment,
  IconButton,
  Paper,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  PictureAsPdf,
  Refresh,
  WhatsApp,
  SelectAll,
  Deselect,
  Search,
  Close,
  PhotoLibrary,
  Storefront,
} from "@mui/icons-material";
import { produtosService } from "../api/produtosService";
import { catalogoService } from "../api/catalogoService";
import {
  montarDocumentoCatalogoPdf,
  catalogoPdfParaBlob,
  nomeArquivoCatalogoPdf,
} from "../utils/catalogoPdf";
import { CategoriaService } from "../api/categoriaService";
import { authService } from "../api/authService";
import { useEmpresa } from "../contexts/EmpresaContext";
import { showSuccess, showError } from "../utils/notifications";
import { LoadingBox } from "../components/LoadingBox";

const MIN_PRODUTOS_GERAR = 1;

const TIPOS_PRODUTO = [
  { value: "", label: "Todos os tipos" },
  { value: "roupas", label: "Roupas" },
  { value: "calcados", label: "Calçados" },
  { value: "acessorios", label: "Acessórios" },
];

const fmtBRL = (v) =>
  `R$ ${(Number(v) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const nomeProduto = (p) => p.nome ?? p.Nome ?? "Produto";

function sugerirPreco(produto) {
  const pv = Number(produto.precoVenda ?? produto.PrecoVenda ?? 0);
  const pc = Number(produto.precoCusto ?? produto.PrecoCusto ?? 0);
  if (pv > 0) return pv;
  if (pc > 0) return Math.round(pc * 1.5 * 100) / 100;
  return 0;
}

function getTipoProduto(p) {
  const t = (p.tipoTamanho ?? p.TipoTamanho ?? "roupas").toString().toLowerCase();
  if (t === "calcados" || t === "acessorios") return t;
  return "roupas";
}

function labelTipo(t) {
  if (t === "calcados") return "Calçados";
  if (t === "acessorios") return "Acessórios";
  return "Roupas";
}

function urlFotoProduto(p) {
  const u =
    p?.foto1 ??
    p?.Foto1 ??
    p?.imagemPrincipal ??
    p?.urlImagem ??
    p?.imagemUrl ??
    p?.fotoUrl ??
    p?.urlFoto ??
    "";
  const s = String(u).trim();
  return s.length > 0 ? s : null;
}

function parseListaCategorias(res) {
  const raw = res?.categorias ?? res?.Categorias ?? res?.items ?? res;
  if (Array.isArray(raw)) return raw;
  return [];
}

// ─── Helper: Summary card (sidebar) ─────────────────────────────────────────
function SummaryCard({ label, value, highlight, isDark }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: highlight ? "2px solid" : "1px solid",
        borderColor: highlight ? "primary.main" : "divider",
        bgcolor: "background.paper",
        background: highlight
          ? (theme) => alpha(theme.palette.primary.main, 0.08)
          : undefined,
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        minHeight: 64,
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: "text.secondary",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: highlight ? 22 : 18,
          color: highlight ? "primary.main" : "text.primary",
          lineHeight: 1.1,
          mt: 0.25,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function CatalogoDigital() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { empresaAtiva } = useEmpresa();
  const user = authService.getUsuario();

  const [carregando, setCarregando] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCategoriaId, setFiltroCategoriaId] = useState("");

  const [selecionados, setSelecionados] = useState({});
  const [precosSugeridos, setPrecosSugeridos] = useState({});
  const [gerando, setGerando] = useState(false);
  const [ultimoCatalogo, setUltimoCatalogo] = useState(null);

  const buscarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [prodsRes, catRes] = await Promise.all([
        produtosService.getAll({ pagina: 1, tamanho: 2000 }),
        CategoriaService.getAll().catch(() => null),
      ]);

      const prods = Array.isArray(prodsRes)
        ? prodsRes
        : prodsRes?.produtos ?? prodsRes?.Produtos ?? prodsRes?.items ?? [];
      setProdutos(Array.isArray(prods) ? prods : []);

      setCategorias(parseListaCategorias(catRes));

      const precos = {};
      prods.forEach((p) => {
        const id = p.id ?? p.Id;
        if (id) precos[id] = sugerirPreco(p);
      });
      setPrecosSugeridos(precos);
    } catch (err) {
      console.error(err);
      showError("Erro ao carregar produtos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  const produtosComFoto = useMemo(
    () => produtos.filter((p) => Boolean(urlFotoProduto(p))),
    [produtos],
  );

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      if (!urlFotoProduto(p)) return false;
      if (filtroTipo && getTipoProduto(p) !== filtroTipo) return false;
      if (filtroCategoriaId !== "" && filtroCategoriaId != null) {
        const cid = p.categoriaId ?? p.CategoriaId ?? p.categoria?.id ?? p.Categoria?.id;
        if (Number(cid) !== Number(filtroCategoriaId)) return false;
      }
      if (!termo) return true;
      const nome = nomeProduto(p).toLowerCase();
      const sku = String(p.sku ?? p.Sku ?? "").toLowerCase();
      const desc = String(p.descricao ?? p.Descricao ?? "").toLowerCase();
      return nome.includes(termo) || sku.includes(termo) || desc.includes(termo);
    });
  }, [produtos, busca, filtroTipo, filtroCategoriaId]);

  const idsFiltrados = useMemo(
    () => produtosFiltrados.map((p) => String(p.id ?? p.Id)).filter(Boolean),
    [produtosFiltrados],
  );

  useEffect(() => {
    const allowed = new Set(idsFiltrados);
    setSelecionados((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id] && !allowed.has(id)) {
          next[id] = false;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [idsFiltrados]);

  const todosVisiveisSelecionados =
    idsFiltrados.length > 0 && idsFiltrados.every((id) => selecionados[id]);

  const toggleSelecao = (id) => {
    setSelecionados((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelecionarTodosVisiveis = () => {
    if (todosVisiveisSelecionados) {
      setSelecionados((prev) => {
        const next = { ...prev };
        idsFiltrados.forEach((id) => { next[id] = false; });
        return next;
      });
      return;
    }
    setSelecionados((prev) => {
      const next = { ...prev };
      idsFiltrados.forEach((id) => { next[id] = true; });
      return next;
    });
  };

  const limparSelecao = () => setSelecionados({});

  const setPreco = (id, valor) => {
    const v = parseFloat(valor);
    if (!isNaN(v) && v >= 0) {
      setPrecosSugeridos((prev) => ({ ...prev, [id]: v }));
    }
  };

  const totalSelecionados = Object.entries(selecionados).filter(([, v]) => v).length;
  const podeGerar = totalSelecionados >= MIN_PRODUTOS_GERAR;

  // Soma dos preços dos selecionados (preview)
  const valorTotalSelecionados = useMemo(() => {
    let total = 0;
    Object.keys(selecionados).forEach((idStr) => {
      if (!selecionados[idStr]) return;
      const p = produtos.find((x) => String(x.id ?? x.Id) === idStr);
      if (p) {
        const pid = p.id ?? p.Id;
        total += precosSugeridos[pid] ?? sugerirPreco(p);
      }
    });
    return total;
  }, [selecionados, produtos, precosSugeridos]);

  const whatsappDigits = useMemo(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem("vexa_config") || "{}");
      return String(cfg.telefone || user.telefone || user.Telefone || "").replace(/\D/g, "");
    } catch {
      return String(user.telefone || user.Telefone || "").replace(/\D/g, "");
    }
  }, [user.telefone, user.Telefone]);

  const handleGerarCatalogo = async () => {
    if (!podeGerar) {
      showError(`Selecione pelo menos ${MIN_PRODUTOS_GERAR} produto(s).`);
      return;
    }
    setGerando(true);
    try {
      const empresaNome =
        empresaAtiva?.nome ?? empresaAtiva?.nomeFantasia ?? user.empresaNome ?? "Loja";

      const linhas = [];
      Object.keys(selecionados).forEach((idStr) => {
        if (!selecionados[idStr]) return;
        const p = produtos.find((x) => String(x.id ?? x.Id) === idStr);
        if (p && urlFotoProduto(p)) {
          const pid = p.id ?? p.Id;
          const preco = precosSugeridos[pid] ?? sugerirPreco(p);
          linhas.push({
            produtoId: pid,
            nome: nomeProduto(p),
            preco,
            quantidade: 1,
            sku: String(p.sku ?? p.Sku ?? "").trim() || "—",
            tipo: labelTipo(getTipoProduto(p)),
            imagemUrl: urlFotoProduto(p),
          });
        }
      });

      const produtosStorage = linhas.map(({ produtoId, nome, preco, quantidade }) => ({
        produtoId, nome, preco, quantidade,
      }));

      const catalogoId = catalogoService.criar({
        produtos: produtosStorage,
        criadorNome: user.nome ?? user.Nome ?? user.email,
        criadorWhatsApp: whatsappDigits,
        empresaNome,
      });

      const link = catalogoService.getLinkPublico(catalogoId);
      const itensPdf = linhas.map(({ nome, preco, sku, tipo, imagemUrl }) => ({
        nome, preco, sku, tipo, imagemUrl,
      }));

      setUltimoCatalogo({ itensPdf, empresaNome, link });

      const doc = await montarDocumentoCatalogoPdf({ itens: itensPdf, empresaNome });
      doc.save(nomeArquivoCatalogoPdf(empresaNome));

      showSuccess("Catálogo em PDF gerado e baixado. Use Enviar por WhatsApp para compartilhar.");
    } catch (err) {
      console.error(err);
      showError("Erro ao gerar catálogo em PDF.");
    } finally {
      setGerando(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    if (!ultimoCatalogo?.link || !ultimoCatalogo?.itensPdf?.length) {
      showError("Gere o catálogo em PDF primeiro.");
      return;
    }

    const { itensPdf, empresaNome, link } = ultimoCatalogo;
    const doc = await montarDocumentoCatalogoPdf({ itens: itensPdf, empresaNome });
    const blob = catalogoPdfParaBlob(doc);
    const fileName = nomeArquivoCatalogoPdf(empresaNome);
    const file = new File([blob], fileName, { type: "application/pdf" });

    const textoPlano = `Olá! Segue nosso catálogo em PDF da ${empresaNome}. Você também pode acessar online: ${link}`;

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Catálogo — ${empresaNome}`,
          text: textoPlano,
        });
        showSuccess("Compartilhamento enviado.");
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }

    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      showError("Não foi possível preparar o PDF.");
      return;
    }

    showSuccess("PDF salvo. Abra o WhatsApp e anexe o arquivo baixado.");
    const encoded = encodeURIComponent(textoPlano);
    const waUrl = whatsappDigits
      ? `https://wa.me/${whatsappDigits}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const renderProdutoCard = (p) => {
    const id = String(p.id ?? p.Id);
    const sel = !!selecionados[id];
    const preco = precosSugeridos[id] ?? sugerirPreco(p);
    const tipo = getTipoProduto(p);
    const fotoSrc = urlFotoProduto(p);

    return (
      <Card
        key={id}
        variant="outlined"
        onClick={() => toggleSelecao(id)}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          cursor: "pointer",
          transition: "all 0.15s ease-out",
          border: sel ? `2px solid ${theme.palette.primary.main}` : "1px solid",
          borderColor: sel ? "primary.main" : "divider",
          bgcolor: sel ? alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04) : "background.paper",
          "&:hover": {
            borderColor: theme.palette.primary.main,
            transform: "translateY(-2px)",
            boxShadow: 2,
          },
        }}
      >
        {fotoSrc ? (
          <Box
            data-catalogo-foto-wrap
            sx={{
              position: "relative",
              width: "100%",
              height: 180,
              flexShrink: 0,
              bgcolor: "action.hover",
              overflow: "hidden",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              component="img"
              src={fotoSrc}
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={(e) => {
                e.currentTarget.closest("[data-catalogo-foto-wrap]")?.remove();
              }}
            />
            <Checkbox
              checked={sel}
              onChange={(e) => { e.stopPropagation(); toggleSelecao(id); }}
              onClick={(e) => e.stopPropagation()}
              size="small"
              sx={{
                position: "absolute",
                top: 4,
                left: 4,
                bgcolor: "background.paper",
                borderRadius: 1,
                "&:hover": { bgcolor: "background.paper" },
              }}
            />
            <Chip
              label={labelTipo(tipo)}
              size="small"
              sx={{
                position: "absolute",
                top: 6,
                right: 6,
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: alpha("#000", 0.6),
                color: "#fff",
              }}
            />
          </Box>
        ) : null}
        <CardContent sx={{ p: 1.25, flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13 }} noWrap title={nomeProduto(p)}>
            {nomeProduto(p)}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "text.secondary" }} noWrap>
            {(p.sku ?? p.Sku) ? `SKU ${p.sku ?? p.Sku}` : `#${id}`}
          </Typography>
          <TextField
            size="small"
            type="number"
            label="Preço"
            value={preco}
            onChange={(e) => setPreco(id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: 12, fontWeight: 700 }}>R$</Typography></InputAdornment>,
              sx: { fontSize: 13, fontWeight: 700 },
            }}
            sx={{ mt: 0.5 }}
            fullWidth
          />
        </CardContent>
      </Card>
    );
  };

  if (carregando) return <LoadingBox />;

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: "calc(100dvh - 64px)",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        color: "text.primary",
        overflow: "hidden",
      }}
    >
      {/* ═══ Header ═══ */}
      <Box
        sx={{
          px: { xs: 1.5, md: 2.5 },
          py: 1.25,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Storefront sx={{ fontSize: 26, color: "primary.main" }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Catálogo digital
            </Typography>
            <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
              Selecione produtos, gere PDF profissional e envie no WhatsApp
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip
            label={`${totalSelecionados} selecionado${totalSelecionados === 1 ? "" : "s"}`}
            color={podeGerar ? "primary" : "default"}
            sx={{ fontWeight: 800, height: 28 }}
          />
          <Tooltip title="Atualizar produtos">
            <span>
              <Button
                startIcon={<Refresh />}
                onClick={buscarDados}
                variant="outlined"
                size="small"
                sx={{ textTransform: "none", fontWeight: 700, height: 36 }}
              >
                Atualizar
              </Button>
            </span>
          </Tooltip>
          <Button
            startIcon={<PictureAsPdf />}
            onClick={handleGerarCatalogo}
            disabled={!podeGerar || gerando}
            variant="contained"
            size="small"
            sx={{ textTransform: "none", fontWeight: 700, height: 36 }}
          >
            {gerando ? "Gerando…" : "Gerar PDF"}
          </Button>
          <Button
            startIcon={<WhatsApp />}
            onClick={() => void handleEnviarWhatsApp()}
            color="success"
            variant="contained"
            size="small"
            disabled={!ultimoCatalogo?.link}
            sx={{ textTransform: "none", fontWeight: 700, height: 36 }}
          >
            WhatsApp
          </Button>
        </Stack>
      </Box>

      {/* ═══ Conteúdo ═══ */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Grid container spacing={1.5} sx={{ flex: 1, minHeight: 0, p: { xs: 1, md: 1.5 }, m: 0 }}>
          {/* ── Coluna principal (9/12) ── */}
          <Grid size={{ xs: 12, lg: 9 }} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            {/* Filtros */}
            <Grid container spacing={1.25} sx={{ mb: 1.25 }}>
              <Grid size={{ xs: 12, sm: 5, md: 5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Buscar produto"
                  placeholder="Nome, SKU ou descrição…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: busca ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setBusca("")}>
                          <Close fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    label="Tipo"
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                  >
                    {TIPOS_PRODUTO.map((o) => (
                      <MenuItem key={o.value || "all"} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 4, md: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    label="Categoria"
                    value={filtroCategoriaId}
                    onChange={(e) => setFiltroCategoriaId(e.target.value)}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {categorias.map((c) => (
                      <MenuItem key={c.id ?? c.Id} value={c.id ?? c.Id}>
                        {c.nome ?? c.Nome ?? `Categoria #${c.id ?? c.Id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Container scrollable de produtos */}
            <Paper
              variant="outlined"
              sx={{
                flex: 1,
                minHeight: 280,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                bgcolor: "background.paper",
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  bgcolor: isDark ? alpha(theme.palette.primary.main, 0.08) : "#e3f2fd",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: 13,
                    color: isDark ? "primary.light" : "#1565c0",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Produtos disponíveis
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>
                    {produtosFiltrados.length} com foto
                  </Typography>
                  <Button
                    size="small"
                    startIcon={todosVisiveisSelecionados ? <Deselect /> : <SelectAll />}
                    onClick={handleSelecionarTodosVisiveis}
                    disabled={produtosFiltrados.length === 0}
                    sx={{ textTransform: "none", fontWeight: 700, fontSize: 12 }}
                  >
                    {todosVisiveisSelecionados ? "Desmarcar lista" : "Selecionar lista"}
                  </Button>
                </Stack>
              </Box>

              <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
                {produtos.length === 0 ? (
                  <Alert severity="warning">
                    Nenhum produto encontrado. Cadastre produtos em Produtos.
                  </Alert>
                ) : produtosComFoto.length === 0 ? (
                  <Alert severity="warning">
                    Nenhum produto possui foto cadastrada. Adicione imagens em Produtos para disponibilizá-los aqui.
                  </Alert>
                ) : produtosFiltrados.length === 0 ? (
                  <Alert severity="info">
                    Nenhum produto corresponde aos filtros. Ajuste a busca ou os filtros.
                  </Alert>
                ) : (
                  <Grid container spacing={1.25}>
                    {produtosFiltrados.map((p) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 3 }} key={p.id ?? p.Id}>
                        {renderProdutoCard(p)}
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* ── Sidebar direita (3/12) ── */}
          <Grid size={{ xs: 12, lg: 3 }} sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0 }}>
              <SummaryCard
                label="Produtos visíveis"
                value={String(produtosFiltrados.length)}
                isDark={isDark}
              />
              <SummaryCard
                label="Selecionados"
                value={String(totalSelecionados)}
                isDark={isDark}
              />
              <SummaryCard
                label="Valor total"
                value={fmtBRL(valorTotalSelecionados)}
                highlight
                isDark={isDark}
              />

              {totalSelecionados > 0 && (
                <Button
                  startIcon={<Deselect />}
                  onClick={limparSelecao}
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: "none", fontWeight: 700 }}
                >
                  Limpar seleção
                </Button>
              )}

              <Box sx={{ flex: 1 }} />

              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "background.paper" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <PhotoLibrary sx={{ fontSize: 18, color: "primary.main" }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Como funciona
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.6 }}>
                  1. Selecione produtos clicando nos cards<br />
                  2. Ajuste os preços se quiser<br />
                  3. Clique em <strong>Gerar PDF</strong><br />
                  4. Envie pelo <strong>WhatsApp</strong> para seus clientes
                </Typography>
              </Paper>

              {ultimoCatalogo?.link && (
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: alpha(theme.palette.success.main, 0.06), borderColor: "success.main" }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: "success.main", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                    Último PDF gerado
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.5 }}>
                    O WhatsApp usa o mesmo catálogo. Para alterar, gere um novo.
                  </Typography>
                </Paper>
              )}

              {!whatsappDigits && (
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.06), borderColor: "warning.main" }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: "warning.main", textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.5 }}>
                    Sem telefone
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.5 }}>
                    Cadastre seu telefone no perfil para o WhatsApp abrir direto no seu número.
                  </Typography>
                </Paper>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default CatalogoDigital;
