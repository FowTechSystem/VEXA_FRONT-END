// src/pages/BazarConsignante.jsx
// Tela 2 — Hub Bazar (consignante selecionado).
// Estrutura:
//   - Card do consignante com mini-stats e ações (Ver peças, Gerar repasse, Editar)
//   - Botão primário "Nova sacola"
//   - GRID de cards de sacolas — cada uma com peças, valores e botão "Devolver tudo"
//     (só ativo se nenhuma peça da sacola foi vendida)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Stack,
  Breadcrumbs,
  Link as MUILink,
  Paper,
  Chip,
  Divider,
  Tooltip,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowBack,
  Add,
  Payments,
  AssignmentReturn,
  Edit,
  Inventory2,
  Checkroom,
  PhoneRounded,
  Storefront,
  LocalMall,
  Visibility,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { LoadingBox } from "../components/LoadingBox";
import ConfirmDialog from "../components/ConfirmDialog";
import { bazarConsignantesService } from "../api/bazarConsignantesService";
import { bazarSacolasService } from "../api/bazarSacolasService";
import {
  getAvatarColor,
  getInitials,
  formatBRL,
  formatData,
} from "../components/Bazar/bazarHelpers";
import AdicionarPecasSacola from "../components/Bazar/AdicionarPecasSacola";
import NovoConsignanteModal from "../components/Bazar/NovoConsignanteModal";
import { showSuccess, showError, showWarning } from "../utils/notifications";

const RESUMO_INICIAL = { pendente: 0, emEstoque: 0, vendidas: 0, devolvidas: 0 };

