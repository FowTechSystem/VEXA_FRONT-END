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
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Person,
  Close,
  CameraAlt,
} from "@mui/icons-material";
import api from "../api/axiosConfig";

// Componente TabPanel
function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [currentUsuario, setCurrentUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    perfil: "",
    telefone: "",
    cargo: "",
    departamento: "",
    ativo: true,
    cpf: "",
    dataNascimento: "",
    endereco: {
      cep: "",
      rua: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
    },
    observacoes: "",
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
          usuario.perfil?.toLowerCase().includes(termo),
      );
      setUsuariosFiltrados(filtrados);
    }
  };

  const handleOpenDialog = (usuario = null) => {
    if (usuario) {
      setCurrentUsuario({
        ...usuario,
        endereco: usuario.endereco || {
          cep: "",
          rua: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
        },
      });
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
        cpf: "",
        dataNascimento: "",
        endereco: {
          cep: "",
          rua: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
        },
        observacoes: "",
      });
      setEditMode(false);
    }
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setTabValue(0);
  };

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setCurrentUsuario({
      ...currentUsuario,
      [name]: e.target.type === "checkbox" ? checked : value,
    });
  };

  const handleEnderecoChange = (e) => {
    const { name, value } = e.target;
    setCurrentUsuario({
      ...currentUsuario,
      endereco: {
        ...currentUsuario.endereco,
        [name]: value,
      },
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

      {/* Dialog - Formulário com Abas */}
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
          {editMode ? "Editar Usuário" : "Novo Usuário"}
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
            sx={{
              width: 100,
              height: 100,
              bgcolor: "#d1d5db",
              mb: 1.5,
            }}
          >
            <Person sx={{ fontSize: 50, color: "#fff" }} />
          </Avatar>
          <Button
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
            },
            "& .Mui-selected": {
              color: "#2563eb",
            },
          }}
        >
          <Tab
            icon={<Person sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Geral"
          />
          <Tab
            icon={<span style={{ fontSize: 18 }}>🏠</span>}
            iconPosition="start"
            label="Endereço"
          />
          <Tab
            icon={<span style={{ fontSize: 18 }}>➕</span>}
            iconPosition="start"
            label="Extras"
          />
          <Tab
            icon={<span style={{ fontSize: 18 }}>💳</span>}
            iconPosition="start"
            label="Configurações"
          />
        </Tabs>

        <DialogContent sx={{ p: 0 }}>
          {/* ABA 1: GERAL */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Nome**"
                  name="nome"
                  value={currentUsuario.nome}
                  onChange={handleChange}
                  placeholder="Nome completo do usuário"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="CPF"
                  name="cpf"
                  value={currentUsuario.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="RG"
                  name="rg"
                  value={currentUsuario.rg || ""}
                  onChange={handleChange}
                  placeholder="RG"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="CNPJ"
                  name="cnpj"
                  placeholder="00.000.000/0000-00"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data Nascimento**"
                  name="dataNascimento"
                  type="date"
                  value={currentUsuario.dataNascimento}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  placeholder="dd/mm/aaaa"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  name="telefone"
                  value={currentUsuario.telefone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select label="Tipo" defaultValue="Celular">
                    <MenuItem value="Celular">Celular</MenuItem>
                    <MenuItem value="Fixo">Fixo</MenuItem>
                    <MenuItem value="Comercial">Comercial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  placeholder="(00) 0000-0000"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo Email</InputLabel>
                  <Select label="Tipo Email" defaultValue="Email">
                    <MenuItem value="Email">Email</MenuItem>
                    <MenuItem value="Pessoal">Pessoal</MenuItem>
                    <MenuItem value="Comercial">Comercial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Email"
                  name="email"
                  type="email"
                  value={currentUsuario.email}
                  onChange={handleChange}
                  placeholder="usuario@exemplo.com"
                  size="small"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ABA 2: ENDEREÇO */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="CEP"
                  name="cep"
                  value={currentUsuario.endereco.cep}
                  onChange={handleEnderecoChange}
                  placeholder="00000-000"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Endereço"
                  name="rua"
                  value={currentUsuario.endereco.rua}
                  onChange={handleEnderecoChange}
                  placeholder="Rua, Avenida..."
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Número"
                  name="numero"
                  value={currentUsuario.endereco.numero}
                  onChange={handleEnderecoChange}
                  placeholder="Nº"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Complemento"
                  name="complemento"
                  value={currentUsuario.endereco.complemento}
                  onChange={handleEnderecoChange}
                  placeholder="Apto, Bloco, etc"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bairro"
                  name="bairro"
                  value={currentUsuario.endereco.bairro}
                  onChange={handleEnderecoChange}
                  placeholder="Bairro"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  name="cidade"
                  value={currentUsuario.endereco.cidade}
                  onChange={handleEnderecoChange}
                  placeholder="Cidade"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    name="estado"
                    value={currentUsuario.endereco.estado}
                    onChange={handleEnderecoChange}
                    label="Estado"
                  >
                    <MenuItem value="SP">São Paulo</MenuItem>
                    <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                    <MenuItem value="MG">Minas Gerais</MenuItem>
                    <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                    <MenuItem value="BA">Bahia</MenuItem>
                    {/* Adicione outros estados conforme necessário */}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="País"
                  defaultValue="Brasil"
                  size="small"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ABA 3: EXTRAS (Informações Profissionais) */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required size="small">
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

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cargo"
                  name="cargo"
                  value={currentUsuario.cargo}
                  onChange={handleChange}
                  placeholder="Ex: Vendedor"
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
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
                  size="small"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observações"
                  name="observacoes"
                  value={currentUsuario.observacoes}
                  onChange={handleChange}
                  placeholder="Informações adicionais sobre o usuário"
                  multiline
                  rows={4}
                  size="small"
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ABA 4: CONFIGURAÇÕES (Status) */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ py: 2 }}>
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

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="body2"
                sx={{ fontWeight: 500, mb: 2, color: "#374151" }}
              >
                Permissões de Acesso
              </Typography>

              <FormControlLabel
                control={<Switch defaultChecked size="small" />}
                label="Visualizar relatórios"
              />
              <FormControlLabel
                control={<Switch defaultChecked size="small" />}
                label="Gerenciar clientes"
              />
              <FormControlLabel
                control={<Switch size="small" />}
                label="Acesso financeiro"
              />
              <FormControlLabel
                control={<Switch size="small" />}
                label="Configurações do sistema"
              />
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

export default Usuarios;
