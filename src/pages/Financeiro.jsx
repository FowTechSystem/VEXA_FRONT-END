import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tabs,
  Tab,
  useTheme,
} from "@mui/material";
import {
  resolverTipoMovimentacaoLinha,
  valorMovimentacaoAssinado,
} from "../utils/movimentacaoCaixa";
import { useInAppNotifications } from "../contexts/InAppNotificationContext";
import { caixaService } from "../api/caixaService";
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Add,
  Edit,
  Delete,
  ArrowBack,
  Receipt,
  AccountBalance,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
  Refresh,
  Lock,
} from "@mui/icons-material";

function getMonthBounds(mesAno) {
  // mesAno = "YYYY-MM"
  const [ano, mes] = mesAno.split("-").map(Number);
  const primeiro = new Date(ano, mes - 1, 1);
  const ultimo = new Date(ano, mes, 0);
  return {
    dataInicio: primeiro.toISOString().split("T")[0],
    dataFim: ultimo.toISOString().split("T")[0],
  };
}

const TIPOS_MOVIMENTACAO = {
  receita: { label: "Receita", chipColor: "success" },
  despesa: { label: "Despesa", chipColor: "error" },
};

const CATEGORIAS_RECEITA = [
  "Vendas",
  "Prestação de Serviços",
  "Recebimento de Cliente",
  "Outras Receitas",
];

const CATEGORIAS_DESPESA = [
  "Fornecedores",
  "Salários",
  "Aluguel",
  "Energia",
  "Internet",
  "Marketing",
  "Impostos",
  "Outras Despesas",
];

