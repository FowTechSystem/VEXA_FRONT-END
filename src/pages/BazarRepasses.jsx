// src/pages/BazarRepasses.jsx
// Tela 6 — Gestão de Repasses.
// Aba "Pendentes": consignantes com valor a pagar + ação "Gerar repasse"
// Aba "Histórico": lista de repasses já gerados, com filtros
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  IconButton,
  Button,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Stack as MStack,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Payments,
  Visibility,
  CheckCircle,
  ArrowBack,
  Storefront,
} from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoadingBox } from "../components/LoadingBox";
import VexaDatePicker from "../components/VexaDatePicker";
import { bazarConsignantesService } from "../api/bazarConsignantesService";
import { bazarRepassesService } from "../api/bazarRepassesService";
import { STATUS_REPASSE } from "../components/Bazar/bazarConstants";
import {
  formatBRL,
  formatData,
  getAvatarColor,
  getInitials,
} from "../components/Bazar/bazarHelpers";
import GerarRepasseModal from "../components/Bazar/GerarRepasseModal";
import { showSuccess, showError, showWarning } from "../utils/notifications";

function BazarRepasses() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const consignanteParam = searchParams.get("consignanteId");

  const [aba, setAba] = useState("pendentes");
  const [modalAberto, setModalAberto] = useState(false);
  const [consignanteSelecionado, setConsignanteSelecionado] = useState(null);
  const [pecasPendentesModal, setPecasPendentesModal] = useState([]);
  const [carregandoModal, setCarregandoModal] = useState(false);

  // Aba Pendentes
  const [pendentes, setPendentes] = useState([]);
  const [carregandoPendentes, setCarregandoPendentes] = useState(true);

  // Aba Histórico
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroConsignante, setFiltroConsignante] = useState("todos");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Lista de consignantes para o filtro do histórico
  const [consignantesParaFiltro, setConsignantesParaFiltro] = useState([]);

  const carregarPendentes = useCallback(async () => {
    setCarregandoPendentes(true);
    try {
      const data = await bazarRepassesService.listarPendentes();
      const lista = Array.isArray(data) ? data : data?.itens || data?.items || [];
      setPendentes(lista);
    } catch (error) {
      console.error("[BazarRepasses] erro ao listar pendentes:", error);
      showError("Não foi possível carregar a lista de pendentes.");
      setPendentes([]);
    } finally {
      setCarregandoPendentes(false);
    }
  }, []);

  const carregarHistorico = useCallback(async () => {
    setCarregandoHistorico(true);
    try {
      const data = await bazarRepassesService.listar({
        status: filtroStatus !== "todos" ? filtroStatus : undefined,
        consignanteId:
          filtroConsignante !== "todos" ? filtroConsignante : undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });
      const lista = Array.isArray(data) ? data : data?.repasses || data?.items || [];
      setHistorico(lista);
    } catch (error) {
      console.error("[BazarRepasses] erro ao listar histórico:", error);
      showError("Não foi possível carregar o histórico de repasses.");
      setHistorico([]);
    } finally {
      setCarregandoHistorico(false);
    }
  }, [filtroStatus, filtroConsignante, dataInicio, dataFim]);

  // Lista enxuta de consignantes pro select do filtro de histórico (não precisa de resumo)
  useEffect(() => {
    bazarConsignantesService
      .listar({ incluirResumo: false })
      .then((data) => {
        const lista = Array.isArray(data)
          ? data
          : data?.consignantes || data?.items || [];
        setConsignantesParaFiltro(lista);
      })
      .catch(() => setConsignantesParaFiltro([]));
  }, []);

  useEffect(() => {
    carregarPendentes();
  }, [carregarPendentes]);

  useEffect(() => {
    if (aba === "historico") carregarHistorico();
  }, [aba, carregarHistorico]);

  // Se chegou com consignanteId na URL, abre o modal automaticamente após carregar pendentes
  useEffect(() => {
    if (!consignanteParam || carregandoPendentes) return;
    const entry = pendentes.find(
      (p) => String(p.consignante?.id) === String(consignanteParam),
    );
    if (entry) {
      handleAbrirGerar(entry.consignante, entry.pecas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consignanteParam, pendentes, carregandoPendentes]);

  const totalPendenteGeral = useMemo(
    () => pendentes.reduce((acc, p) => acc + (Number(p.total) || 0), 0),
    [pendentes],
  );

  const handleAbrirGerar = async (consignante, pecasJaCarregadas = null) => {
    setConsignanteSelecionado(consignante);
    setModalAberto(true);
    if (pecasJaCarregadas?.length) {
      setPecasPendentesModal(pecasJaCarregadas);
      return;
    }
    // Se não temos as peças em mãos, carregamos via endpoint específico
    setCarregandoModal(true);
    try {
      const data = await bazarRepassesService.getPecasPendentes(consignante.id);
      const lista = Array.isArray(data) ? data : data?.pecas || data?.items || [];
      setPecasPendentesModal(lista);
    } catch (error) {
      console.error("[BazarRepasses] erro ao buscar peças pendentes:", error);
      showError("Não foi possível carregar as peças pendentes deste consignante.");
      setPecasPendentesModal([]);
    } finally {
      setCarregandoModal(false);
    }
  };

  const handleConfirmarRepasse = async (dados) => {
    try {
      const criado = await bazarRepassesService.create({
        consignanteId: dados.consignanteId,
        pecasIds: dados.pecasIds,
        formaPagamento: dados.formaPagamento,
        observacao: dados.observacao,
      });
      showSuccess(
        `Repasse de ${formatBRL(criado?.valor ?? dados.valor)} gerado para ${
          consignanteSelecionado?.nome
        }.`,
      );
      fecharModal();
      // Recarrega ambas as listas
      await Promise.all([carregarPendentes(), carregarHistorico()]);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Não foi possível gerar o repasse.";
      showError(msg);
      console.error("[BazarRepasses] erro ao criar repasse:", error);
    }
  };

  const fecharModal = () => {
    setModalAberto(false);
    setConsignanteSelecionado(null);
    setPecasPendentesModal([]);
    if (consignanteParam) {
      const next = new URLSearchParams(searchParams);
      next.delete("consignanteId");
      setSearchParams(next);
    }
  };

  const handleMarcarPago = async (repasse) => {
    try {
      await bazarRepassesService.marcarComoPago(repasse.id);
      showSuccess("Repasse marcado como pago.");
      await carregarHistorico();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Não foi possível marcar este repasse como pago.";
      showError(msg);
    }
  };

  const handleVerDetalhes = () => {
    showWarning("Detalhes do repasse estarão disponíveis em breve.");
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
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                bgcolor: "#8B5CF6",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Payments />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                Repasses
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Controle financeiro do que a loja deve aos consignantes
              </Typography>
            </Box>
          </Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/bazar")}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Voltar ao Bazar
          </Button>
        </Box>

        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            background: isDark
              ? "linear-gradient(135deg, rgba(139,92,246,0.10) 0%, transparent 70%)"
              : "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, transparent 70%)",
            border: "1px solid",
            borderColor: alpha("#8B5CF6", 0.4),
          }}
        >
          <CardContent
            sx={{
              display: "flex",
              gap: 3,
              alignItems: "center",
              flexDirection: { xs: "column", md: "row" },
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Total pendente
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: "2rem", lineHeight: 1.1 }}>
                {formatBRL(totalPendenteGeral)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pendentes.length}{" "}
                {pendentes.length === 1
                  ? "consignante aguardando"
                  : "consignantes aguardando"}{" "}
                pagamento
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Tabs
            value={aba}
            onChange={(_, v) => setAba(v)}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
              },
            }}
          >
            <Tab label={`Pendentes (${pendentes.length})`} value="pendentes" />
            <Tab label="Histórico" value="historico" />
          </Tabs>
        </Box>

        {aba === "pendentes" &&
          (carregandoPendentes ? (
            <LoadingBox size={40} py={6} />
          ) : pendentes.length === 0 ? (
            <Card variant="outlined" sx={{ borderRadius: 2, p: 5, textAlign: "center" }}>
              <CheckCircle sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Nenhum repasse pendente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Todos os consignantes estão em dia com seus repasses.
              </Typography>
            </Card>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={headerCellSx}>CONSIGNANTE</TableCell>
                    <TableCell sx={headerCellSx} width={130}>TELEFONE</TableCell>
                    <TableCell sx={headerCellSx} width={120}>PEÇAS</TableCell>
                    <TableCell sx={headerCellSx} width={140} align="right">VALOR A PAGAR</TableCell>
                    <TableCell sx={headerCellSx} width={180} align="right">AÇÕES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendentes.map((entry, idx) => (
                    <TableRow
                      key={entry.consignante.id}
                      sx={{
                        "&:hover": { bgcolor: "action.hover" },
                        borderBottom:
                          idx === pendentes.length - 1 ? "none" : "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              bgcolor: getAvatarColor(entry.consignante.nome),
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            {getInitials(entry.consignante.nome)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>
                              {entry.consignante.nome}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ cursor: "pointer", "&:hover": { color: "primary.main" } }}
                              onClick={() =>
                                navigate(`/bazar/consignante/${entry.consignante.id}`)
                              }
                            >
                              Ver perfil
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                        {entry.consignante.telefone}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${entry.pecas?.length ?? entry.qtdPecas ?? 0} peça${
                            (entry.pecas?.length ?? entry.qtdPecas) === 1 ? "" : "s"
                          }`}
                          size="small"
                          sx={{ bgcolor: "action.hover", fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#8B5CF6" }}>
                          {formatBRL(entry.total)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          startIcon={<Payments />}
                          onClick={() => handleAbrirGerar(entry.consignante, entry.pecas)}
                          size="small"
                          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                        >
                          Gerar repasse
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ))}

        {aba === "historico" && (
          <>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <MStack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  alignItems={{ md: "center" }}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      label="Status"
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      <MenuItem value={STATUS_REPASSE.PENDENTE}>Pendente</MenuItem>
                      <MenuItem value={STATUS_REPASSE.PAGO}>Pago</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Consignante</InputLabel>
                    <Select
                      label="Consignante"
                      value={filtroConsignante}
                      onChange={(e) => setFiltroConsignante(e.target.value)}
                    >
                      <MenuItem value="todos">Todos</MenuItem>
                      {consignantesParaFiltro.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                </MStack>
              </CardContent>
            </Card>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={headerCellSx} width={130}>DATA</TableCell>
                    <TableCell sx={headerCellSx}>CONSIGNANTE</TableCell>
                    <TableCell sx={headerCellSx} width={130} align="right">VALOR</TableCell>
                    <TableCell sx={headerCellSx} width={160}>FORMA DE PAGAMENTO</TableCell>
                    <TableCell sx={headerCellSx} width={120}>STATUS</TableCell>
                    <TableCell sx={headerCellSx} align="right" width={140}>AÇÕES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {carregandoHistorico ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <LoadingBox size={40} py={6} />
                      </TableCell>
                    </TableRow>
                  ) : historico.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Storefront sx={{ fontSize: 40, color: "text.secondary", opacity: 0.5, mb: 1 }} />
                        <Typography color="text.secondary">
                          Nenhum repasse encontrado com os filtros atuais.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    historico.map((r, idx) => {
                      const c = r.consignante || consignantesParaFiltro.find((x) => x.id === r.consignanteId);
                      const isPago = r.status === STATUS_REPASSE.PAGO;
                      return (
                        <TableRow
                          key={r.id}
                          sx={{
                            "&:hover": { bgcolor: "action.hover" },
                            borderBottom:
                              idx === historico.length - 1 ? "none" : "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                            {formatData(r.data)}
                          </TableCell>
                          <TableCell>
                            {c ? (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: getAvatarColor(c.nome),
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  {getInitials(c.nome)}
                                </Avatar>
                                <Typography sx={{ fontWeight: 600 }}>{c.nome}</Typography>
                              </Box>
                            ) : (
                              <Typography color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 700 }}>
                              {formatBRL(r.valor)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={r.formaPagamento}
                              size="small"
                              sx={{ bgcolor: "action.hover", fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={isPago ? "Pago" : "Pendente"}
                              size="small"
                              sx={
                                isPago
                                  ? {
                                      bgcolor: alpha(theme.palette.success.main, 0.18),
                                      color: theme.palette.success.main,
                                      fontWeight: 700,
                                      border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`,
                                    }
                                  : {
                                      bgcolor: alpha(theme.palette.warning.main, 0.18),
                                      color: theme.palette.warning.main,
                                      fontWeight: 700,
                                      border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                                    }
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              {!isPago && (
                                <Tooltip title="Marcar como pago">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMarcarPago(r)}
                                    sx={{
                                      color: "text.secondary",
                                      "&:hover": {
                                        bgcolor: alpha(theme.palette.success.main, 0.12),
                                        color: "success.main",
                                      },
                                    }}
                                  >
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Ver detalhes">
                                <IconButton
                                  size="small"
                                  onClick={handleVerDetalhes}
                                  sx={{
                                    color: "text.secondary",
                                    "&:hover": {
                                      bgcolor: "action.hover",
                                      color: "primary.main",
                                    },
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Stack>

      <GerarRepasseModal
        open={modalAberto}
        onClose={fecharModal}
        consignante={consignanteSelecionado}
        pecasPendentes={pecasPendentesModal}
        carregando={carregandoModal}
        onConfirmar={handleConfirmarRepasse}
      />
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

export default BazarRepasses;