function BazarConsignante() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { id } = useParams();

  const [consignante, setConsignante] = useState(null);
  const [resumo, setResumo] = useState(RESUMO_INICIAL);
  const [sacolas, setSacolas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState(false);

  const [painelOpen, setPainelOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  // { sacola, loading } — confirmação do "Devolver tudo"
  const [devolucao, setDevolucao] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroCarregar(false);
    try {
      const [cons, sacs] = await Promise.all([
        bazarConsignantesService.getById(id),
        bazarSacolasService.listarPorConsignante(id, { incluirResumo: true }),
      ]);
      setConsignante(cons);
      setResumo({ ...RESUMO_INICIAL, ...(cons?.resumo || {}) });
      const lista = Array.isArray(sacs) ? sacs : sacs?.sacolas || sacs?.items || [];
      setSacolas(lista);
    } catch (error) {
      console.error("[BazarConsignante] falha ao carregar:", error);
      setErroCarregar(true);
      if (error.response?.status !== 404) {
        showError("Não foi possível carregar os dados do consignante.");
      }
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totaisSacolas = useMemo(() => {
    const totalPecas = sacolas.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    return { totalPecas };
  }, [sacolas]);

  // ───── Estados de carregamento / erro ─────
  if (carregando) {
    return (
      <Box sx={{ p: 3 }}>
        <LoadingBox size={48} py={10} />
      </Box>
    );
  }

  if (erroCarregar || !consignante) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/bazar")}
            sx={{ textTransform: "none", alignSelf: "flex-start" }}
          >
            Voltar
          </Button>
          <Card variant="outlined" sx={{ borderRadius: 2, p: 4, textAlign: "center" }}>
            <Storefront sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Consignante não encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pode ter sido removido ou o link está incorreto.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/bazar")}
              sx={{ mt: 2, textTransform: "none", fontWeight: 700 }}
            >
              Ir para o Bazar
            </Button>
          </Card>
        </Stack>
      </Box>
    );
  }

  // ───── Handlers ─────
  const handleSacolaSalva = async () => {
    setPainelOpen(false);
    await carregar();
  };

  const handleGerarRepasse = () => {
    if (resumo.pendente <= 0) {
      showWarning("Não há valores pendentes para gerar repasse.");
      return;
    }
    navigate(`/bazar/repasses?consignanteId=${consignante.id}`);
  };

  const handleDevolverSacola = (sacola) => {
    if (!sacola.podeDevolverTudo && Number(sacola.vendidas) > 0) {
      showWarning(
        "Esta sacola tem peças vendidas. Devolva apenas as peças disponíveis individualmente.",
      );
      return;
    }
    setDevolucao({ sacola, loading: false });
  };

  const executarDevolucaoSacola = async () => {
    if (!devolucao?.sacola) return;
    setDevolucao((prev) => ({ ...prev, loading: true }));
    try {
      await bazarSacolasService.devolverTudo(devolucao.sacola.id);
      showSuccess(
        `Peças da sacola #${devolucao.sacola.id} marcadas como devolvidas.`,
      );
      setDevolucao(null);
      await carregar();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Não foi possível devolver as peças desta sacola.";
      showError(msg);
      console.error("[BazarConsignante] devolverTudo:", error);
      setDevolucao((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  const handleConsignanteEditado = async () => {
    setModalEditOpen(false);
    showSuccess("Dados do consignante atualizados.");
    await carregar();
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        bgcolor: "background.default",
        minHeight: "100%",
        color: "text.primary",
      }}
    >
      <Stack spacing={3}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/bazar")}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Voltar
          </Button>
          <Breadcrumbs separator="›">
            <MUILink
              component="button"
              underline="hover"
              onClick={() => navigate("/bazar")}
              sx={{ color: "text.secondary", fontSize: 14 }}
            >
              Bazar
            </MUILink>
            <Typography sx={{ color: "text.primary", fontWeight: 600, fontSize: 14 }}>
              {consignante.nome}
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* Card do consignante */}
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: { xs: "flex-start", md: "center" },
                gap: 2,
                flexDirection: { xs: "column", md: "row" },
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: getAvatarColor(consignante.nome),
                  fontWeight: 700,
                  fontSize: 22,
                }}
              >
                {getInitials(consignante.nome)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {consignante.nome}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25, flexWrap: "wrap" }}>
                  <PhoneRounded sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">
                    {consignante.telefone || "Sem telefone cadastrado"}
                  </Typography>
                  {consignante.cpf && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>
                      CPF: {consignante.cpf}
                    </Typography>
                  )}
                </Box>
                {consignante.observacao && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.75, fontStyle: "italic" }}
                  >
                    {consignante.observacao}
                  </Typography>
                )}
              </Box>
              <Stack direction={{ xs: "row", md: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                <Button
                  variant="outlined"
                  startIcon={<Checkroom />}
                  onClick={() => navigate(`/bazar/consignante/${consignante.id}/pecas`)}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Ver todas as peças
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Payments />}
                  onClick={handleGerarRepasse}
                  disabled={resumo.pendente <= 0}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Gerar repasse
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setModalEditOpen(true)}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Editar
                </Button>
              </Stack>
            </Box>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 6, md: 3 }}>
                <MiniStat cor="#8B5CF6" icone={<Payments />} titulo="Pendente" valor={formatBRL(resumo.pendente)} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <MiniStat cor="#14B8A6" icone={<Checkroom />} titulo="Em estoque" valor={`${resumo.emEstoque} peças`} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <MiniStat cor="#F59E0B" icone={<Inventory2 />} titulo="Vendidas" valor={`${resumo.vendidas} peças`} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <MiniStat cor="#64748B" icone={<LocalMall />} titulo="Sacolas" valor={String(sacolas.length)} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Botão grande — ação primária */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            background: isDark
              ? "linear-gradient(135deg, rgba(248,243,43,0.12) 0%, transparent 70%)"
              : "linear-gradient(135deg, rgba(248,243,43,0.25) 0%, transparent 70%)",
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.45),
          }}
        >
          <CardContent
            sx={{
              p: { xs: 2.5, md: 3 },
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Acabou de receber uma nova sacola?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cadastre todas as peças de uma vez na tabela editável
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => setPainelOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontSize: "1.05rem",
                minWidth: { md: 280 },
              }}
            >
              Nova sacola
            </Button>
          </CardContent>
        </Card>

        {/* Grid de sacolas */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Sacolas do consignante
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {sacolas.length} {sacolas.length === 1 ? "sacola" : "sacolas"} ·
              {" "}
              {totaisSacolas.totalPecas} peça(s) no total
            </Typography>
          </Box>

          {sacolas.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: 2 }}>
              <LocalMall sx={{ fontSize: 48, color: "text.secondary", opacity: 0.5, mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Ainda não há sacolas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use o botão "Nova sacola" para cadastrar as peças trazidas.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {sacolas.map((s) => (
                <Grid key={s.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <SacolaCard
                    sacola={s}
                    onDevolver={() => handleDevolverSacola(s)}
                    onAbrir={() =>
                      navigate(
                        `/bazar/consignante/${consignante.id}/pecas?sacolaId=${s.id}`,
                      )
                    }
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Stack>

      <AdicionarPecasSacola
        open={painelOpen}
        onClose={() => setPainelOpen(false)}
        consignante={consignante}
        onSaved={handleSacolaSalva}
      />

      <NovoConsignanteModal
        open={modalEditOpen}
        onClose={() => setModalEditOpen(false)}
        existing={consignante}
        onSaved={handleConsignanteEditado}
      />

      <ConfirmDialog
        open={!!devolucao}
        onClose={() =>
          setDevolucao((prev) => (prev?.loading ? prev : null))
        }
        onConfirm={executarDevolucaoSacola}
        variant="warning"
        destructive
        loading={!!devolucao?.loading}
        title="Devolver todas as peças"
        message={
          devolucao?.sacola
            ? `Marcar as ${devolucao.sacola.disponiveis ?? ""} peça(s) disponível(is) da sacola #${devolucao.sacola.id} como devolvidas ao consignante? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Devolver tudo"
      />
    </Box>
  );
}

function MiniStat({ icone, cor, titulo, valor }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          bgcolor: cor,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icone}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          {titulo}
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>{valor}</Typography>
      </Box>
    </Box>
  );
}

function SacolaCard({ sacola, onDevolver, onAbrir }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  // Permite passar pelo backend (podeDevolverTudo) ou fallback baseado em vendidas
  const podeDevolver =
    sacola.podeDevolverTudo ??
    (Number(sacola.vendidas) === 0 && Number(sacola.total) > 0);

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.22),
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LocalMall fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>Sacola #{sacola.id}</Typography>
          <Typography variant="caption" color="text.secondary">
            Cadastrada em {formatData(sacola.dataCadastro)}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={`${sacola.total} peça${Number(sacola.total) === 1 ? "" : "s"}`}
          sx={{ bgcolor: "action.hover", fontWeight: 700 }}
        />
      </Box>

      {sacola.observacao && (
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
          “{sacola.observacao}”
        </Typography>
      )}

      <Divider />

      <Box sx={{ display: "flex", gap: 1 }}>
        <StatusDot cor={theme.palette.success.main} label="Disponíveis" valor={sacola.disponiveis} />
        <StatusDot cor={theme.palette.info.main} label="Vendidas" valor={sacola.vendidas} />
        <StatusDot cor={alpha("#94A3B8", 1)} label="Devolvidas" valor={sacola.devolvidas} />
      </Box>

      <Box
        sx={{
          p: 1.25,
          borderRadius: 1.5,
          bgcolor: "action.hover",
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Total venda
          </Typography>
          <Typography sx={{ fontWeight: 800 }}>{formatBRL(sacola.valorVenda)}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Repasse
          </Typography>
          <Typography sx={{ fontWeight: 800, color: theme.palette.warning.main }}>
            {formatBRL(sacola.valorRepasse)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mt: "auto" }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<Visibility />}
          onClick={onAbrir}
          sx={{ textTransform: "none", borderRadius: 1.5 }}
        >
          Ver peças
        </Button>
        <Tooltip
          title={
            podeDevolver
              ? "Marca todas as peças como devolvidas"
              : "Existem peças já vendidas nesta sacola"
          }
          arrow
        >
          <span>
            <Button
              variant="outlined"
              color="error"
              startIcon={<AssignmentReturn />}
              disabled={!podeDevolver}
              onClick={onDevolver}
              sx={{ textTransform: "none", borderRadius: 1.5, whiteSpace: "nowrap" }}
            >
              Devolver tudo
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Paper>
  );
}

function StatusDot({ cor, label, valor }) {
  return (
    <Box
      sx={{
        flex: 1,
        p: 0.75,
        borderRadius: 1,
        bgcolor: alpha(cor, 0.12),
        textAlign: "center",
        border: "1px solid",
        borderColor: alpha(cor, 0.25),
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "1rem",
          color: cor,
          lineHeight: 1,
        }}
      >
        {valor ?? 0}
      </Typography>
      <Typography variant="caption" sx={{ fontSize: 10, color: "text.secondary" }}>
        {label}
      </Typography>
    </Box>
  );
}

export default BazarConsignante;
