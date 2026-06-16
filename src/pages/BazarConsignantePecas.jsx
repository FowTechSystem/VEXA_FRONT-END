// src/pages/BazarConsignantePecas.jsx
// Tela 5 — Listagem de peças do consignante.
// Filtros (status + período + sacola via query string) + tabela com fotos,
// valores, status e ações por peça (editar, devolver, ver detalhes).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Breadcrumbs,
  Link as MUILink,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  Tooltip,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowBack,
  Visibility,
  Checkroom,
  PhotoLibrary,
  LocalMall,
  Close,
  Delete,
  AssignmentReturn,
} from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Grid,
} from "@mui/material";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { LoadingBox } from "../components/LoadingBox";
import VexaDatePicker from "../components/VexaDatePicker";
import ConfirmDialog from "../components/ConfirmDialog";
import { bazarConsignantesService } from "../api/bazarConsignantesService";
import { bazarPecasService } from "../api/bazarPecasService";
import { bazarSacolasService } from "../api/bazarSacolasService";
import { STATUS_PECA } from "../components/Bazar/bazarConstants";
import { formatBRL, formatData } from "../components/Bazar/bazarHelpers";
import { showSuccess, showError, showWarning } from "../utils/notifications";

const FILTROS = [
  { value: "todos", label: "Todos" },
  { value: STATUS_PECA.DISPONIVEL, label: "Disponível" },
  { value: STATUS_PECA.VENDIDA, label: "Vendido" },
  { value: STATUS_PECA.DEVOLVIDA, label: "Devolvido" },
];

