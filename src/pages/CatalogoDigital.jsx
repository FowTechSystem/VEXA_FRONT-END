// src/pages/CatalogoDigital.jsx
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
} from "@mui/material";
import {
  PictureAsPdf,
  Refresh,
  WhatsApp,
  SelectAll,
  Deselect,
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

function parseListaCategorias(res) {
  const raw = res?.categorias ?? res?.Categorias ?? res?.items ?? res;
  if (Array.isArray(raw)) return raw;
  return [];
}

function CatalogoDigital() {
  const theme = useTheme();
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
  /** Dados do último catálogo gerado (PDF + link) — necessário para WhatsApp com anexo. */
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

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
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

  const todosVisiveisSelecionados =
    idsFiltrados.length > 0 &&
    idsFiltrados.every((id) => selecionados[id]);

  const toggleSelecao = (id) => {
    setSelecionados((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelecionarTodosVisiveis = () => {
    if (todosVisiveisSelecionados) {
      setSelecionados((prev) => {
        const next = { ...prev };
        idsFiltrados.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      return;
    }
    setSelecionados((prev) => {
      const next = { ...prev };
      idsFiltrados.forEach((id) => {
        next[id] = true;
      });
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

  const whatsappDigits = useMemo(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem("vexa_config") || "{}");
      return String(cfg.telefone || user.telefone || user.Telefone || "").replace(/\D/g, "");
    } catch {
      return String(user.telefone || user.Telefone || "").replace(/\D/g, "");
    }
  }, [user.telefone, user.Telefone]);

  const handleGerarCatalogo = () => {
    if (!podeGerar) {
      showError(`Selecione pelo menos ${MIN_PRODUTOS_GERAR} produto(s).`);
      return;
    }
    setGerando(true);
    try {
      const empresaNome =
        empresaAtiva?.nome ??
        empresaAtiva?.nomeFantasia ??
        user.empresaNome ??
        "Loja";

      const linhas = [];
      Object.keys(selecionados).forEach((idStr) => {
        if (!selecionados[idStr]) return;
        const p = produtos.find((x) => String(x.id ?? x.Id) === idStr);
        if (p) {
          const pid = p.id ?? p.Id;
          const preco = precosSugeridos[pid] ?? sugerirPreco(p);
          linhas.push({
            produtoId: pid,
            nome: nomeProduto(p),
            preco,
            quantidade: 1,
            sku: String(p.sku ?? p.Sku ?? "").trim() || "—",
            tipo: labelTipo(getTipoProduto(p)),
          });
        }
      });

      const produtosStorage = linhas.map(({ produtoId, nome, preco, quantidade }) => ({
        produtoId,
        nome,
        preco,
        quantidade,
      }));

      const catalogoId = catalogoService.criar({
        produtos: produtosStorage,
        criadorNome: user.nome ?? user.Nome ?? user.email,
        criadorWhatsApp: whatsappDigits,
        empresaNome,
      });

      const link = catalogoService.getLinkPublico(catalogoId);
      const itensPdf = linhas.map(({ nome, preco, sku, tipo }) => ({
        nome,
        preco,
        sku,
        tipo,
      }));

      setUltimoCatalogo({
        itensPdf,
        empresaNome,
        link,
      });

      const doc = montarDocumentoCatalogoPdf({
        itens: itensPdf,
        empresaNome,
        linkPublico: link,
      });
      doc.save(nomeArquivoCatalogoPdf(empresaNome));

      showSuccess("Catálogo em PDF gerado e baixado. Use Enviar por WhatsApp para compartilhar o PDF.");
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
    const doc = montarDocumentoCatalogoPdf({
      itens: itensPdf,
      empresaNome,
      linkPublico: link,
    });
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

    showSuccess("PDF salvo novamente. Abra o WhatsApp e anexe o arquivo baixado.");
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
              <Typography variant="caption" color="text.secondary" display="block" noWrap>
                {labelTipo(tipo)}
                {(p.sku ?? p.Sku) && ` · SKU ${p.sku ?? p.Sku}`}
              </Typography>
              <TextField
                size="small"
                type="number"
                label="Preço no catálogo"
                value={preco}
                onChange={(e) => setPreco(id, e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ mt: 1, "& .MuiInputBase-input": { fontSize: 13 } }}
                fullWidth
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (carregando) return <LoadingBox />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Catálogo digital
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
            Selecione os produtos, gere o <strong>catálogo em PDF</strong> (download automático) e use Enviar por WhatsApp
            para compartilhar o PDF (quando o navegador permitir) ou baixar de novo e anexar na conversa. O link da vitrine
            online também entra no PDF e na mensagem.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button startIcon={<Refresh />} onClick={buscarDados} variant="outlined" size="medium">
            Atualizar
          </Button>
          <Tooltip title="Marca ou desmarca todos os produtos da lista filtrada atual">
            <Button
              startIcon={<SelectAll />}
              onClick={handleSelecionarTodosVisiveis}
              variant="outlined"
              size="medium"
              disabled={produtosFiltrados.length === 0}
            >
              {todosVisiveisSelecionados ? "Desmarcar lista" : "Selecionar lista"}
            </Button>
          </Tooltip>
          <Button
            startIcon={<Deselect />}
            onClick={limparSelecao}
            variant="outlined"
            size="medium"
            disabled={totalSelecionados === 0}
          >
            Limpar seleção
          </Button>
          <Button
            startIcon={<PictureAsPdf />}
            onClick={handleGerarCatalogo}
            disabled={!podeGerar || gerando}
            variant="contained"
            size="medium"
          >
            {gerando ? "Gerando PDF..." : "Gerar catálogo (PDF)"}
          </Button>
          <Button
            startIcon={<WhatsApp />}
            onClick={() => void handleEnviarWhatsApp()}
            color="success"
            variant="contained"
            size="medium"
            disabled={!ultimoCatalogo?.link}
          >
            Enviar por WhatsApp
          </Button>
        </Stack>
      </Box>

      {!whatsappDigits && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Para abrir o WhatsApp já no seu número, cadastre o telefone em Configurações (ou dados do usuário).
          Ainda assim você pode usar &quot;Enviar por WhatsApp&quot; para escolher o contato manualmente.
        </Alert>
      )}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2 }}
        flexWrap="wrap"
        useFlexGap
      >
        <TextField
          label="Buscar produto"
          placeholder="Nome, SKU ou descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          size="small"
          sx={{ flex: { sm: "1 1 240px" }, minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Tipo de produto</InputLabel>
          <Select
            label="Tipo de produto"
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
        <FormControl size="small" sx={{ minWidth: 200 }}>
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
      </Stack>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <Chip
          label={`${produtosFiltrados.length} produto(s) na lista filtrada`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`${totalSelecionados} selecionado(s)`}
          color={podeGerar ? "success" : "default"}
          size="small"
          variant={podeGerar ? "filled" : "outlined"}
        />
        {ultimoCatalogo?.link && (
          <Chip
            label="Último PDF gerado — WhatsApp usa o mesmo catálogo"
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {produtos.length === 0 && (
        <Alert severity="warning">Nenhum produto encontrado. Cadastre produtos em Produtos.</Alert>
      )}

      {produtos.length > 0 && produtosFiltrados.length === 0 && (
        <Alert severity="info">Nenhum produto corresponde aos filtros. Ajuste a busca ou os filtros.</Alert>
      )}

      {produtosFiltrados.length > 0 && (
        <Grid container spacing={1.5}>
          {produtosFiltrados.map((p) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={p.id ?? p.Id}>
              {renderProdutoCard(p)}
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default CatalogoDigital;
