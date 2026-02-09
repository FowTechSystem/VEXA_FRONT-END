// src/pages/Clientes.jsx
import React, { useEffect, useState, useCallback } from "react";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Avatar,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Paper,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  CameraAlt,
  Person,
  Home,
  Extension,
  AccountBalance,
  Close,
} from "@mui/icons-material";
import { clientesService } from "../api/clientesService";
import { FornecedorService } from "../api/fornecedorService";
import { CategoriaService } from "../api/categoriaService";
import { MarcaService } from "../api/marcaService";
import { Autocomplete } from "@mui/material";
import { showSuccess, showError, showWarning } from "../utils/notifications";
import {
  successMessages,
  errorMessages,
  confirmMessages,
  entityNames,
  validationMessages,
} from "../utils/entityMessages";
import {
  validateCPF,
  validateCNPJ,
  validateRequired,
} from "../utils/validators";

// Componente de Tab Panel
function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const getInitials = (nome) => {
  if (!nome) return "?";
  const parts = nome.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
};

const getAvatarColor = (nome) => {
  const colors = [
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#14b8a6",
  ];
  const index = nome?.charCodeAt(0) % colors.length || 0;
  return colors[index];
};

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Estados para busca e paginação
  const [filtro] = useState("nome");
  const [valorBusca, setValorBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const tamanhoPagina = 10;

  // Estado para foto
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  // Estados para validação
  const [cpfError, setCpfError] = useState("");
  const [cpfChecking, setCpfChecking] = useState(false);
  const [cnpjError, setCnpjError] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  const [currentCliente, setCurrentCliente] = useState({
    nomeCompleto: "",
    telefone: "",
    whatsApp: "",
    email: "",
    cpf: "",
    rg: "",
    cnpj: "",
    dataNascimento: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    cep: "",
    preferencias: "",
    observacoes: "",
    fotoUrl: "",
  });
  const [editMode, setEditMode] = useState(false);

  // ============================================
  // VERIFICAR CPF EXISTENTE
  // ============================================
  const verificarCPFExistente = async (cpf) => {
    if (!cpf || cpf.length < 11) {
      setCpfError("");
      return;
    }

    const validation = validateCPF(cpf);
    if (!validation.valid) {
      setCpfError(validation.message);
      return;
    }

    setCpfChecking(true);
    try {
      const data = await clientesService.listarPaginado({
        filtro: "cpf",
        valor: cpf,
        pagina: 1,
        tamanho: 1,
      });

      if (
        data.clientes.length > 0 &&
        (!editMode || data.clientes[0].id !== currentCliente.id)
      ) {
        setCpfError(
          validationMessages.cpfDuplicate(data.clientes[0].nomeCompleto),
        );
      } else {
        setCpfError("");
      }
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);
    } finally {
      setCpfChecking(false);
    }
  };

  // ============================================
  // BUSCAR CEP - ViaCEP API
  // ============================================
  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/[^\d]/g, "");

    if (cepLimpo.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      );
      const data = await response.json();

      if (data.erro) {
        showError("CEP não encontrado");
        return;
      }

      setCurrentCliente((prev) => ({
        ...prev,
        cep: cepLimpo,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        complemento: data.complemento || prev.complemento,
      }));
      showSuccess("Endereço carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      showError("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleCPFChange = (e) => {
    const cpf = e.target.value.replace(/[^\d]/g, "");
    setCurrentCliente({
      ...currentCliente,
      cpf: cpf,
    });

    if (cpf.length === 11) {
      setTimeout(() => verificarCPFExistente(cpf), 500);
    } else {
      setCpfError("");
    }
  };

  const handleCNPJChange = (e) => {
    const cnpj = e.target.value.replace(/[^\d]/g, "");
    setCurrentCliente({
      ...currentCliente,
      cnpj: cnpj,
    });

    if (cnpj.length > 0 && cnpj.length < 14) {
      setCnpjError(validationMessages.exactLength("CNPJ", 14));
    } else if (cnpj.length === 14) {
      const validation = validateCNPJ(cnpj);
      setCnpjError(validation.valid ? "" : validation.message);
    } else {
      setCnpjError("");
    }
  };

  const handleCEPChange = (e) => {
    const cep = e.target.value.replace(/[^\d]/g, "");
    setCurrentCliente({
      ...currentCliente,
      cep: cep,
    });

    if (cep.length === 8) {
      buscarCEP(cep);
    }
  };

  const fetchClientes = useCallback(async () => {
    try {
      const data = await clientesService.listarPaginado({
        filtro,
        valor: valorBusca,
        pagina: paginaAtual,
        tamanho: tamanhoPagina,
      });

      setClientes(Array.isArray(data.clientes) ? data.clientes : []);
      setTotalPaginas(data.totalPaginas);
      setTotalRegistros(data.totalRegistros);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      showError(errorMessages.fetch(entityNames.clientes));
      setClientes([]);
    }
  }, [filtro, valorBusca, paginaAtual]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientes();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchClientes]);

  const handleBuscaChange = (e) => {
    setValorBusca(e.target.value);
    setPaginaAtual(1);
  };

  const handlePaginaChange = (event, value) => {
    setPaginaAtual(value);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError("Imagem deve ter no máximo 5MB");
        return;
      }

      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDialog = (cliente = null) => {
    setTabValue(0);
    setCpfError("");
    setCnpjError("");

    if (cliente) {
      const primeiroEndereco = cliente.enderecos?.[0] || {};

      setCurrentCliente({
        id: cliente.id,
        nomeCompleto: cliente.nomeCompleto,
        telefone: cliente.telefone,
        whatsApp: cliente.whatsApp,
        email: cliente.email || "",
        cpf: cliente.cpf || "",
        rg: cliente.rg || "",
        cnpj: cliente.cnpj || "",
        dataNascimento: cliente.dataNascimento
          ? cliente.dataNascimento.split("T")[0]
          : "",
        rua: primeiroEndereco.rua || "",
        numero: primeiroEndereco.numero || "",
        complemento: primeiroEndereco.complemento || "",
        bairro: primeiroEndereco.bairro || "",
        cidade: primeiroEndereco.cidade || "",
        cep: primeiroEndereco.cep || "",
        preferencias: cliente.preferencias || "",
        observacoes: cliente.observacoes || "",
        fotoUrl: cliente.fotoUrl || "",
      });
      setFotoPreview(cliente.fotoUrl || null);
      setEditMode(true);
    } else {
      setCurrentCliente({
        nomeCompleto: "",
        telefone: "",
        whatsApp: "",
        email: "",
        cpf: "",
        rg: "",
        cnpj: "",
        dataNascimento: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        cep: "",
        preferencias: "",
        observacoes: "",
        fotoUrl: "",
      });
      setFotoPreview(null);
      setFotoFile(null);
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFotoPreview(null);
    setFotoFile(null);
    setCpfError("");
    setCnpjError("");
  };

  const handleSave = async () => {
    // Validações
    const nomeValidation = validateRequired(
      currentCliente.nomeCompleto,
      "Nome",
    );
    if (!nomeValidation.valid) {
      showError(nomeValidation.message);
      setTabValue(0);
      return;
    }

    const dataNascValidation = validateRequired(
      currentCliente.dataNascimento,
      "Data de Nascimento",
    );
    if (!dataNascValidation.valid) {
      showError(dataNascValidation.message);
      setTabValue(0);
      return;
    }

    if (cpfError || cnpjError) {
      showWarning("Corrija os erros antes de salvar");
      setTabValue(0);
      return;
    }

    try {
      let fotoUrl = currentCliente.fotoUrl;

      if (fotoFile) {
        const uploadResult = await clientesService.uploadFoto(fotoFile);
        fotoUrl = uploadResult.url;
      }

      const clienteData = {
        ...currentCliente,
        fotoUrl,
      };

      if (editMode) {
        await clientesService.update(currentCliente.id, clienteData);
        showSuccess(successMessages.update(entityNames.cliente));
      } else {
        await clientesService.create(clienteData);
        showSuccess(successMessages.create(entityNames.cliente));
      }

      fetchClientes();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);

      if (error.response) {
        const errorData = error.response.data;
        if (errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          showError(firstError[0] || errorMessages.create(entityNames.cliente));
        } else {
          showError(
            errorData.message || errorMessages.create(entityNames.cliente),
          );
        }
      } else {
        showError(
          editMode
            ? errorMessages.update(entityNames.cliente)
            : errorMessages.create(entityNames.cliente),
        );
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(confirmMessages.delete(entityNames.cliente))) {
      try {
        await clientesService.delete(id);
        showSuccess(successMessages.delete(entityNames.cliente));
        fetchClientes();
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        showError(errorMessages.delete(entityNames.cliente));
      }
    }
  };

  const handleChange = (e) => {
    setCurrentCliente({
      ...currentCliente,
      [e.target.name]: e.target.value,
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
          <Typography variant="h4" sx={{ fontWeight: 600, color: "#1a1a1a" }}>
            {entityNames.clientes}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              borderRadius: "8px",
              px: 3,
              py: 1,
              boxShadow: "none",
            }}
          >
            Novo {entityNames.cliente}
          </Button>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Digite o nome ou CPF do cliente..."
          value={valorBusca}
          onChange={handleBuscaChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#9ca3af" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: "white",
            borderRadius: "10px",
            "& .MuiOutlinedInput-root": {
              "& fieldset": { border: "1px solid #e5e7eb" },
              "&:hover fieldset": { border: "1px solid #d1d5db" },
              "&.Mui-focused fieldset": { border: "1px solid #2563eb" },
            },
          }}
        />

        {/* Contador */}
        <Typography
          variant="body2"
          sx={{ mt: 2, color: "#6b7280", fontSize: "14px" }}
        >
          {totalRegistros} {totalRegistros === 1 ? "cliente" : "clientes"}
        </Typography>
      </Box>

      {/* Tabela */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f9fafb" }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "13px",
                  py: 2,
                }}
              >
                CLIENTE
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                EMAIL
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                CPF
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                TELEFONE
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                AÇÕES
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(clientes) && clientes.length > 0 ? (
              clientes.map((cliente, index) => (
                <TableRow
                  key={cliente.id}
                  sx={{
                    "&:hover": { bgcolor: "#f9fafb" },
                    borderBottom:
                      index === clientes.length - 1
                        ? "none"
                        : "1px solid #f3f4f6",
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(cliente.nomeCompleto),
                          width: 40,
                          height: 40,
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {getInitials(cliente.nomeCompleto)}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#111827" }}
                      >
                        {cliente.nomeCompleto}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {cliente.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cliente.cpf || "Sem CPF"}
                      size="small"
                      sx={{
                        bgcolor: "#f3f4f6",
                        color: "#374151",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cliente.telefone || "Sem telefone"}
                      size="small"
                      sx={{
                        bgcolor: "#f3f4f6",
                        color: "#374151",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(cliente)}
                      sx={{
                        color: "#6b7280",
                        "&:hover": { bgcolor: "#f3f4f6", color: "#2563eb" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(cliente.id)}
                      sx={{
                        color: "#6b7280",
                        "&:hover": { bgcolor: "#fef2f2", color: "#dc2626" },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 8, color: "#9ca3af" }}
                >
                  <Typography variant="body1">
                    Nenhum cliente encontrado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Clique em "Novo Cliente" para cadastrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPaginas}
            page={paginaAtual}
            onChange={handlePaginaChange}
            color="primary"
            showFirstButton
            showLastButton
            sx={{
              "& .MuiPaginationItem-root": {
                borderRadius: "8px",
              },
            }}
          />
        </Box>
      )}

      {/* Dialog - Seguindo padrão da imagem */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "12px", maxHeight: "90vh" },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            fontSize: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
            px: 3,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          Novo Cliente
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        {/* Avatar Section */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pt: 3,
            pb: 2,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Avatar
            src={fotoPreview}
            sx={{
              width: 100,
              height: 100,
              bgcolor: "#d1d5db",
              mb: 1.5,
            }}
          >
            {!fotoPreview && <Person sx={{ fontSize: 50, color: "#fff" }} />}
          </Avatar>
          <input
            accept="image/*"
            style={{ display: "none" }}
            id="foto-upload"
            type="file"
            onChange={handleFotoChange}
          />
          <label htmlFor="foto-upload">
            <Button
              component="span"
              startIcon={<CameraAlt />}
              sx={{
                textTransform: "none",
                color: "#6b7280",
                fontSize: "13px",
                "&:hover": { bgcolor: "transparent" },
              }}
            >
              Adicionar Foto
            </Button>
          </label>
        </Box>

        {/* Tabs Navigation */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: "1px solid #e5e7eb",
            px: 2,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: "14px",
              minHeight: 48,
              color: "#6b7280",
            },
            "& .Mui-selected": {
              color: "#2563eb",
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#2563eb",
            },
          }}
        >
          <Tab
            icon={<Person sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Geral"
          />
          <Tab
            icon={<Home sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Endereço"
          />
          <Tab
            icon={<Extension sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Extras"
          />
          <Tab
            icon={<AccountBalance sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Crédito"
          />
        </Tabs>

        <DialogContent sx={{ p: 0 }}>
          {/* Aba Geral */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome**"
                  name="nomeCompleto"
                  value={currentCliente.nomeCompleto}
                  onChange={handleChange}
                  required
                  size="small"
                  placeholder="Nome completo do cliente"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="CPF"
                  name="cpf"
                  value={currentCliente.cpf}
                  onChange={handleCPFChange}
                  error={!!cpfError}
                  helperText={cpfError || ""}
                  size="small"
                  placeholder="000.000.000-00"
                  InputProps={{
                    endAdornment: cpfChecking && <CircularProgress size={20} />,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="RG"
                  name="rg"
                  value={currentCliente.rg}
                  onChange={handleChange}
                  size="small"
                  placeholder="RG"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="CNPJ"
                  name="cnpj"
                  value={currentCliente.cnpj}
                  onChange={handleCNPJChange}
                  error={!!cnpjError}
                  helperText={cnpjError || ""}
                  size="small"
                  placeholder="00.000.000/0000-00"
                />
              </Grid>

              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Data Nascimento**"
                  name="dataNascimento"
                  type="date"
                  value={currentCliente.dataNascimento}
                  onChange={handleChange}
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  placeholder="dd/mm/aaaa"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  name="whatsApp"
                  value={currentCliente.whatsApp}
                  onChange={handleChange}
                  size="small"
                  placeholder="(00) 00000-0000"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select defaultValue="Celular" label="Tipo">
                    <MenuItem value="Celular">Celular</MenuItem>
                    <MenuItem value="Fixo">Fixo</MenuItem>
                    <MenuItem value="Comercial">Comercial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Telefone"
                  name="telefone"
                  value={currentCliente.telefone}
                  onChange={handleChange}
                  size="small"
                  placeholder="(00) 0000-0000"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo Email</InputLabel>
                  <Select defaultValue="Email" label="Tipo Email">
                    <MenuItem value="Email">Email</MenuItem>
                    <MenuItem value="Pessoal">Pessoal</MenuItem>
                    <MenuItem value="Comercial">Comercial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={currentCliente.email}
                  onChange={handleChange}
                  size="small"
                  placeholder="cliente@exemplo.com"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Aba Endereço */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="CEP"
                  name="cep"
                  value={currentCliente.cep}
                  onChange={handleCEPChange}
                  size="small"
                  placeholder="00000-000"
                  InputProps={{
                    endAdornment: cepLoading && <CircularProgress size={20} />,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Endereço"
                  name="rua"
                  value={currentCliente.rua}
                  onChange={handleChange}
                  disabled={cepLoading}
                  size="small"
                  placeholder="Rua, Avenida..."
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Número"
                  name="numero"
                  value={currentCliente.numero}
                  onChange={handleChange}
                  size="small"
                  placeholder="Nº"
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Complemento"
                  name="complemento"
                  value={currentCliente.complemento}
                  onChange={handleChange}
                  size="small"
                  placeholder="Apto, Bloco, etc"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bairro"
                  name="bairro"
                  value={currentCliente.bairro}
                  onChange={handleChange}
                  disabled={cepLoading}
                  size="small"
                  placeholder="Bairro"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  name="cidade"
                  value={currentCliente.cidade}
                  onChange={handleChange}
                  disabled={cepLoading}
                  size="small"
                  placeholder="Cidade"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Aba Extras */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Preferências"
                  name="preferencias"
                  multiline
                  rows={4}
                  value={currentCliente.preferencias}
                  onChange={handleChange}
                  size="small"
                  placeholder="Descreva as preferências do cliente..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  name="observacoes"
                  multiline
                  rows={4}
                  value={currentCliente.observacoes}
                  onChange={handleChange}
                  size="small"
                  placeholder="Adicione observações relevantes..."
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Aba Crédito */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ textAlign: "center", py: 8 }}>
              <AccountBalance sx={{ fontSize: 60, color: "#9ca3af", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Funcionalidade em Desenvolvimento
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gerenciamento de crédito estará disponível em breve
              </Typography>
            </Box>
          </TabPanel>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            pt: 2,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button
            onClick={handleCloseDialog}
            sx={{
              textTransform: "none",
              color: "#6b7280",
              "&:hover": { bgcolor: "#f3f4f6" },
              px: 3,
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              textTransform: "none",
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
              boxShadow: "none",
              px: 4,
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Clientes;