function statusChipProps(status, theme) {
  if (status === STATUS_PECA.DISPONIVEL) {
    return {
      label: "Disponível",
      sx: {
        bgcolor: alpha(theme.palette.success.main, 0.18),
        color: theme.palette.success.main,
        fontWeight: 700,
        border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`,
      },
    };
  }
  if (status === STATUS_PECA.VENDIDA) {
    return {
      label: "Vendido",
      sx: {
        bgcolor: alpha(theme.palette.info.main, 0.18),
        color: theme.palette.mode === "dark" ? "#7DD3FC" : theme.palette.info.dark,
        fontWeight: 700,
        border: `1px solid ${alpha(theme.palette.info.main, 0.4)}`,
      },
    };
  }
  return {
    label: "Devolvido",
    sx: {
      bgcolor: alpha("#94A3B8", 0.2),
      color: theme.palette.text.secondary,
      fontWeight: 700,
      border: `1px solid ${alpha("#94A3B8", 0.45)}`,
    },
  };
}

function BazarConsignantePecas() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sacolaIdParam = searchParams.get("sacolaId");

  const [consignante, setConsignante] = useState(null);
  const [pecas, setPecas] = useState([]);
  const [sacolaFiltro, setSacolaFiltro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Estado do modal de confirmação de exclusão de peça
  const [exclusao, setExclusao] = useState(null); // { peca, loading }
  // Estado do modal de devolução individual de peça
  const [devolucao, setDevolucao] = useState(null); // { peca, loading }
  // Peça exibida no modal de detalhes
  const [detalhe, setDetalhe] = useState(null);

  // Carrega consignante uma vez por id (só pra exibir nome no breadcrumb/header)
  useEffect(() => {
    let cancelled = false;
    bazarConsignantesService
      .getById(id)
      .then((c) => {
        if (!cancelled) setConsignante(c);
      })
      .catch(() => {
        if (!cancelled) setConsignante(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Carrega info da sacola filtrada (se houver), pra exibir no chip
  useEffect(() => {
    let cancelled = false;
    if (!sacolaIdParam) {
      setSacolaFiltro(null);
      return undefined;
    }
    bazarSacolasService
      .getById(sacolaIdParam)
      .then((s) => {
        if (!cancelled) setSacolaFiltro(s);
      })
      .catch(() => {
        if (!cancelled) setSacolaFiltro(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sacolaIdParam]);

  const carregarPecas = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await bazarPecasService.listar({
        consignanteId: id,
        sacolaId: sacolaIdParam || undefined,
        status: filtroStatus !== "todos" ? filtroStatus : undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });
      const lista = Array.isArray(data) ? data : data?.pecas || data?.items || [];
      setPecas(lista);
    } catch (error) {
      console.error("[BazarConsignantePecas] erro ao listar:", error);
      showError("Não foi possível carregar as peças.");
      setPecas([]);
    } finally {
      setCarregando(false);
    }
  }, [id, sacolaIdParam, filtroStatus, dataInicio, dataFim]);

  useEffect(() => {
    carregarPecas();
  }, [carregarPecas]);

  const valorTotalFiltro = useMemo(
    () => pecas.reduce((acc, p) => acc + (Number(p.valorVenda) || 0), 0),
    [pecas],
  );

  const removerFiltroSacola = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("sacolaId");
    setSearchParams(next);
  };

  if (!consignante) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate("/bazar")}>
          Voltar
        </Button>
        <LoadingBox size={48} py={10} />
      </Box>
    );
  }

  const handleVerDetalhes = (peca) => setDetalhe(peca);

  const handleAbrirDevolucao = (peca) => {
    if (peca.status !== STATUS_PECA.DISPONIVEL) {
      showWarning("Apenas peças disponíveis podem ser devolvidas.");
      return;
    }
    setDevolucao({ peca, loading: false });
  };

  const executarDevolucao = async () => {
    if (!devolucao?.peca) return;
    setDevolucao((prev) => ({ ...prev, loading: true }));
    try {
      await bazarPecasService.devolver(devolucao.peca.id);
      showSuccess("Peça marcada como devolvida.");
      setDevolucao(null);
      await carregarPecas();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Não foi possível devolver esta peça.";
      showError(msg);
      console.error("[BazarConsignantePecas] erro ao devolver peça:", error);
      setDevolucao((prev) => (prev ? { ...prev, loading: false } : null));
    }
  };

  const handleAbrirExclusao = (peca) => {
    if (peca.status === STATUS_PECA.VENDIDA) return; // segurança extra
    setExclusao({ peca, loading: false });
  };

  const handleFecharExclusao = () => {
    setExclusao((prev) => (prev?.loading ? prev : null));
  };

  const executarExclusao = async () => {
    if (!exclusao?.peca) return;
    setExclusao((prev) => ({ ...prev, loading: true }));
    try {
      await bazarPecasService.delete(exclusao.peca.id);
      showSuccess("Peça excluída.");
      setExclusao(null);
      await carregarPecas();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Não foi possível excluir esta peça.";
      showError(msg);
      console.error("[BazarConsignantePecas] erro ao excluir peça:", error);
      setExclusao((prev) => (prev ? { ...prev, loading: false } : null));
    }
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
            onClick={() => navigate(`/bazar/consignante/${consignante.id}`)}
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
            <MUILink
              component="button"
              underline="hover"
              onClick={() => navigate(`/bazar/consignante/${consignante.id}`)}
              sx={{ color: "text.secondary", fontSize: 14 }}
            >
              {consignante.nome}
            </MUILink>
            <Typography sx={{ color: "text.primary", fontWeight: 600, fontSize: 14 }}>
              Peças
            </Typography>
          </Breadcrumbs>
        </Box>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              alignItems: { xs: "stretch", lg: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Peças de {consignante.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pecas.length} {pecas.length === 1 ? "peça" : "peças"} ·
                Valor total: {formatBRL(valorTotalFiltro)}
              </Typography>
              {sacolaFiltro && (
                <Chip
                  size="small"
                  icon={<LocalMall sx={{ fontSize: 16 }} />}
                  label={`Filtrando sacola #${sacolaFiltro.id} (${formatData(sacolaFiltro.dataCadastro)})`}
                  onDelete={removerFiltroSacola}
                  deleteIcon={<Close fontSize="small" />}
                  sx={{
                    mt: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.18),
                    color: "primary.main",
                    fontWeight: 700,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                />
              )}
            </Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={filtroStatus}
                onChange={(_, v) => v && setFiltroStatus(v)}
                sx={{
                  flexWrap: "wrap",
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    px: 1.5,
                    py: 0.5,
                    fontWeight: 600,
                    borderRadius: 2,
                  },
                  "& .Mui-selected": {
                    bgcolor: `${alpha(theme.palette.primary.main, 0.18)} !important`,
                    color: "text.primary !important",
                  },
                }}
              >
                {FILTROS.map((f) => (
                  <ToggleButton key={f.value} value={f.value}>
                    {f.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Stack direction="row" spacing={1.5}>
                <VexaDatePicker
                  label="Data início"
                  value={dataInicio}
                  onChange={setDataInicio}
                />
                <VexaDatePicker
                  label="Data fim"
                  value={dataFim}
                  onChange={setDataFim}
                />
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell sx={headerCellSx} width={70}>FOTO</TableCell>
                <TableCell sx={headerCellSx}>PEÇA</TableCell>
                <TableCell sx={headerCellSx} width={110}>VALORES</TableCell>
                <TableCell sx={headerCellSx} width={130}>STATUS</TableCell>
                <TableCell sx={headerCellSx} width={120}>ENTRADA</TableCell>
                <TableCell sx={headerCellSx} width={140}>SAÍDA / DEVOLUÇÃO</TableCell>
                <TableCell sx={headerCellSx} align="right" width={140}>AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregando ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <LoadingBox size={40} py={6} />
                  </TableCell>
                </TableRow>
              ) : pecas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Checkroom sx={{ fontSize: 48, color: "text.secondary", opacity: 0.5, mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      Nenhuma peça encontrada com os filtros atuais
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate(`/bazar/consignante/${consignante.id}`)}
                      sx={{ mt: 2, textTransform: "none", fontWeight: 700 }}
                    >
                      Adicionar peças
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                pecas.map((p, idx) => {
                  const chip = statusChipProps(p.status, theme);
                  const fotoUrl = p.fotos?.[0]?.url || p.fotos?.[0]?.previewUrl;
                  return (
                    <TableRow
                      key={p.id}
                      sx={{
                        "&:hover": { bgcolor: "action.hover" },
                        borderBottom: idx === pecas.length - 1 ? "none" : "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        {fotoUrl ? (
                          <Avatar src={fotoUrl} variant="rounded" sx={{ width: 48, height: 48 }} />
                        ) : (
                          <Avatar
                            variant="rounded"
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: "action.hover",
                              color: "text.secondary",
                            }}
                          >
                            <PhotoLibrary fontSize="small" />
                          </Avatar>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontWeight: 600 }}>{p.descricao}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tam {p.tamanho || "—"} · {p.cor || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontWeight: 700 }}>
                          {formatBRL(p.valorVenda)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Repasse {formatBRL(p.valorCompra)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={chip.label} size="small" sx={chip.sx} />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                        {formatData(p.dataEntrada)}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                        {p.status === STATUS_PECA.VENDIDA
                          ? `Vendida: ${formatData(p.dataVenda)}`
                          : p.status === STATUS_PECA.DEVOLVIDA
                          ? `Devolvida: ${formatData(p.dataDevolucao)}`
                          : "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Ver detalhes">
                            <IconButton
                              size="small"
                              onClick={() => handleVerDetalhes(p)}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {p.status === STATUS_PECA.DISPONIVEL && (
                            <Tooltip title="Devolver peça ao consignante">
                              <IconButton
                                size="small"
                                onClick={() => handleAbrirDevolucao(p)}
                                sx={{
                                  color: "text.secondary",
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.warning.main, 0.14),
                                    color: "warning.main",
                                  },
                                }}
                              >
                                <AssignmentReturn fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {p.status === STATUS_PECA.VENDIDA ? (
                            <Tooltip title="Peça vendida não pode ser excluída">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled
                                  sx={{
                                    color: "text.secondary",
                                    opacity: 0.3,
                                    cursor: "not-allowed",
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Excluir peça">
                              <IconButton
                                size="small"
                                onClick={() => handleAbrirExclusao(p)}
                                sx={{
                                  color: alpha(theme.palette.error.main, 0.85),
                                  "&:hover": {
                                    bgcolor: alpha(theme.palette.error.main, 0.14),
                                    color: "error.main",
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      <ConfirmDialog
        open={!!exclusao}
        onClose={handleFecharExclusao}
        onConfirm={executarExclusao}
        variant="confirm"
        destructive
        loading={!!exclusao?.loading}
        title="Excluir peça"
        message={
          exclusao?.peca
            ? `Deseja excluir esta peça? Esta ação não pode ser desfeita.\n\n${exclusao.peca.descricao}${
                exclusao.peca.tamanho ? ` · Tam ${exclusao.peca.tamanho}` : ""
              }${exclusao.peca.cor ? ` · ${exclusao.peca.cor}` : ""}`
            : "Deseja excluir esta peça? Esta ação não pode ser desfeita."
        }
        confirmLabel="Excluir"
      />

      <ConfirmDialog
        open={!!devolucao}
        onClose={() => setDevolucao((prev) => (prev?.loading ? prev : null))}
        onConfirm={executarDevolucao}
        variant="warning"
        loading={!!devolucao?.loading}
        title="Devolver peça"
        message={
          devolucao?.peca
            ? `Marcar a peça "${devolucao.peca.descricao}" como devolvida ao consignante? Ela sai do estoque do bazar.`
            : ""
        }
        confirmLabel="Devolver"
      />

      <PecaDetalheDialog peca={detalhe} onClose={() => setDetalhe(null)} />
    </Box>
  );
}

function PecaDetalheDialog({ peca, onClose }) {
  const theme = useTheme();
  if (!peca) return null;
  const chip = statusChipProps(peca.status, theme);
  return (
    <Dialog
      open={!!peca}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 6 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
            {peca.descricao}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Peça #{peca.id} · Sacola #{peca.sacolaId}
          </Typography>
        </Box>
        <Chip label={chip.label} size="small" sx={chip.sx} />
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {Array.isArray(peca.fotos) && peca.fotos.length > 0 && (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {peca.fotos.map((f) => (
                <Avatar
                  key={f.id ?? f.url}
                  src={f.url}
                  variant="rounded"
                  sx={{
                    width: 96,
                    height: 96,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                />
              ))}
            </Stack>
            <Divider sx={{ mb: 2 }} />
          </>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <DetalheItem titulo="Tamanho" valor={peca.tamanho || "—"} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetalheItem titulo="Cor" valor={peca.cor || "—"} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetalheItem titulo="Valor de venda" valor={formatBRL(peca.valorVenda)} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetalheItem
              titulo="Repasse ao consignante"
              valor={formatBRL(peca.valorCompra)}
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetalheItem titulo="Entrada" valor={formatData(peca.dataEntrada)} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetalheItem
              titulo={
                peca.status === STATUS_PECA.DEVOLVIDA
                  ? "Devolvida em"
                  : "Vendida em"
              }
              valor={
                peca.status === STATUS_PECA.DEVOLVIDA
                  ? formatData(peca.dataDevolucao)
                  : peca.status === STATUS_PECA.VENDIDA
                  ? formatData(peca.dataVenda)
                  : "—"
              }
            />
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

function DetalheItem({ titulo, valor }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {titulo}
      </Typography>
      <Typography sx={{ fontWeight: 700 }}>{valor}</Typography>
    </Box>
  );
}

const headerCellSx = {
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: 0.5,
  color: "text.primary",
  py: 1.5,
};

export default BazarConsignantePecas;
