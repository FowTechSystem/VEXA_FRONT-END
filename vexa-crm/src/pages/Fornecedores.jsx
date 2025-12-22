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
    nome: "",
    razaoSocial: "",
    cnpj: "",
    nomeRepresentante: "",
    telefone: "",
    whatsApp: "",
    email: "",
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
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [errors, setErrors] = useState({});
  const [cepLoading, setCepLoading] = useState(false);

  const fetchFornecedores = async () => {
    try {
      const response = await FornecedorService.getAll();
      const data =
        response.fornecedor ||
        response.items ||
        response.fornecedores ||
        response;
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
        cep: fornecedor.cep || "",
        rua: fornecedor.rua || "",
        numero: fornecedor.numero || "",
        complemento: fornecedor.complemento || "",
        bairro: fornecedor.bairro || "",
        cidade: fornecedor.cidade || "",
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
    if (!validateForm()) return;

    try {
      const fornecedorData = {
        Nome: currentFornecedor.nome,
        RazaoSocial: currentFornecedor.razaoSocial || null,
        Cnpj: currentFornecedor.cnpj,
        NomeRepresentante: currentFornecedor.nomeRepresentante || null,
        Telefone: currentFornecedor.telefone || null,
        Whatsapp: currentFornecedor.whatsApp || null,
        Email: currentFornecedor.email || null,
        Rua: currentFornecedor.rua || null,
        Numero: currentFornecedor.numero || null,
        Bairro: currentFornecedor.bairro || null,
        Cidade: currentFornecedor.cidade || null,
        Cep: currentFornecedor.cep || null,
        Complemento: currentFornecedor.complemento || null,
        CategoriaProdutos: currentFornecedor.categoriaProdutos || null,
        CondicaoPagamento: currentFornecedor.condicaoPagamento || null,
        Observacoes: currentFornecedor.observacoes || null,
        DataCadastro: new Date().toISOString(),
      };

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
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const buscarCep = async () => {
    const cep = currentFornecedor.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado");
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
      alert("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
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
            Fornecedores
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
            Novo Fornecedor
          </Button>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Buscar por nome ou CNPJ..."
          value={searchTerm}
          onChange={handleSearch}
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
          {fornecedoresFiltrados.length}{" "}
          {fornecedoresFiltrados.length === 1 ? "fornecedor" : "fornecedores"}
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
                EMAIL
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                TELEFONE
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                CNPJ
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
            {fornecedoresFiltrados.length > 0 ? (
              fornecedoresFiltrados.map((fornecedor, index) => (
                <TableRow
                  key={fornecedor.id}
                  sx={{
                    "&:hover": { bgcolor: "#f9fafb" },
                    borderBottom:
                      index === fornecedoresFiltrados.length - 1
                        ? "none"
                        : "1px solid #f3f4f6",
                  }}
                >
                  <TableCell
                    sx={{ color: "#111827", fontWeight: 500, py: 2.5 }}
                  >
                    {fornecedor.nome}
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {fornecedor.email || "—"}
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {fornecedor.telefone || "—"}
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {fornecedor.cnpj || "—"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(fornecedor)}
                      sx={{
                        color: "#6b7280",
                        "&:hover": { bgcolor: "#f3f4f6", color: "#2563eb" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(fornecedor.id)}
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
                  colSpan={5}
                  align="center"
                  sx={{ py: 8, color: "#9ca3af" }}
                >
                  <Typography variant="body1">
                    Nenhum fornecedor encontrado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Clique em "Novo Fornecedor" para cadastrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "20px" }}>
          {editMode ? "Editar Fornecedor" : "Novo Fornecedor"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label="Geral"
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
              <Tab
                label="Endereço"
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
              <Tab
                label="Extras"
                sx={{ textTransform: "none", fontWeight: 600 }}
              />
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
                  placeholder="00000-000"
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

export default Fornecedores;
