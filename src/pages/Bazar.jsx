// src/pages/Bazar.jsx
// Tela 1 — Hub Bazar.
// Layout: cabeçalho + resumo geral + alerta de pendências +
// busca + TABELA de consignantes (mesmo padrão de Clientes/Marcas).
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Stack,
  IconButton,
  Avatar,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Search,
  Add,
  Storefront,
  Payments,
  Inventory2,
  Assessment,
  Settings,
  WarningAmberRounded,
  Checkroom,
  ArrowForward,
  Delete,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { LoadingBox } from "../components/LoadingBox";
import ConfirmDialog from "../components/ConfirmDialog";
import NovoConsignanteModal from "../components/Bazar/NovoConsignanteModal";
import {
  getAvatarColor,
  getInitials,
  formatBRL,
} from "../components/Bazar/bazarHelpers";
import { bazarConsignantesService } from "../api/bazarConsignantesService";
import { showSuccess, showError } from "../utils/notifications";

function Bazar() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const buscaRef = useRef(null);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [modalNovoOpen, setModalNovoOpen] = useState(false);

  const [consignantes, setConsignantes] = useState([]);
  const [resumo, setResumo] = useState({
    pendenteTotal: 0,
    consignantesPendentes: 0,
    emEstoque: 0,
    vendidoMes: 0,
  });
  const [carregando, setCarregando] = useState(false);

  // Máquina de estado da exclusão (3 cenários conforme contrato com o backend)
  //   step: "confirm" → modal simples "Deseja excluir?"
  //   step: "blocked" → modal bloqueante (HAS_SALES)
  //   step: "warning" → modal de aviso amarelo com count de peças (HAS_BAG_ITEMS)
  const [exclusao, setExclusao] = useState(null);
  // { consignante, step, qtdPecas, message, loading }

  // Foco automático no campo de busca ao carregar (UX requisito do fluxo principal)
  useEffect(() => {
    const t = setTimeout(() => buscaRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Debounce do filtro de busca para não pingar o backend a cada tecla
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca.trim()), 350);
    return () => clearTimeout(t);
  }, [busca]);

  const carregarConsignantes = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await bazarConsignantesService.listar({
        busca: buscaDebounced || undefined,
        incluirResumo: true,
        tamanho: 500,
      });
      const lista = Array.isArray(data)
        ? data
        : data?.consignantes || data?.items || [];
      setConsignantes(lista);
    } catch (error) {
      console.error("[Bazar] Falha ao carregar consignantes:", error);
      showError("Não foi possível carregar a lista de consignantes.");
      setConsignantes([]);
    } finally {
      setCarregando(false);
    }
  }, [buscaDebounced]);

  const carregarResumo = useCallback(async () => {
    try {
      const data = await bazarConsignantesService.getResumoGeral();
      setResumo({
        pendenteTotal: Number(data?.pendenteTotal) || 0,
        consignantesPendentes: Number(data?.consignantesPendentes) || 0,
        emEstoque: Number(data?.emEstoque) || 0,
        vendidoMes: Number(data?.vendidoMes) || 0,
      });
    } catch (error) {
      console.error("[Bazar] Falha ao carregar resumo:", error);
      // resumo silencioso — não interrompe o fluxo do usuário
    }
  }, []);

  useEffect(() => {
    carregarConsignantes();
  }, [carregarConsignantes]);

  useEffect(() => {
    carregarResumo();
  }, [carregarResumo]);

  const linhas = useMemo(() => {
    // Ordena no front (pendente desc → estoque desc) para garantir UX consistente
    return [...consignantes].sort((a, b) => {
      const pa = Number(a?.resumo?.pendente) || 0;
      const pb = Number(b?.resumo?.pendente) || 0;
      if (pb !== pa) return pb - pa;
      const ea = Number(a?.resumo?.emEstoque) || 0;
      const eb = Number(b?.resumo?.emEstoque) || 0;
      return eb - ea;
    });
  }, [consignantes]);

  const handleSelecionar = (id) => navigate(`/bazar/consignante/${id}`);

  const handleNovoSalvo = async (novo) => {
    showSuccess("Consignante cadastrado com sucesso.");
    setModalNovoOpen(false);
    navigate(`/bazar/consignante/${novo.id}`);
  };

  /**
   * Abre o fluxo de exclusão de um consignante a partir do clique na lixeira.
   * Começa pelo modal de confirmação simples; o backend define o próximo passo.
   */
  const handleAbrirExclusao = (consignante) => {
    setExclusao({
      consignante,
      step: "confirm",
      qtdPecas: 0,
      message: "",
      loading: false,
    });
  };

  const handleFecharExclusao = () => {
    setExclusao((prev) => (prev?.loading ? prev : null));
  };

  /**
   * Tenta excluir o consignante. Interpreta a resposta do backend:
   *   200/204                              → sucesso (toast + refresh)
   *   409 { error: "HAS_SALES" }           → exibe modal bloqueante
   *   409 { error: "HAS_BAG_ITEMS", ...}   → exibe modal de aviso (passa qtdPecas)
   *   outros erros                         → toast vermelho com mensagem
   *
   * Quando o usuário confirma o modal de aviso, a função é chamada novamente
   * com `confirmed=true` para autorizar a remoção em cascata das peças.
   */
  const executarExclusao = async ({ confirmed = false } = {}) => {
    if (!exclusao?.consignante) return;
    setExclusao((prev) => ({ ...prev, loading: true }));
    try {
      await bazarConsignantesService.delete(exclusao.consignante.id, {
        confirmed,
      });
      showSuccess(
        `Consignante "${exclusao.consignante.nome}" excluído com sucesso.`,
      );
      setExclusao(null);
      await carregarConsignantes();
      carregarResumo();
    } catch (error) {
      const data = error?.response?.data || {};
      const status = error?.response?.status;
      const code = String(data.error || data.code || "").toUpperCase();

      if (status === 409 && code === "HAS_SALES") {
        setExclusao({
          consignante: exclusao.consignante,
          step: "blocked",
          qtdPecas: 0,
          message:
            data.message ||
            "O consignante não pode ser excluído pois existem vendas vinculadas a ele. Exclua ou desvincule as vendas primeiro.",
          loading: false,
        });
        return;
      }

      if (status === 409 && code === "HAS_BAG_ITEMS") {
        const qtd =
          Number(data.bagItemsCount ?? data.qtdPecas ?? data.count ?? data.quantidade) || 0;
        setExclusao({
          consignante: exclusao.consignante,
          step: "warning",
          qtdPecas: qtd,
          message:
            data.message ||
            `Este consignante possui ${qtd} peça(s) em sacola. Ao excluir, todas as peças disponíveis também serão removidas. Deseja continuar?`,
          loading: false,
        });
        return;
      }

      const msg =
        data.message ||
        data.detail ||
        "Não foi possível excluir o consignante. Tente novamente.";
      showError(msg);
      console.error("[Bazar] erro ao excluir:", error);
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
        {/* ════════════════ Cabeçalho ════════════════ */}
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
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Storefront />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                Bazar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cadastre peças, gerencie consignantes e repasses
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => navigate("/relatorios")}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              Relatórios
            </Button>
            <Tooltip title="Configurações">
              <IconButton
                onClick={() => navigate("/configuracoes")}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ════════════════ Resumo geral — 3 cards ════════════════ */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ResumoCard
              icone={<Payments />}
              corCirculo="#8B5CF6"
              titulo="Pendente de repasse"
              valor={formatBRL(resumo.pendenteTotal)}
              descricao="Aguardando pagamento aos consignantes"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ResumoCard
              icone={<Checkroom />}
              corCirculo="#14B8A6"
              titulo="Em estoque (bazar)"
              valor={`${resumo.emEstoque} peças`}
              descricao="Disponíveis para venda"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <ResumoCard
              icone={<Inventory2 />}
              corCirculo="#F59E0B"
              titulo="Vendido este mês"
              valor={`${resumo.vendidoMes} peças`}
              descricao="Total deste mês"
            />
          </Grid>
        </Grid>

        {/* ════════════════ Alerta de pendências ════════════════ */}
        {resumo.consignantesPendentes > 0 && (
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              borderColor: alpha(theme.palette.warning.main, 0.6),
              bgcolor: alpha(theme.palette.warning.main, isDark ? 0.08 : 0.12),
            }}
          >
            <CardContent
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 2,
                flexDirection: { xs: "column", sm: "row" },
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              <WarningAmberRounded sx={{ color: "warning.main", fontSize: 32 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary" }}>
                  {resumo.consignantesPendentes} consignantes com repasse pendente
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total devido: {formatBRL(resumo.pendenteTotal)}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="warning"
                onClick={() => navigate("/bazar/repasses")}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
              >
                Ver lista
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ════════════════ Quem trouxe a sacola? ════════════════ */}
        <Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { md: "center" },
              justifyContent: "space-between",
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Quem trouxe a sacola?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Selecione um consignante para ver os produtos dele ou cadastre uma nova sacola
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setModalNovoOpen(true)}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                px: 3,
                whiteSpace: "nowrap",
              }}
            >
              Novo consignante
            </Button>
          </Box>

          <TextField
            fullWidth
            inputRef={buscaRef}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              bgcolor: "background.paper",
              borderRadius: "10px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "divider" },
                "&:hover fieldset": { borderColor: "text.secondary" },
                "&.Mui-focused fieldset": { borderColor: "primary.main" },
              },
            }}
          />

          <Typography
            variant="body2"
            sx={{ mt: 2, mb: 1.5, color: "text.secondary", fontSize: "14px" }}
          >
            {linhas.length}{" "}
            {linhas.length === 1 ? "consignante" : "consignantes"}
          </Typography>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              maxHeight: "60vh",
              overflow: "auto",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell sx={cellHead}>CONSIGNANTE</TableCell>
                  <TableCell sx={cellHead}>TELEFONE</TableCell>
                  <TableCell sx={cellHead} align="center">SACOLAS</TableCell>
                  <TableCell sx={cellHead} align="center">EM ESTOQUE</TableCell>
                  <TableCell sx={cellHead} align="center">VENDIDAS</TableCell>
                  <TableCell sx={cellHead} align="right">PENDENTE</TableCell>
                  <TableCell sx={cellHead} align="right">AÇÕES</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <LoadingBox size={40} py={6} />
                    </TableCell>
                  </TableRow>
                ) : linhas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8, color: "text.secondary" }}>
                      <Storefront sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1">
                        Nenhum consignante encontrado
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {buscaDebounced
                          ? "Refaça a busca ou cadastre um novo consignante."
                          : 'Clique em "Novo consignante" para cadastrar'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  linhas.map((c, idx) => {
                    const r = c.resumo || {};
                    const pendente = Number(r.pendente) || 0;
                    const emEstoque = Number(r.emEstoque) || 0;
                    const vendidas = Number(r.vendidas) || 0;
                    const sacolasCount = Number(c.sacolasCount ?? r.sacolas) || 0;
                    const temPendente = pendente > 0;
                    return (
                      <TableRow
                        key={c.id}
                        hover
                        onClick={() => handleSelecionar(c.id)}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "action.hover" },
                          borderBottom: idx === linhas.length - 1 ? "none" : "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                bgcolor: getAvatarColor(c.nome),
                                width: 40,
                                height: 40,
                                fontWeight: 700,
                                fontSize: 14,
                              }}
                            >
                              {getInitials(c.nome)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "text.primary" }}
                              >
                                {c.nome}
                              </Typography>
                              {c.cpf && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: 11 }}
                                >
                                  CPF {c.cpf}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: 13 }}>
                          {c.telefone || "—"}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={sacolasCount}
                            size="small"
                            sx={{
                              bgcolor: "action.hover",
                              fontWeight: 700,
                              minWidth: 44,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={emEstoque}
                            size="small"
                            sx={{
                              bgcolor: emEstoque > 0
                                ? alpha(theme.palette.success.main, 0.18)
                                : "action.hover",
                              color: emEstoque > 0
                                ? theme.palette.success.main
                                : "text.secondary",
                              fontWeight: 700,
                              minWidth: 44,
                              border: emEstoque > 0
                                ? `1px solid ${alpha(theme.palette.success.main, 0.4)}`
                                : "none",
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "text.secondary" }}
                          >
                            {vendidas}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {temPendente ? (
                            <Typography
                              sx={{ fontWeight: 800, color: theme.palette.warning.main }}
                            >
                              {formatBRL(pendente)}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Excluir consignante">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAbrirExclusao(c);
                                }}
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
                            <Tooltip title="Abrir consignante">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelecionar(c.id);
                                }}
                                sx={{
                                  color: "text.secondary",
                                  "&:hover": {
                                    bgcolor: "action.hover",
                                    color: "primary.main",
                                  },
                                }}
                              >
                                <ArrowForward fontSize="small" />
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
        </Box>
      </Stack>

      <NovoConsignanteModal
        open={modalNovoOpen}
        onClose={() => setModalNovoOpen(false)}
        onSaved={handleNovoSalvo}
      />

      {/* ────────── Modais do fluxo de exclusão ────────── */}
      {/* Cenário A — confirmação simples (sem vínculos) */}
      <ConfirmDialog
        open={exclusao?.step === "confirm"}
        onClose={handleFecharExclusao}
        onConfirm={() => executarExclusao({ confirmed: false })}
        variant="confirm"
        destructive
        loading={!!exclusao?.loading}
        title="Excluir consignante"
        message={
          exclusao?.consignante
            ? `Deseja realmente excluir o consignante "${exclusao.consignante.nome}"?`
            : ""
        }
        confirmLabel="Excluir"
      />

      {/* Cenário B — bloqueante (HAS_SALES) */}
      <ConfirmDialog
        open={exclusao?.step === "blocked"}
        onClose={handleFecharExclusao}
        variant="blocking"
        title="Não é possível excluir"
        message={
          exclusao?.message ||
          "O consignante não pode ser excluído pois existem vendas vinculadas a ele. Exclua ou desvincule as vendas primeiro."
        }
        acknowledgeLabel="Entendi"
      />

      {/* Cenário C — confirmação com aviso (HAS_BAG_ITEMS) */}
      <ConfirmDialog
        open={exclusao?.step === "warning"}
        onClose={handleFecharExclusao}
        onConfirm={() => executarExclusao({ confirmed: true })}
        variant="warning"
        destructive
        loading={!!exclusao?.loading}
        title="Atenção"
        message={
          exclusao?.message ||
          (exclusao?.qtdPecas
            ? `Este consignante possui ${exclusao.qtdPecas} peça(s) em sacola. Ao excluir, todas as peças disponíveis também serão removidas. Deseja continuar?`
            : "Este consignante possui peças em sacola. Ao excluir, todas as peças disponíveis também serão removidas. Deseja continuar?")
        }
        confirmLabel="Excluir mesmo assim"
      />
    </Box>
  );
}

const cellHead = {
  fontWeight: 700,
  color: "text.primary",
  fontSize: "13px",
  py: 2,
  letterSpacing: 0.3,
};

function ResumoCard({ icone, corCirculo, titulo, valor, descricao }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: corCirculo,
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
          <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", lineHeight: 1.2, mt: 0.25 }}>
            {valor}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {descricao}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default Bazar;
