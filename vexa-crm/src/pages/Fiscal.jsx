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
  Alert,
} from "@mui/material";
import {
  Receipt,
  Add,
  Cancel,
  CheckCircle,
  Send,
  Print,
  Description,
  Close,
  Search,
} from "@mui/icons-material";

const TIPOS_NOTA = {
  nfce: { label: "NFC-e", color: "#2563eb" },
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
    color: "#2563eb",
    bgcolor: "#eff6ff",
  },
};

function Fiscal() {
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
    if (!currentNota.cliente || !currentNota.valor) {
      alert("Preencha todos os campos obrigatórios");
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
          n.id === novaNota.id ? { ...n, status: "autorizada" } : n
        )
      );
    }, 2000);

    handleCloseDialog();
  };

  const handleCancelarNota = (notaId) => {
    if (window.confirm("Deseja realmente cancelar esta nota fiscal?")) {
      setNotas(
        notas.map((n) => (n.id === notaId ? { ...n, status: "cancelada" } : n))
      );
    }
  };

  const handleDownloadXML = (nota) => {
    alert(`Download XML da nota ${nota.numero}`);
  };

  const handleDownloadPDF = (nota) => {
    alert(`Download PDF da nota ${nota.numero}`);
  };

  const notasFiltradas = notas.filter(
    (n) =>
      n.numero.includes(searchTerm) ||
      n.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.chaveAcesso.includes(searchTerm)
  );

  return (
    <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
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
            <Typography variant="h4" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
              Fiscal
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 1 }}>
              Gestão de documentos fiscais
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
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
                border: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Receipt sx={{ color: "#2563eb", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
                border: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CheckCircle sx={{ color: "#16a34a", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
                border: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Send sx={{ color: "#2563eb", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
                border: "1px solid #e5e7eb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
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
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box sx={{ p: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por número, cliente ou chave de acesso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#9ca3af" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "& fieldset": { border: "1px solid #e5e7eb" },
                "&:hover fieldset": { border: "1px solid #d1d5db" },
                "&.Mui-focused fieldset": { border: "1px solid #2563eb" },
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
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f9fafb" }}>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  NÚMERO
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  TIPO
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  CLIENTE
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  DATA EMISSÃO
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#374151" }}
                >
                  VALOR
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 600, color: "#374151" }}
                >
                  STATUS
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 600, color: "#374151" }}
                >
                  AÇÕES
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 8, color: "#9ca3af" }}
                  >
                    <Receipt sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body1">
                      Nenhuma nota fiscal encontrada
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                notasFiltradas.map((nota) => {
                  const tipo = TIPOS_NOTA[nota.tipo];
                  const status = STATUS_NOTA[nota.status];
                  return (
                    <TableRow
                      key={nota.id}
                      sx={{ "&:hover": { bgcolor: "#f9fafb" } }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {nota.numero} / {nota.serie}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#6b7280", fontFamily: "monospace" }}
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
                          }}
                        />
                      </TableCell>
                      <TableCell>{nota.cliente}</TableCell>
                      <TableCell>
                        {new Date(nota.dataEmissao).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
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
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadXML(nota)}
                          title="Download XML"
                        >
                          <Description fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadPDF(nota)}
                          title="Download PDF"
                        >
                          <Print fontSize="small" />
                        </IconButton>
                        {nota.status === "autorizada" && (
                          <IconButton
                            size="small"
                            onClick={() => handleCancelarNota(nota.id)}
                            sx={{ color: "#dc2626" }}
                            title="Cancelar Nota"
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
      </Paper>

      {/* Dialog de Emissão */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "12px" },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Emitir Nota Fiscal
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Preencha os dados para emitir a nota fiscal
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
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
                required
                label="Número"
                name="numero"
                value={currentNota.numero}
                onChange={handleChange}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            <Grid item xs={6} md={4}>
              <TextField
                fullWidth
                required
                label="Série"
                name="serie"
                value={currentNota.serie}
                onChange={handleChange}
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
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: "1px solid #e5e7eb" }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ textTransform: "none", color: "#6b7280" }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleEmitirNota}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              boxShadow: "none",
              px: 4,
            }}
          >
            Emitir Nota Fiscal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Fiscal;
