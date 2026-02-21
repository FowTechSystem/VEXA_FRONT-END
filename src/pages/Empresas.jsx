// src/pages/Empresas.jsx
// Cadastro de novas empresas (visível apenas para dev@gmail.com).
import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import { Add, Business, Login as LoginIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { criarEmpresa } from "../api/empresasService";
import { showSuccess, showError } from "../utils/notifications";
import { authService } from "../api/authService";
import { useEmpresa } from "../contexts/EmpresaContext";

const DEV_ADMIN_EMAIL = "dev@gmail.com";

const initialState = {
  nome: "",
  nomeFantasia: "",
  cnpj: "",
  email: "",
  telefone: "",
  ativo: true,
};

function Empresas() {
  const navigate = useNavigate();
  const user = authService.getUsuario();
  const { empresas, loadingEmpresas, setEmpresaAtiva, loadEmpresas } = useEmpresa();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleEntrar = (empresa) => {
    setEmpresaAtiva(empresa);
    showSuccess(`Entrou na empresa: ${empresa.nome || empresa.nomeFantasia || `#${empresa.id}`}`);
    navigate("/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const checked = e.target.type === "checkbox" ? e.target.checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: checked !== undefined ? checked : value,
    }));
    setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome?.trim()) {
      setMessage({ type: "error", text: "Nome da empresa é obrigatório." });
      return;
    }
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await criarEmpresa({
        nome: form.nome.trim(),
        nomeFantasia: form.nomeFantasia?.trim() || undefined,
        cnpj: form.cnpj?.replace(/\D/g, "") || undefined,
        email: form.email?.trim() || undefined,
        telefone: form.telefone?.trim() || undefined,
        ativo: form.ativo,
      });
      showSuccess("Empresa cadastrada com sucesso! O cliente poderá acessar após ter um usuário vinculado a ela.");
      setForm(initialState);
      setMessage({ type: "success", text: "Empresa cadastrada. Cadastre um usuário com esta empresa para o cliente acessar." });
      loadEmpresas();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.Nome?.[0] || "Erro ao cadastrar empresa.";
      showError(msg);
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  if (user.email !== DEV_ADMIN_EMAIL) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Você não tem permissão para acessar o cadastro de empresas.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Cadastro de Empresas
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Cadastre novas empresas para outros clientes conseguirem acessar o sistema. Após cadastrar a empresa, crie um usuário vinculado a ela (pelo backend ou tela de usuários, conforme sua regra).
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      )}

      {/* Lista de empresas cadastradas */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Business fontSize="small" /> Empresas cadastradas
        </Typography>
        <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          {loadingEmpresas ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <CircularProgress size={32} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Carregando empresas...</Typography>
            </Box>
          ) : empresas.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">Nenhuma empresa cadastrada. Cadastre uma abaixo.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Nome fantasia</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>CNPJ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Ação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empresas.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell>{e.nome || "—"}</TableCell>
                      <TableCell>{e.nomeFantasia || "—"}</TableCell>
                      <TableCell>{e.cnpj || "—"}</TableCell>
                      <TableCell>
                        <Chip label={e.ativo !== false ? "Ativa" : "Inativa"} size="small" color={e.ativo !== false ? "success" : "default"} variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="contained" startIcon={<LoginIcon />} onClick={() => handleEntrar(e)}>
                          Entrar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", maxWidth: 720 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <Business fontSize="small" /> Nova empresa
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Nome"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Razão social"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome fantasia"
                name="nomeFantasia"
                value={form.nomeFantasia}
                onChange={handleChange}
                placeholder="Nome fantasia"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CNPJ"
                name="cnpj"
                value={form.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="contato@empresa.com"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                placeholder="(00) 0000-0000"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch name="ativo" checked={form.ativo} onChange={handleChange} color="primary" />}
                label="Empresa ativa"
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Add />}
              disabled={loading}
            >
              {loading ? "Cadastrando..." : "Cadastrar empresa"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

export default Empresas;
