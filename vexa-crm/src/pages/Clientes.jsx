// src/pages/Clientes.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
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

  // Usar useCallback para evitar warning de exhaustive-deps
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

  // Handler para upload de foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDialog = (cliente = null) => {
    setTabValue(0); // Resetar para primeira aba

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
  };

  const handleSave = async () => {
    try {
      let fotoUrl = currentCliente.fotoUrl;

      // Se tem foto nova, fazer upload primeiro
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
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cliente
        </Button>
      </Box>

      {/* Seção de Busca */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              fullWidth
              label="Pesquisar por..."
              value={valorBusca}
              onChange={handleBuscaChange}
              placeholder="Digite o nome ou CPF do cliente..."
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<Search />}
              sx={{ minWidth: 140 }}
            >
              Pesquisar
            </Button>
            <Button variant="outlined" sx={{ minWidth: 180 }}>
              Exportar para Excel
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            <strong>TOTAL:</strong> {totalRegistros} cliente(s)
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Nome</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Telefone</strong>
                  </TableCell>
                  <TableCell>
                    <strong>WhatsApp</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Email</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Cidade</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(clientes) && clientes.length > 0 ? (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>{cliente.nomeCompleto}</TableCell>
                      <TableCell>{cliente.telefone}</TableCell>
                      <TableCell>{cliente.whatsApp}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>{cliente.cidade}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(cliente)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(cliente.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Nenhum cliente cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPaginas > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={totalPaginas}
                page={paginaAtual}
                onChange={handlePaginaChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog com Abas */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
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
                >
                  {fotoPreview ? "Alterar Foto" : "Adicionar Foto"}
                </Button>
              </label>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Tabs */}
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab icon={<Person />} label="Geral" iconPosition="start" />
            <Tab icon={<Home />} label="Endereço" iconPosition="start" />
            <Tab icon={<Extension />} label="Extras" iconPosition="start" />
            <Tab
              icon={<AccountBalance />}
              label="Crédito do Cliente"
              iconPosition="start"
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
                  onChange={handleChange}
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
                  label="Data Nascimento"
                  name="dataNascimento"
                  type="date"
                  value={currentCliente.dataNascimento}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  placeholder="dd/mm/aaaa"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Contatos*
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
                  label="Número"
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
                  <InputLabel>Email</InputLabel>
                  <Select defaultValue="email" label="Email">
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
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Rua"
                  name="rua"
                  value={currentCliente.rua}
                  onChange={handleChange}
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
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  name="cidade"
                  value={currentCliente.cidade}
                  onChange={handleChange}
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
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Aba Crédito do Cliente */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Funcionalidade em desenvolvimento
              </Typography>
            </Box>
          </TabPanel>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Clientes;
