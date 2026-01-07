// src/pages/Usuarios.jsx
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
  Chip,
  Avatar,
  Paper,
  InputAdornment,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { Add, Edit, Delete, Search, Person, Close } from "@mui/icons-material";
import api from "../api/axiosConfig";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUsuario, setCurrentUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    perfil: "",
    telefone: "",
    cargo: "",
    departamento: "",
    ativo: true,
  });

  const PERFIS = ["Administrador", "Gerente", "Vendedor", "Suporte"];
  const DEPARTAMENTOS = [
    "Vendas",
    "Marketing",
    "Suporte",
    "Financeiro",
    "TI",
    "RH",
  ];

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get("/usuarios");
        const usuariosArray = Array.isArray(response.data) ? response.data : [];
        setUsuarios(usuariosArray);
        setUsuariosFiltrados(usuariosArray);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        setUsuarios([]);
        setUsuariosFiltrados([]);
      }
    };

    fetchUsuarios();
  }, []);

  const recarregarUsuarios = async () => {
    try {
      const response = await api.get("/usuarios");
      const usuariosArray = Array.isArray(response.data) ? response.data : [];
      setUsuarios(usuariosArray);
      setUsuariosFiltrados(usuariosArray);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setUsuarios([]);
      setUsuariosFiltrados([]);
    }
  };

  const handleSearch = (e) => {
    const termo = e.target.value.toLowerCase();
    setSearchTerm(termo);

    if (termo === "") {
      setUsuariosFiltrados(usuarios);
    } else {
      const filtrados = usuarios.filter(
        (usuario) =>
          usuario.nome?.toLowerCase().includes(termo) ||
          usuario.email?.toLowerCase().includes(termo) ||
          usuario.perfil?.toLowerCase().includes(termo)
      );
      setUsuariosFiltrados(filtrados);
    }
  };

  const handleOpenDialog = (usuario = null) => {
    if (usuario) {
      setCurrentUsuario(usuario);
      setEditMode(true);
    } else {
      setCurrentUsuario({
        nome: "",
        email: "",
        senha: "",
        perfil: "",
        telefone: "",
        cargo: "",
        departamento: "",
        ativo: true,
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setCurrentUsuario({
      ...currentUsuario,
      [name]: e.target.type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    if (!currentUsuario.nome?.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    if (!currentUsuario.email?.trim()) {
      alert("Email é obrigatório");
      return;
    }

    if (!editMode && !currentUsuario.senha) {
      alert("Senha é obrigatória para novos usuários");
      return;
    }

    if (!currentUsuario.perfil) {
      alert("Perfil é obrigatório");
      return;
    }

    try {
      if (editMode) {
        await api.put(`/usuarios/${currentUsuario.id}`, currentUsuario);
      } else {
        await api.post("/usuarios", currentUsuario);
      }
      recarregarUsuarios();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      alert("Erro ao salvar usuário. Tente novamente.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este usuário?")) {
      try {
        await api.delete(`/usuarios/${id}`);
        recarregarUsuarios();
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Erro ao excluir usuário.");
      }
    }
  };

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
            Usuários
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
            Novo Usuário
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Buscar por nome, email ou perfil..."
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

        <Typography
          variant="body2"
          sx={{ mt: 2, color: "#6b7280", fontSize: "14px" }}
        >
          {usuariosFiltrados.length}{" "}
          {usuariosFiltrados.length === 1 ? "usuário" : "usuários"}
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
                USUÁRIO
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                EMAIL
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                PERFIL
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                STATUS
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
            {Array.isArray(usuariosFiltrados) &&
            usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((usuario, index) => (
                <TableRow
                  key={usuario.id}
                  sx={{
                    "&:hover": { bgcolor: "#f9fafb" },
                    borderBottom:
                      index === usuariosFiltrados.length - 1
                        ? "none"
                        : "1px solid #f3f4f6",
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(usuario.nome),
                          width: 40,
                          height: 40,
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {getInitials(usuario.nome)}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#111827" }}
                      >
                        {usuario.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {usuario.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={usuario.perfil || "Sem perfil"}
                      size="small"
                      sx={{
                        bgcolor: "#f3f4f6",
                        color: "#374151",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={usuario.ativo ? "Ativo" : "Inativo"}
                      size="small"
                      sx={{
                        bgcolor: usuario.ativo ? "#dcfce7" : "#f3f4f6",
                        color: usuario.ativo ? "#16a34a" : "#6b7280",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(usuario)}
                      sx={{
                        color: "#6b7280",
                        "&:hover": { bgcolor: "#f3f4f6", color: "#2563eb" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(usuario.id)}
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
                  <Person sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1">
                    Nenhum usuário encontrado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Clique em "Novo Usuário" para cadastrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog - Formulário Organizado */}
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
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 2,
          }}
        >
          {editMode ? "Editar Usuário" : "Novo Usuário"}
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* SEÇÃO 1: INFORMAÇÕES PESSOAIS */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                bgcolor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#1f2937",
                  mb: 3,
                  fontSize: "16px",
                }}
              >
                👤 Informações Pessoais
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Nome Completo"
                    name="nome"
                    value={currentUsuario.nome}
                    onChange={handleChange}
                    placeholder="Ex: João Silva"
                    sx={{ bgcolor: "white" }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Email"
                    name="email"
                    type="email"
                    value={currentUsuario.email}
                    onChange={handleChange}
                    placeholder="joao@exemplo.com"
                    sx={{ bgcolor: "white" }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    name="telefone"
                    value={currentUsuario.telefone}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    sx={{ bgcolor: "white" }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={editMode ? "Nova Senha (opcional)" : "Senha *"}
                    name="senha"
                    type="password"
                    value={currentUsuario.senha}
                    onChange={handleChange}
                    placeholder="••••••••"
                    helperText={
                      editMode
                        ? "Deixe em branco para manter a senha atual"
                        : "Mínimo 6 caracteres"
                    }
                    sx={{ bgcolor: "white" }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* SEÇÃO 2: INFORMAÇÕES PROFISSIONAIS */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                bgcolor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#1f2937",
                  mb: 3,
                  fontSize: "16px",
                }}
              >
                💼 Informações Profissionais
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required sx={{ bgcolor: "white" }}>
                    <InputLabel>Perfil de Acesso</InputLabel>
                    <Select
                      name="perfil"
                      value={currentUsuario.perfil}
                      onChange={handleChange}
                      label="Perfil de Acesso"
                    >
                      {PERFIS.map((perfil) => (
                        <MenuItem key={perfil} value={perfil}>
                          {perfil}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Cargo"
                    name="cargo"
                    value={currentUsuario.cargo}
                    onChange={handleChange}
                    placeholder="Ex: Vendedor"
                    sx={{ bgcolor: "white" }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth sx={{ bgcolor: "white" }}>
                    <InputLabel>Departamento</InputLabel>
                    <Select
                      name="departamento"
                      value={currentUsuario.departamento}
                      onChange={handleChange}
                      label="Departamento"
                    >
                      {DEPARTAMENTOS.map((dept) => (
                        <MenuItem key={dept} value={dept}>
                          {dept}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* SEÇÃO 3: STATUS */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#1f2937",
                  mb: 3,
                  fontSize: "16px",
                }}
              >
                ⚙️ Status
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    name="ativo"
                    checked={currentUsuario.ativo}
                    onChange={handleChange}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#16a34a",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          bgcolor: "#16a34a",
                        },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Usuário Ativo
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#6b7280" }}>
                      {currentUsuario.ativo
                        ? "Este usuário pode acessar o sistema"
                        : "Acesso ao sistema bloqueado"}
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            borderTop: "1px solid #e5e7eb",
            bgcolor: "#fafafa",
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
            {editMode ? "Atualizar Usuário" : "Salvar Usuário"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Usuarios;
