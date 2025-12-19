// src/pages/Fornecedores.jsx
import React, { useEffect, useState } from "react";
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
  Tabs,
  Tab,
  InputAdornment,
  Paper,
} from "@mui/material";
import { Add, Edit, Delete, Search } from "@mui/icons-material";
import { FornecedorService } from "../api/fornecedorService";

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFornecedor, setCurrentFornecedor] = useState({
    Nome: "",
    RazaoSocial: "",
    Cnpj: "",
    NomeRepresentante: "",
    Telefone: "",
    WhatsApp: "",
    Email: "",
    Endereco: "",
    CategoriaProdutos: "",
    CondicaoPagamento: "",
    Observacoes: "",
    Cep: "",
    Rua: "",
    Numero: "",
    Complemento: "",
    Bairro: "",
    Cidade: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [errors, setErrors] = useState({});
  const [cepLoading, setCepLoading] = useState(false);

  const fetchFornecedores = async () => {
    try {
      const response = await FornecedorService.getAll();
      const data = response.items || response.fornecedores || response;
      const fornecedoresArray = Array.isArray(data) ? data : [];
      setFornecedores(fornecedoresArray);
      setFornecedoresFiltrados(fornecedoresArray);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      setFornecedores([]);
      setFornecedoresFiltrados([]);
    }
  };

  useEffect(() => {
    fetchFornecedores();
  }, []);

  const handleSearch = (e) => {
    const termo = e.target.value.toLowerCase();
    setSearchTerm(termo);

    if (termo === "") {
      setFornecedoresFiltrados(fornecedores);
    } else {
      const filtrados = fornecedores.filter(
        (fornecedor) =>
          fornecedor.nome?.toLowerCase().includes(termo) ||
          fornecedor.cnpj?.toLowerCase().includes(termo)
      );
      setFornecedoresFiltrados(filtrados);
    }
  };

  const handleOpenDialog = (fornecedor = null) => {
    if (fornecedor) {
      setCurrentFornecedor({
        ...fornecedor,
        cep: fornecedor.endereco?.cep || "",
        rua: fornecedor.endereco?.rua || "",
        numero: fornecedor.endereco?.numero || "",
        complemento: fornecedor.endereco?.complemento || "",
        bairro: fornecedor.endereco?.bairro || "",
        cidade: fornecedor.endereco?.cidade || "",
      });
      setEditMode(true);
    } else {
      setCurrentFornecedor({
        nome: "",
        razaoSocial: "",
        cnpj: "",
        nomeRepresentante: "",
        telefone: "",
        whatsApp: "",
        email: "",
        endereco: "",
        categoriaProdutos: "",
        condicaoPagamento: "",
        observacoes: "",
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
      });
      setEditMode(false);
    }
    setErrors({});
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!currentFornecedor.nome || currentFornecedor.nome.trim() === "") {
      newErrors.nome = "Nome é obrigatório";
    }

    if (!currentFornecedor.cnpj || currentFornecedor.cnpj.trim() === "") {
      newErrors.cnpj = "CNPJ é obrigatório";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const fornecedorData = {
        Nome: currentFornecedor.nome,
        RazaoSocial: currentFornecedor.razaoSocial || null,
        Cnpj: currentFornecedor.cnpj,
        NomeRepresentante: currentFornecedor.nomeRepresentante || null,
        Telefone: currentFornecedor.telefone || null,
        Whatsapp: currentFornecedor.whatsApp || null,
        Email: currentFornecedor.email || null,
        Endereco: currentFornecedor.rua
          ? `${currentFornecedor.rua}, ${currentFornecedor.numero} - ${currentFornecedor.bairro}, ${currentFornecedor.cidade}`
          : null,
        CategoriaProdutos: currentFornecedor.categoriaProdutos || null,
        CondicaoPagamento: currentFornecedor.condicaoPagamento || null,
        Observacoes: currentFornecedor.observacoes || null,
        DataCadastro: new Date().toISOString(),
      };

      // ← ADICIONAR ESTAS 3 LINHAS
      console.log("🔍 Estado atual:", currentFornecedor);
      console.log("📦 Dados que serão enviados:", fornecedorData);
      console.log(
        "📝 Nome específico:",
        fornecedorData.nome,
        "| Tamanho:",
        fornecedorData.nome?.length
      );

      if (editMode) {
        await FornecedorService.update(currentFornecedor.id, fornecedorData);
      } else {
        await FornecedorService.create(fornecedorData);
      }

      fetchFornecedores();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);

      const errorMessage = error.response?.data?.errors
        ? JSON.stringify(error.response.data.errors, null, 2)
        : error.response?.data?.mensagem || error.message;

      alert(`Erro ao salvar: ${errorMessage}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este fornecedor?")) {
      try {
        await FornecedorService.delete(id);
        fetchFornecedores();
      } catch (error) {
        console.error("Erro ao excluir fornecedor:", error);
        alert("Erro ao excluir fornecedor");
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentFornecedor({
      ...currentFornecedor,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const buscarCep = async () => {
    const cep = currentFornecedor.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      alert("CEP inválido! Digite 8 dígitos.");
      return;
    }

    setCepLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado!");
        return;
      }

      setCurrentFornecedor({
        ...currentFornecedor,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        complemento: data.complemento || "",
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <Box>
      {/* Botão Novo Fornecedor no topo à direita */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
        }}
      >
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          NOVO FORNECEDOR
        </Button>
      </Box>

      {/* Barra de pesquisa */}
      <Box
        sx={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          p: 2,
          mb: 2,
          bgcolor: "white",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 1,
            color: "text.secondary",
            fontWeight: 500,
          }}
        >
          Pesquisar por...
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Digite o nome ou CNPJ do fornecedor..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            PESQUISAR
          </Button>
        </Box>
      </Box>

      {/* Contador */}
      <Typography
        variant="body2"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: "text.secondary",
        }}
      >
        TOTAL: {fornecedoresFiltrados.length} fornecedor(es)
      </Typography>

      {/* Tabela */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #e0e0e0" }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Telefone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>CNPJ</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fornecedoresFiltrados.length > 0 ? (
              fornecedoresFiltrados.map((fornecedor) => (
                <TableRow key={fornecedor.id} hover>
                  <TableCell>{fornecedor.nome}</TableCell>
                  <TableCell>{fornecedor.email || ""}</TableCell>
                  <TableCell>{fornecedor.telefone || ""}</TableCell>
                  <TableCell>{fornecedor.cnpj || ""}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(fornecedor)}
                      sx={{ color: "#1976d2" }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(fornecedor.id)}
                      sx={{ color: "#d32f2f" }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Nenhum fornecedor cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Cadastro/Edição */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? "Editar Fornecedor" : "Novo Fornecedor"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="GERAL" />
              <Tab label="ENDEREÇO" />
              <Tab label="EXTRAS" />
            </Tabs>
          </Box>

          {/* ABA GERAL */}
          {tabValue === 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome *"
                  name="nome"
                  value={currentFornecedor.nome}
                  onChange={handleChange}
                  error={!!errors.nome}
                  helperText={errors.nome}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Razão Social"
                  name="razaoSocial"
                  value={currentFornecedor.razaoSocial}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CNPJ *"
                  name="cnpj"
                  value={currentFornecedor.cnpj}
                  onChange={handleChange}
                  error={!!errors.cnpj}
                  helperText={errors.cnpj}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome do Representante"
                  name="nomeRepresentante"
                  value={currentFornecedor.nomeRepresentante}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  name="telefone"
                  value={currentFornecedor.telefone}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  name="whatsApp"
                  value={currentFornecedor.whatsApp}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={currentFornecedor.email}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          )}

          {/* ABA ENDEREÇO */}
          {tabValue === 1 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="CEP"
                  name="cep"
                  value={currentFornecedor.cep}
                  onChange={handleChange}
                  onBlur={buscarCep}
                  disabled={cepLoading}
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Rua"
                  name="rua"
                  value={currentFornecedor.rua}
                  onChange={handleChange}
                  disabled={cepLoading}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Número"
                  name="numero"
                  value={currentFornecedor.numero}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Complemento"
                  name="complemento"
                  value={currentFornecedor.complemento}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bairro"
                  name="bairro"
                  value={currentFornecedor.bairro}
                  onChange={handleChange}
                  disabled={cepLoading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  name="cidade"
                  value={currentFornecedor.cidade}
                  onChange={handleChange}
                  disabled={cepLoading}
                />
              </Grid>
            </Grid>
          )}

          {/* ABA EXTRAS */}
          {tabValue === 2 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Categoria de Produtos"
                  name="categoriaProdutos"
                  value={currentFornecedor.categoriaProdutos}
                  onChange={handleChange}
                  placeholder="Ex: Eletrônicos, Roupas, Alimentos..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Condição de Pagamento"
                  name="condicaoPagamento"
                  value={currentFornecedor.condicaoPagamento}
                  onChange={handleChange}
                  placeholder="Ex: 30/60/90 dias, À vista..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  name="observacoes"
                  value={currentFornecedor.observacoes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Fornecedores;