function Financeiro() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const { sincronizarMovimentacoesDoCaixa } = useInAppNotifications();
  const [tabAtual, setTabAtual] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openValidacaoModal, setOpenValidacaoModal] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [movimentacoes, setMovimentacoes] = useState([]); // manuais (receita/despesa)
  const [movimentacoesSistema, setMovimentacoesSistema] = useState([]); // da API (vendas, compras, etc.)
  const [carregandoMovimentacoes, setCarregandoMovimentacoes] = useState(true);
  const [mesAno, setMesAno] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const movimentacoesPorPagina = 10;

  const { dataInicio, dataFim } = getMonthBounds(mesAno);

  const carregarMovimentacoesSistema = () => {
    setCarregandoMovimentacoes(true);
    caixaService
      .getResumo(dataInicio, dataFim)
      .then((data) => {
        const mov = data?.movimentacoes ?? data?.Movimentacoes ?? [];
        const list = Array.isArray(mov) ? mov : [];
        const normalizadas = list.map((m) => {
          const tipoUi = resolverTipoMovimentacaoLinha(m);
          const valorNum = Number(m.valor ?? m.Valor ?? m.valorTotal ?? 0) || 0;
          const dataStr = m.data ?? m.Data ?? m.dataVenda ?? m.dataPedido ?? m.createdAt ?? "";
          const tipo =
            tipoUi === "compra" || tipoUi === "saida" ? "despesa" : "receita";
          const categoria =
            tipoUi === "compra"
              ? "Compras"
              : tipoUi === "venda"
                ? "Vendas"
                : tipoUi === "entrada"
                  ? "Lucro manual"
                  : "Despesa manual";
          return {
            id: m.id ?? m.Id ?? `sistema-${tipoUi}-${Math.random()}`,
            tipo,
            descricao:
              m.descricao ??
              m.Descricao ??
              (tipoUi === "compra"
                ? "Compra"
                : tipoUi === "saida"
                  ? "Saída"
                  : tipoUi === "entrada"
                    ? "Entrada"
                    : "Venda"),
            categoria,
            data: dataStr ? dataStr.toString().split("T")[0] : dataStr,
            valor: valorMovimentacaoAssinado(tipoUi, valorNum),
            origem: "sistema",
          };
        });
        setMovimentacoesSistema(normalizadas);
        sincronizarMovimentacoesDoCaixa(list);
      })
      .catch((err) => {
        console.error("Erro ao carregar movimentações do sistema:", err);
        setMovimentacoesSistema([]);
      })
      .finally(() => setCarregandoMovimentacoes(false));
  };

  useEffect(() => {
    carregarMovimentacoesSistema();
  }, [dataInicio, dataFim]);

  const [currentMovimentacao, setCurrentMovimentacao] = useState({
    tipo: "receita",
    descricao: "",
    valor: "",
    categoria: "",
    data: new Date().toISOString().split("T")[0],
    observacoes: "",
  });

  const handleOpenDialog = () => {
    setCurrentMovimentacao({
      tipo: "receita",
      descricao: "",
      valor: "",
      categoria: "",
      data: new Date().toISOString().split("T")[0],
      observacoes: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentMovimentacao({
      ...currentMovimentacao,
      [name]: value,
    });
  };

  const selectFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1.5,
      bgcolor: "background.paper",
      "& fieldset": { borderColor: "divider" },
      "&:hover fieldset": { borderColor: "text.secondary" },
      "&.Mui-focused fieldset": { borderWidth: 1, borderColor: "primary.main" },
    },
    "& .MuiInputLabel-root": { color: "text.secondary" },
    "& .MuiSelect-select": { py: 1.25, fontSize: "0.875rem" },
  };

  const handleSave = () => {
    const faltando = [];
    if (!currentMovimentacao.descricao?.trim()) faltando.push("Descrição");
    if (!currentMovimentacao.valor) faltando.push("Valor");
    if (!currentMovimentacao.data?.trim()) faltando.push("Data");
    if (!currentMovimentacao.categoria?.trim()) faltando.push("Categoria");
    if (faltando.length > 0) {
      setMensagemValidacao("Faltam: " + faltando.join(", ") + ".");
      setOpenValidacaoModal(true);
      return;
    }

    const novaMovimentacao = {
      ...currentMovimentacao,
      id: Date.now(),
      valor: parseFloat(currentMovimentacao.valor),
    };

    setMovimentacoes([novaMovimentacao, ...movimentacoes]);
    setPaginaAtual(1); // Volta para a primeira página
    handleCloseDialog();
  };

  const handleDelete = (id) => {
    if (window.confirm("Deseja realmente excluir esta movimentação?")) {
      setMovimentacoes(movimentacoes.filter((m) => m.id !== id));
      setPaginaAtual(1);
    }
  };

  // Movimentações manuais do mês selecionado
  const movimentacoesManuaisDoMes = movimentacoes.filter((m) => {
    const d = (m.data || "").toString().split("T")[0];
    return d.startsWith(mesAno);
  });

  // Lista unificada: sistema + manuais do mês, ordenada por data (mais recente primeiro)
  const todasMovimentacoesDoMes = [
    ...movimentacoesSistema,
    ...movimentacoesManuaisDoMes,
  ].sort((a, b) => {
    const da = (a.data || "").toString();
    const db = (b.data || "").toString();
    return db.localeCompare(da);
  });

  const calcularTotais = () => {
    const receitas = todasMovimentacoesDoMes
      .filter((m) => m.tipo === "receita")
      .reduce((acc, m) => acc + (m.valor > 0 ? m.valor : Math.abs(m.valor)), 0);

    const despesas = todasMovimentacoesDoMes
      .filter((m) => m.tipo === "despesa")
      .reduce((acc, m) => acc + Math.abs(m.valor), 0);

    return {
      receitas,
      despesas,
      saldo: receitas - despesas,
    };
  };

  const totais = calcularTotais();

  const movimentacoesFiltradas =
    tabAtual === 0
      ? todasMovimentacoesDoMes
      : tabAtual === 1
        ? todasMovimentacoesDoMes.filter((m) => m.tipo === "receita")
        : todasMovimentacoesDoMes.filter((m) => m.tipo === "despesa");

  // Cálculos de paginação
  const totalPaginas = Math.ceil(
    movimentacoesFiltradas.length / movimentacoesPorPagina,
  );
  const indiceInicial = (paginaAtual - 1) * movimentacoesPorPagina;
  const indiceFinal = indiceInicial + movimentacoesPorPagina;
  const movimentacoesPaginadas = movimentacoesFiltradas.slice(
    indiceInicial,
    indiceFinal,
  );

  // Funções de navegação de página
  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  const handleTabChange = (e, newValue) => {
    setTabAtual(newValue);
    setPaginaAtual(1); // Volta para a primeira página ao mudar de aba
  };

  return (
    <Box
      sx={{
        position: "relative",
        p: 3,
        bgcolor: "background.default",
        minHeight: "100vh",
        color: "text.primary",
        ...(openDialog ? { display: "flex", flexDirection: "column", overflow: "hidden" } : {}),
      }}
    >
      {!openDialog ? (
        <>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
              Financeiro
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
              Todas as movimentações do sistema por mês
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Mês"
              type="month"
              value={mesAno}
              onChange={(e) => {
                setMesAno(e.target.value);
                setPaginaAtual(1);
              }}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={carregarMovimentacoesSistema}
              disabled={carregandoMovimentacoes}
              sx={{ textTransform: "none" }}
            >
              Atualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
              sx={{
                textTransform: "none",
                borderRadius: "8px",
                px: 3,
                boxShadow: "none",
              }}
            >
              Nova Movimentação
            </Button>
          </Box>
        </Box>

        {/* Cards de resumo */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                borderLeft: "4px solid",
                borderLeftColor: "success.main",
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TrendingUp sx={{ color: "success.main", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Receitas
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "success.main" }}
              >
                {carregandoMovimentacoes ? "..." : `R$ ${totais.receitas.toFixed(2)}`}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                borderLeft: "4px solid",
                borderLeftColor: "error.main",
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TrendingDown sx={{ color: "error.main", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Despesas
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "error.main" }}
              >
                {carregandoMovimentacoes ? "..." : `R$ ${totais.despesas.toFixed(2)}`}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
                borderLeft: "4px solid",
                borderLeftColor: totais.saldo >= 0 ? "primary.main" : "warning.main",
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AccountBalance
                  sx={{
                    color: totais.saldo >= 0 ? "primary.main" : "warning.main",
                    mr: 1,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary" }}
                >
                  Saldo
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color:
                    totais.saldo >= 0
                      ? isLight
                        ? "text.primary"
                        : "primary.main"
                      : "warning.main",
                }}
              >
                {carregandoMovimentacoes ? "..." : `R$ ${totais.saldo.toFixed(2)}`}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs e Tabela */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
                borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: "1px solid",
          borderColor: "divider" }}>
          <Tabs
            value={tabAtual}
            onChange={handleTabChange}
            sx={{
              px: 3,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                color: "text.secondary",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
                height: 3,
              },
            }}
          >
            <Tab label="Todas" />
            <Tab label="Receitas" />
            <Tab label="Despesas" />
          </Tabs>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: "text.primary",
                    fontSize: "13px",
                    py: 2,
                  }}
                >
                  DATA
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  TIPO
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  DESCRIÇÃO
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  CATEGORIA
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  VALOR
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  AÇÕES
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carregandoMovimentacoes ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 8, color: "text.secondary" }}
                  >
                    <Typography variant="body1">Carregando movimentações do mês...</Typography>
                  </TableCell>
                </TableRow>
              ) : movimentacoesPaginadas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 8, color: "text.secondary" }}
                  >
                    <AttachMoney sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1">
                      Nenhuma movimentação neste mês
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Selecione outro mês ou adicione uma movimentação manual
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                movimentacoesPaginadas.map((mov, index) => {
                  const tipo = TIPOS_MOVIMENTACAO[mov.tipo];
                  return (
                    <TableRow
                      key={mov.id}
                      sx={{
                        "&:hover": { bgcolor: "action.hover" },
                        borderBottom:
                          index === movimentacoesPaginadas.length - 1
                            ? "none"
                            : "1px solid",
                      borderColor: "divider",
                      }}
                    >
                      <TableCell
                        sx={{ py: 2.5, color: "text.secondary", fontSize: "14px" }}
                      >
                        {new Date(mov.data).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tipo.label}
                          size="small"
                          color={tipo.chipColor}
                          variant="filled"
                          sx={{ fontWeight: 600, fontSize: "12px" }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "#111827",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        {mov.descricao}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "14px" }}>
                        {mov.categoria}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 600,
                          fontSize: "14px",
                          color: mov.tipo === "receita" ? "success.dark" : "error.dark",
                        }}
                      >
                        {mov.tipo === "receita" ? "+" : "-"} R${" "}
                        {Math.abs(Number(mov.valor) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {mov.origem !== "sistema" && (
                          <>
                            <IconButton
                              size="small"
                              sx={{
                                color: "text.secondary",
                                "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(mov.id)}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { bgcolor: "#fef2f2", color: "error.main" },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Controles de Paginação */}
        {movimentacoesFiltradas.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 3,
              py: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", fontSize: "14px" }}
            >
              Mostrando {indiceInicial + 1} a{" "}
              {Math.min(indiceFinal, movimentacoesFiltradas.length)} de{" "}
              {movimentacoesFiltradas.length}{" "}
              {movimentacoesFiltradas.length === 1
                ? "movimentação"
                : "movimentações"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Botão Primeira Página */}
              <IconButton
                onClick={irParaPrimeiraPagina}
                disabled={paginaAtual === 1}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <FirstPage fontSize="small" />
              </IconButton>

              {/* Botão Página Anterior */}
              <IconButton
                onClick={irParaPaginaAnterior}
                disabled={paginaAtual === 1}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>

              {/* Números de Página */}
              <Box sx={{ display: "flex", gap: 0.5, mx: 1 }}>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (numeroPagina) => {
                    // Mostra apenas páginas próximas à atual
                    if (
                      numeroPagina === 1 ||
                      numeroPagina === totalPaginas ||
                      (numeroPagina >= paginaAtual - 1 &&
                        numeroPagina <= paginaAtual + 1)
                    ) {
                      return (
                        <Button
                          key={numeroPagina}
                          onClick={() => setPaginaAtual(numeroPagina)}
                          size="small"
                          sx={{
                            minWidth: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            color:
                              paginaAtual === numeroPagina ? "primary.contrastText" : "text.secondary",
                            bgcolor:
                              paginaAtual === numeroPagina
                                ? "primary.main"
                                : "transparent",
                            "&:hover": {
                              bgcolor:
                                paginaAtual === numeroPagina
                                  ? "primary.dark"
                                  : "action.hover",
                            },
                          }}
                        >
                          {numeroPagina}
                        </Button>
                      );
                    } else if (
                      numeroPagina === paginaAtual - 2 ||
                      numeroPagina === paginaAtual + 2
                    ) {
                      return (
                        <Typography
                          key={numeroPagina}
                          sx={{ px: 1, color: "text.secondary" }}
                        >
                          ...
                        </Typography>
                      );
                    }
                    return null;
                  },
                )}
              </Box>

              {/* Botão Próxima Página */}
              <IconButton
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>

              {/* Botão Última Página */}
              <IconButton
                onClick={irParaUltimaPagina}
                disabled={paginaAtual === totalPaginas}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <LastPage fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}
      </Paper>
        </>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexShrink: 0 }}>
            <Button startIcon={<ArrowBack />} onClick={handleCloseDialog} sx={{ textTransform: "none", color: "text.secondary" }}>Voltar</Button>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>Nova Movimentação Financeira</Typography>
          </Box>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} sx={{ flex: 1, overflow: "auto", pr: 1 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", maxWidth: 640 }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <FormControl fullWidth required size="small" sx={selectFieldSx}>
                    <InputLabel id="tipo-label">Tipo</InputLabel>
                    <Select name="tipo" value={currentMovimentacao.tipo} onChange={handleChange} label="Tipo" labelId="tipo-label">
                      <MenuItem value="receita">Receita</MenuItem>
                      <MenuItem value="despesa">Despesa</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Descrição" name="descricao" value={currentMovimentacao.descricao} onChange={handleChange} placeholder="Ex: Venda de produtos, Pagamento de fornecedor" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required label="Valor" name="valor" type="number" value={currentMovimentacao.valor} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }} inputProps={{ step: "0.01", min: "0" }} size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required label="Data" name="data" type="date" value={currentMovimentacao.data} onChange={handleChange} InputLabelProps={{ shrink: true }} size="small" />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required size="small" sx={selectFieldSx}>
                    <InputLabel id="categoria-label">Categoria</InputLabel>
                    <Select name="categoria" value={currentMovimentacao.categoria} onChange={handleChange} label="Categoria" labelId="categoria-label">
                      {(currentMovimentacao.tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Observações" name="observacoes" multiline rows={3} value={currentMovimentacao.observacoes} onChange={handleChange} placeholder="Informações adicionais..." size="small" />
                </Grid>
              </Grid>
            </Paper>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2, pb: 2 }}>
              <Button onClick={handleCloseDialog} sx={{ textTransform: "none", color: "text.secondary" }}>Cancelar</Button>
              <Button type="submit" variant="contained" sx={{ textTransform: "none", px: 4 }}>Salvar Movimentação</Button>
            </Box>
          </Box>
        </Box>
      )}

      <Dialog open={openValidacaoModal} onClose={() => setOpenValidacaoModal(false)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpenValidacaoModal(false); } }} PaperProps={{ sx: { borderRadius: 2, minWidth: 360 } }} aria-labelledby="validacao-dialog-title">
        <DialogTitle id="validacao-dialog-title" sx={{ fontWeight: 600 }}>Campos obrigatórios</DialogTitle>
        <DialogContent><Typography variant="body2" sx={{ color: "text.primary", fontSize: "14px" }}>{mensagemValidacao}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button variant="contained" autoFocus onClick={() => setOpenValidacaoModal(false)} sx={{ textTransform: "none", minWidth: 100 }}>OK</Button></DialogActions>
      </Dialog>

      {/* Igual ao Fiscal: fundo borrado + mensagem de bloqueio */}
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
            Função em processo de integração
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Contate o suporte para maiores detalhes.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

export default Financeiro;
