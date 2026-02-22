// src/pages/Compras.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
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
  Chip,
  Paper,
  InputAdornment,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { showSuccess, showError } from "../utils/notifications";
import {
  ShoppingBag,
  Add,
  Search,
  ArrowBack,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { LoadingBox } from "../components/LoadingBox";
import { comprasService } from "../api/comprasService";

const STATUS_COMPRA = {
  pendente: { label: "Pendente", color: "#d97706", bgcolor: "#fef3c7" },
  aprovada: { label: "Aprovada", color: "#16a34a", bgcolor: "#dcfce7" },
  recebida: { label: "Recebida", color: "#2563eb", bgcolor: "#eff6ff" },
  cancelada: { label: "Cancelada", color: "#dc2626", bgcolor: "#fee2e2" },
};

function Compras() {
  const [compras, setCompras] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [openValidacaoModal, setOpenValidacaoModal] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const comprasPorPagina = 10;

  const [currentCompra, setCurrentCompra] = useState({
    fornecedor: "",
    dataPedido: new Date().toISOString().split("T")[0],
    dataEntregaPrevista: "",
    valorTotal: "",
    status: "pendente",
    observacoes: "",
  });

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
  };

  const comprasFiltradas = compras.filter(
    (c) =>
      c.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const totalPaginas = Math.max(1, Math.ceil(comprasFiltradas.length / comprasPorPagina));
  const indiceInicial = (paginaAtual - 1) * comprasPorPagina;
  const indiceFinal = indiceInicial + comprasPorPagina;
  const comprasPaginadas = comprasFiltradas.slice(indiceInicial, indiceFinal);

  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  const fetchCompras = async () => {
    setCarregando(true);
    try {
      const data = await comprasService.getAll();
      const lista = Array.isArray(data) ? data : data?.compras ?? [];
      setCompras(lista);
    } catch {
      setCompras([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const handleOpenDialog = () => {
    setCurrentCompra({
      fornecedor: "",
      dataPedido: new Date().toISOString().split("T")[0],
      dataEntregaPrevista: "",
      valorTotal: "",
      status: "pendente",
      observacoes: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentCompra({ ...currentCompra, [name]: value });
  };

  const handleSave = async () => {
    const faltando = [];
    if (!currentCompra.fornecedor?.trim()) faltando.push("Fornecedor");
    if (!currentCompra.valorTotal?.toString().trim()) faltando.push("Valor Total");

    if (faltando.length > 0) {
      setMensagemValidacao("Faltam: " + faltando.join(", ") + ".");
      setOpenValidacaoModal(true);
      return;
    }

    try {
      await comprasService.create({
        ...currentCompra,
        valorTotal: parseFloat(currentCompra.valorTotal),
      });
      showSuccess("Compra cadastrada com sucesso!");
      fetchCompras();
      handleCloseDialog();
    } catch {
      showError("Erro ao cadastrar compra. Tente novamente.");
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "background.default",
        minHeight: "100vh",
        color: "text.primary",
        ...(openDialog
          ? { display: "flex", flexDirection: "column", overflow: "hidden" }
          : {}),
      }}
    >
      {!openDialog ? (
        <>
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
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  Compras
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", mt: 1 }}
                >
                  Gestão de pedidos de compra
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenDialog}
                sx={{ textTransform: "none", borderRadius: "8px", px: 3 }}
              >
                Nova Compra
              </Button>
            </Box>

            <TextField
              fullWidth
              placeholder="Buscar por fornecedor ou observações..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPaginaAtual(1);
              }}
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
                  "&.Mui-focused fieldset": {
                    borderWidth: "1px",
                    borderColor: "primary.main",
                  },
                },
              }}
            />

            <Typography
              variant="body2"
              sx={{ mt: 2, color: "text.secondary", fontSize: "14px" }}
            >
              {comprasFiltradas.length}{" "}
              {comprasFiltradas.length === 1 ? "compra" : "compras"}
            </Typography>
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
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
                    FORNECEDOR
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                  >
                    DATA PEDIDO
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                  >
                    VALOR
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
                  >
                    STATUS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <LoadingBox size={40} py={8} />
                    </TableCell>
                  </TableRow>
                ) : comprasPaginadas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      align="center"
                      sx={{ py: 8, color: "text.secondary" }}
                    >
                      <ShoppingBag sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1">
                        Nenhuma compra encontrada
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Clique em "Nova Compra" para começar
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  comprasPaginadas.map((compra, index) => {
                    const status = STATUS_COMPRA[compra.status] || STATUS_COMPRA.pendente;
                    return (
                      <TableRow
                        key={compra.id}
                        sx={{
                          "&:hover": { bgcolor: "action.hover" },
                          borderBottom:
                            index === comprasPaginadas.length - 1
                              ? "none"
                              : "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <TableCell
                          sx={{ py: 2.5, fontWeight: 500, color: "text.primary" }}
                        >
                          {compra.fornecedor}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "14px" }}>
                          {compra.dataPedido
                            ? new Date(compra.dataPedido).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 500, fontSize: "14px", color: "text.primary" }}
                        >
                          R${" "}
                          {(compra.valorTotal || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
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
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {comprasFiltradas.length > 0 && (
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
                  {Math.min(indiceFinal, comprasFiltradas.length)} de{" "}
                  {comprasFiltradas.length}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    onClick={irParaPrimeiraPagina}
                    disabled={paginaAtual === 1}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <FirstPage fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={irParaPaginaAnterior}
                    disabled={paginaAtual === 1}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <ChevronLeft fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={irParaProximaPagina}
                    disabled={paginaAtual === totalPaginas}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <ChevronRight fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={irParaUltimaPagina}
                    disabled={paginaAtual === totalPaginas}
                    size="small"
                    sx={{
                      color: "text.secondary",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <LastPage fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}
          </TableContainer>
        </>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexShrink: 0 }}>
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
              Nova Compra
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            sx={{ flex: 1, overflow: "auto", pr: 1 }}
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
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <ShoppingBag fontSize="small" /> Dados da Compra
              </Typography>

              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Fornecedor"
                    name="fornecedor"
                    value={currentCompra.fornecedor}
                    onChange={handleChange}
                    placeholder="Nome do fornecedor"
                    size="small"
                    sx={requiredFieldSx}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data do Pedido"
                    name="dataPedido"
                    type="date"
                    value={currentCompra.dataPedido}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data Entrega Prevista"
                    name="dataEntregaPrevista"
                    type="date"
                    value={currentCompra.dataEntregaPrevista}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Valor Total"
                    name="valorTotal"
                    type="number"
                    value={currentCompra.valorTotal}
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
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={selectFieldSx}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={currentCompra.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      {Object.entries(STATUS_COMPRA).map(([key, val]) => (
                        <MenuItem key={key} value={key}>
                          {val.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observações"
                    name="observacoes"
                    multiline
                    rows={3}
                    value={currentCompra.observacoes}
                    onChange={handleChange}
                    placeholder="Informações adicionais..."
                    size="small"
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 2,
                  mt: 2,
                  pb: 2,
                  flexShrink: 0,
                }}
              >
                <Button
                  type="button"
                  onClick={handleCloseDialog}
                  sx={{ textTransform: "none", color: "text.secondary" }}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" sx={{ textTransform: "none", px: 4 }}>
                  Salvar Compra
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      )}

      <Dialog
        open={openValidacaoModal}
        onClose={() => setOpenValidacaoModal(false)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Campos obrigatórios</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.primary", fontSize: "14px" }}>
            {mensagemValidacao}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenValidacaoModal(false)}
            sx={{ textTransform: "none", minWidth: 100 }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Compras;
