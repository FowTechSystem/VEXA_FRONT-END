import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { showError, showInfo, showSuccess } from "../utils/notifications";
import {
  Receipt,
  Add,
  Cancel,
  CheckCircle,
  Send,
  Print,
  Description,
  Search,
  ArrowBack,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

const TIPOS_NOTA = {
  nfce: { label: "NFC-e", color: "primary.main" },
  nfe: { label: "NF-e", color: "#16a34a" },
  nfse: { label: "NFS-e", color: "#9333ea" },
};

const STATUS_NOTA = {
  autorizada: {
    label: "Autorizada",
    color: "#16a34a",
    bgcolor: "#dcfce7",
  },
  cancelada: {
    label: "Cancelada",
    color: "#dc2626",
    bgcolor: "#fee2e2",
  },
  processando: {
    label: "Processando",
    color: "primary.main",
    bgcolor: "#eff6ff",
  },
};

function Fiscal() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openValidacaoModal, setOpenValidacaoModal] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const requiredFieldSx = (theme) => ({
    "& .MuiOutlinedInput-root": {
      bgcolor: alpha(theme.palette.warning.main, 0.08),
      "&.Mui-focused": { bgcolor: theme.palette.background.paper },
      "&:hover:not(.Mui-focused)": {
        bgcolor: alpha(theme.palette.warning.main, 0.12),
      },
    },
  });
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

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const notasPorPagina = 10;

  const [notas, setNotas] = useState([
    {
      id: 1,
      numero: "000001",
      serie: "1",
      tipo: "nfce",
      cliente: "Cliente Exemplo",
      dataEmissao: "2026-01-15",
      valor: 150.0,
      status: "autorizada",
      chaveAcesso: "12345678901234567890123456789012345678901234",
    },
  ]);

  const [currentNota, setCurrentNota] = useState({
    tipo: "nfce",
    numero: "",
    serie: "1",
    cliente: "",
    cpfCnpj: "",
    valor: "",
    observacoes: "",
  });

  // Filtrar notas
  const notasFiltradas = notas.filter(
    (n) =>
      n.numero.includes(searchTerm) ||
      n.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.chaveAcesso.includes(searchTerm),
  );

  // Cálculos de paginação
  const totalPaginas = Math.ceil(notasFiltradas.length / notasPorPagina);
  const indiceInicial = (paginaAtual - 1) * notasPorPagina;
  const indiceFinal = indiceInicial + notasPorPagina;
  const notasPaginadas = notasFiltradas.slice(indiceInicial, indiceFinal);

  // Funções de navegação de página
  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  const handleOpenDialog = () => {
    setCurrentNota({
      tipo: "nfce",
      numero: String(notas.length + 1).padStart(6, "0"),
      serie: "1",
      cliente: "",
      cpfCnpj: "",
      valor: "",
      observacoes: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentNota({
      ...currentNota,
      [name]: value,
    });
  };

  const handleEmitirNota = () => {
    const faltando = [];
    if (!currentNota.cliente?.trim()) faltando.push("Cliente");
    if (!currentNota.valor?.toString().trim()) faltando.push("Valor Total");

    if (faltando.length > 0) {
      setMensagemValidacao("Faltam: " + faltando.join(", ") + ".");
      setOpenValidacaoModal(true);
      return;
    }

    const novaNota = {
      id: Date.now(),
      ...currentNota,
      valor: parseFloat(currentNota.valor),
      dataEmissao: new Date().toISOString().split("T")[0],
      status: "processando",
      chaveAcesso: Math.random().toString(36).substring(2, 46).toUpperCase(),
    };

    setNotas([novaNota, ...notas]);

    setTimeout(() => {
      setNotas((prev) =>
        prev.map((n) =>
          n.id === novaNota.id ? { ...n, status: "autorizada" } : n,
        ),
      );
    }, 2000);

    showSuccess("Nota fiscal emitida com sucesso!");
    setPaginaAtual(1);
    handleCloseDialog();
  };

  const handleCancelarNota = (notaId) => {
    if (window.confirm("Deseja realmente cancelar esta nota fiscal?")) {
      setNotas(
        notas.map((n) => (n.id === notaId ? { ...n, status: "cancelada" } : n)),
      );
    }
  };

  const handleDownloadXML = (nota) => {
    showInfo(`Download XML da nota ${nota.numero}`);
  };

  const handleDownloadPDF = (nota) => {
    showInfo(`Download PDF da nota ${nota.numero}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPaginaAtual(1); // Volta para a primeira página ao buscar
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh", color: "text.primary", ...(openDialog ? { display: "flex", flexDirection: "column", overflow: "hidden" } : {}) }}>
      {!openDialog ? (
        <>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
              Fiscal
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
              Gestão de documentos fiscais
            </Typography>
          </Box>
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
            Emitir Nota
          </Button>
        </Box>

        {/* Cards de resumo */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Receipt sx={{ color: "primary.main", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Total de Notas
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {notas.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CheckCircle sx={{ color: "#16a34a", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Autorizadas
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {notas.filter((n) => n.status === "autorizada").length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Send sx={{ color: "primary.main", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Processando
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {notas.filter((n) => n.status === "processando").length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Valor Total
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "#16a34a" }}
              >
                R${" "}
                {notas
                  .filter((n) => n.status === "autorizada")
                  .reduce((acc, n) => acc + n.valor, 0)
                  .toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Busca */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
                borderColor: "divider",
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por número, cliente ou chave de acesso..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "divider" },
                "&:hover fieldset": { borderColor: "divider" },
                "&.Mui-focused fieldset": { borderWidth: "1px", borderColor: "primary.main" },
              },
            }}
          />
        </Box>
      </Paper>

      {/* Tabela de Notas */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
                borderColor: "divider",
          overflow: "hidden",
        }}
      >
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
                  NÚMERO
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  TIPO
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  CLIENTE
                </TableCell>
                <TableCell
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  DATA EMISSÃO
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  VALOR
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                >
                  STATUS
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
              {notasPaginadas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 8, color: "text.secondary" }}
                  >
                    <Receipt sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1">
                      Nenhuma nota fiscal encontrada
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Clique em "Emitir Nota" para começar
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                notasPaginadas.map((nota, index) => {
                  const tipo = TIPOS_NOTA[nota.tipo];
                  const status = STATUS_NOTA[nota.status];
                  return (
                    <TableRow
                      key={nota.id}
                      sx={{
                        "&:hover": { bgcolor: "action.hover" },
                        borderBottom:
                          index === notasPaginadas.length - 1
                            ? "none"
                            : "1px solid",
                            borderColor: "divider",
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {nota.numero} / {nota.serie}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", fontFamily: "monospace" }}
                        >
                          {nota.chaveAcesso.substring(0, 20)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={tipo.label}
                          size="small"
                          sx={{
                            bgcolor: `${tipo.color}20`,
                            color: tipo.color,
                            fontWeight: 500,
                            fontSize: "12px",
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "14px" }}>
                        {nota.cliente}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "14px" }}>
                        {new Date(nota.dataEmissao).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 500, fontSize: "14px" }}
                      >
                        R$ {nota.valor.toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{
                            bgcolor: status.bgcolor,
                            color: status.color,
                            fontWeight: 500,
                            fontSize: "12px",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadXML(nota)}
                          title="Download XML"
                          sx={{
                            color: "text.secondary",
                            "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                          }}
                        >
                          <Description fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadPDF(nota)}
                          title="Download PDF"
                          sx={{
                            color: "text.secondary",
                            "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                          }}
                        >
                          <Print fontSize="small" />
                        </IconButton>
                        {nota.status === "autorizada" && (
                          <IconButton
                            size="small"
                            onClick={() => handleCancelarNota(nota.id)}
                            title="Cancelar Nota"
                            sx={{
                              color: "text.secondary",
                              "&:hover": {
                                bgcolor: "#fef2f2",
                                color: "#dc2626",
                              },
                            }}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
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
        {notasFiltradas.length > 0 && (
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
              {Math.min(indiceFinal, notasFiltradas.length)} de{" "}
              {notasFiltradas.length}{" "}
              {notasFiltradas.length === 1 ? "nota" : "notas"}
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
        /* Tela inteira: formulário de emissão */
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
              flexShrink: 0,
            }}
          >
            <Button
              startIcon={<ArrowBack />}
              onClick={handleCloseDialog}
              sx={{
                textTransform: "none",
                color: "text.secondary",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              Voltar
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
              Emitir Nota Fiscal
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={(e) => { e.preventDefault(); handleEmitirNota(); }}
            sx={{
              flex: 1,
              overflow: "auto",
              pr: 1,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Receipt fontSize="small" /> Dados da Nota
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth size="small" sx={selectFieldSx}>
                    <InputLabel>Tipo de Nota</InputLabel>
                    <Select
                      name="tipo"
                      value={currentNota.tipo}
                      onChange={handleChange}
                      label="Tipo de Nota"
                    >
                      {Object.entries(TIPOS_NOTA).map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                          {value.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6} md={4}>
                  <TextField
                    fullWidth
                    label="Número"
                    name="numero"
                    value={currentNota.numero}
                    onChange={handleChange}
                    InputProps={{ readOnly: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={6} md={4}>
                  <TextField
                    fullWidth
                    label="Série"
                    name="serie"
                    value={currentNota.serie}
                    onChange={handleChange}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    required
                    label="Cliente"
                    name="cliente"
                    value={currentNota.cliente}
                    onChange={handleChange}
                    placeholder="Nome do cliente"
                    size="small"
                    sx={requiredFieldSx}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="CPF/CNPJ"
                    name="cpfCnpj"
                    value={currentNota.cpfCnpj}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    size="small"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Valor Total"
                    name="valor"
                    type="number"
                    value={currentNota.valor}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">R$</InputAdornment>
                      ),
                    }}
                    inputProps={{ step: "0.01", min: "0" }}
                    size="small"
                    sx={requiredFieldSx}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observações"
                    name="observacoes"
                    multiline
                    rows={3}
                    value={currentNota.observacoes}
                    onChange={handleChange}
                    placeholder="Informações adicionais..."
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2, pb: 2, flexShrink: 0 }}>
                <Button
                  type="button"
                  onClick={handleCloseDialog}
                  sx={{ textTransform: "none", color: "text.secondary" }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" sx={{ textTransform: "none", px: 4 }}>
                  Emitir Nota Fiscal
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Modal: campos obrigatórios faltando */}
      <Dialog
        open={openValidacaoModal}
        onClose={() => setOpenValidacaoModal(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setOpenValidacaoModal(false);
          }
        }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 360 } }}
        aria-labelledby="validacao-dialog-title"
      >
        <DialogTitle id="validacao-dialog-title" sx={{ fontWeight: 600 }}>
          Campos obrigatórios
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.primary", fontSize: "14px" }}>
            {mensagemValidacao}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenValidacaoModal(false)}
            onKeyDown={(e) => e.key === "Enter" && setOpenValidacaoModal(false)}
            sx={{ textTransform: "none", minWidth: 100 }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Fiscal;
