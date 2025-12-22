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
  Stack,
  Avatar,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Paper,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  PhotoCamera,
  Person,
  Home,
  Extension,
  AccountBalance,
} from "@mui/icons-material";
import { clientesService } from "../api/clientesService";

// Componente de Tab Panel
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

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

  // Estados para validação de CPF
  const [cpfError, setCpfError] = useState("");
  const [cpfChecking, setCpfChecking] = useState(false);

  // Estado para loading do CEP
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
  // VALIDAÇÃO DE CPF
  // ============================================
  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, "");

    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  const verificarCPFExistente = async (cpf) => {
    if (!cpf || cpf.length < 11) {
      setCpfError("");
      return;
    }

    if (!validarCPF(cpf)) {
      setCpfError("CPF inválido");
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
        setCpfError("CPF já cadastrado para: " + data.clientes[0].nomeCompleto);
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
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado");
        return;
      }

      setCurrentCliente({
        ...currentCliente,
        cep: cepLimpo,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        complemento: data.complemento || currentCliente.complemento,
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert("Erro ao buscar CEP. Tente novamente.");
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

    if (cliente) {
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
        rua: cliente.rua || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        cep: cliente.cep || "",
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
  };

  const handleSave = async () => {
    if (!currentCliente.nomeCompleto.trim()) {
      alert("Nome é obrigatório");
      setTabValue(0);
      return;
    }

    if (!currentCliente.dataNascimento) {
      alert("Data de Nascimento é obrigatória");
      setTabValue(0);
      return;
    }

    if (cpfError) {
      alert("Corrija os erros antes de salvar");
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
      } else {
        await clientesService.create(clienteData);
      }

      fetchClientes();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      if (error.response) {
        console.error("Detalhes do erro:", error.response.data);
        alert(
          "Erro ao salvar: " +
            JSON.stringify(error.response.data.errors || error.response.data)
        );
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este cliente?")) {
      try {
        await clientesService.delete(id);
        fetchClientes();
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
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
            Clientes
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
            Novo Cliente
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
                NOME
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                TELEFONE
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                WHATSAPP
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                EMAIL
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                CIDADE
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
                  <TableCell
                    sx={{ color: "#111827", fontWeight: 500, py: 2.5 }}
                  >
                    {cliente.nomeCompleto}
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {cliente.telefone || "—"}
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {cliente.whatsApp || "—"}
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {cliente.email || "—"}
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {cliente.cidade || "—"}
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

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "20px" }}>
          {editMode ? "Editar Cliente" : "Novo Cliente"}
        </DialogTitle>
        <DialogContent>
          {/* Foto do Cliente */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3, mt: 2 }}>
            <Box sx={{ textAlign: "center" }}>
              <Avatar
                src={fotoPreview}
                sx={{ width: 120, height: 120, mb: 2, mx: "auto" }}
              >
                {!fotoPreview && <Person sx={{ fontSize: 60 }} />}
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
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  size="small"
                  sx={{
                    textTransform: "none",
                    borderColor: "#e5e7eb",
                    color: "#6b7280",
                    "&:hover": { borderColor: "#d1d5db", bgcolor: "#f9fafb" },
                  }}
                >
                  {fotoPreview ? "Alterar Foto" : "Adicionar Foto"}
                </Button>
              </label>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Tabs */}
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab
              icon={<Person />}
              label="Geral"
              iconPosition="start"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              icon={<Home />}
              label="Endereço"
              iconPosition="start"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              icon={<Extension />}
              label="Extras"
              iconPosition="start"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
            <Tab
              icon={<AccountBalance />}
              label="Crédito"
              iconPosition="start"
              sx={{ textTransform: "none", fontWeight: 600 }}
            />
          </Tabs>

          {/* Aba Geral */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome*"
                  name="nomeCompleto"
                  value={currentCliente.nomeCompleto}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="CPF"
                  name="cpf"
                  value={currentCliente.cpf}
                  onChange={handleCPFChange}
                  error={!!cpfError}
                  helperText={cpfError || (cpfChecking ? "Verificando..." : "")}
                  inputProps={{ maxLength: 11 }}
                  InputProps={{
                    endAdornment: cpfChecking && <CircularProgress size={20} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="RG"
                  name="rg"
                  value={currentCliente.rg}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="CNPJ"
                  name="cnpj"
                  value={currentCliente.cnpj}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Data Nascimento*"
                  name="dataNascimento"
                  type="date"
                  value={currentCliente.dataNascimento}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Contatos
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select defaultValue="celular" label="Tipo">
                    <MenuItem value="celular">Celular</MenuItem>
                    <MenuItem value="residencial">Residencial</MenuItem>
                    <MenuItem value="comercial">Comercial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Telefone"
                  name="telefone"
                  value={currentCliente.telefone}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  name="whatsApp"
                  value={currentCliente.whatsApp}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Tipo Email</InputLabel>
                  <Select defaultValue="email" label="Tipo Email">
                    <MenuItem value="email">Email</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={currentCliente.email}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Aba Endereço */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="CEP"
                  name="cep"
                  value={currentCliente.cep}
                  onChange={handleCEPChange}
                  inputProps={{ maxLength: 8 }}
                  helperText="Digite o CEP para buscar"
                  placeholder="00000000"
                  InputProps={{
                    endAdornment: cepLoading && <CircularProgress size={20} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Rua"
                  name="rua"
                  value={currentCliente.rua}
                  onChange={handleChange}
                  disabled={cepLoading}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Número"
                  name="numero"
                  value={currentCliente.numero}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Complemento"
                  name="complemento"
                  value={currentCliente.complemento}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bairro"
                  name="bairro"
                  value={currentCliente.bairro}
                  onChange={handleChange}
                  disabled={cepLoading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  name="cidade"
                  value={currentCliente.cidade}
                  onChange={handleChange}
                  disabled={cepLoading}
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

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ textTransform: "none", color: "#6b7280" }}
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
