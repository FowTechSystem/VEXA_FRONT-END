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
  Divider,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Person,
  CameraAlt,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
  ArrowBack,
  Home as HomeIcon,
  Extension,
  Settings,
} from "@mui/icons-material";
import api from "../api/axiosConfig";
import { usuariosService } from "../api/usuariosService";
import { showSuccess, showError } from "../utils/notifications";
import { alpha } from "@mui/material/styles";
import {
  successMessages,
  errorMessages,
  entityNames,
} from "../utils/entityMessages";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [openValidacaoModal, setOpenValidacaoModal] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState("");

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const usuariosPorPagina = 10;

  // Metadados vindos da API
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [carregando, setCarregando] = useState(false);

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
    "& .MuiInputLabel-root": { color: "text.secondary" },
    "& .MuiSelect-select": { py: 1.25, fontSize: "0.875rem" },
  };
  const DEPARTAMENTOS = [
    "Vendas",
    "Marketing",
    "Suporte",
    "Financeiro",
    "TI",
    "RH",
  ];

  // Cálculos para exibição "Mostrando X a Y de Z"
  const indiceInicial =
    totalRegistros === 0 ? 0 : (paginaAtual - 1) * usuariosPorPagina + 1;
  const indiceFinal = Math.min(paginaAtual * usuariosPorPagina, totalRegistros);

  // Funções de navegação de página
  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  // Buscar usuários da API com paginação e busca
  const fetchUsuarios = async () => {
    setCarregando(true);
    try {
      const res = await usuariosService.getAll({
        pagina: paginaAtual,
        tamanho: usuariosPorPagina,
        valor: searchTerm.trim() || undefined,
      });
      setUsuarios(res.usuarios);
      setTotalRegistros(res.totalRegistros);
      setTotalPaginas(res.totalPaginas);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      showError(errorMessages.fetch(entityNames.usuarios), { id: "fetch-usuarios" });
      setUsuarios([]);
      setTotalRegistros(0);
      setTotalPaginas(0);
    } finally {
      setCarregando(false);
    }
  };

  // Recarrega sempre que mudar página ou termo de busca
  useEffect(() => {
    fetchUsuarios();
  }, [paginaAtual, searchTerm]);

  // Recarregar após criar/editar/excluir
  const recarregarUsuarios = async () => {
    setPaginaAtual(1);
    await fetchUsuarios();
  };

  // Busca: não filtra no cliente, só atualiza estado
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPaginaAtual(1);
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

  const handleSave = async () => {
    const faltando = [];
    if (!currentUsuario.nome?.trim()) faltando.push("Nome");
    if (!currentUsuario.email?.trim()) faltando.push("Email");
    if (!editMode && !currentUsuario.senha) faltando.push("Senha");
    if (!currentUsuario.perfil) faltando.push("Perfil de Acesso");

    if (faltando.length > 0) {
      setMensagemValidacao("Faltam: " + faltando.join(", ") + ".");
      setOpenValidacaoModal(true);
      return;
    }

    try {
      if (editMode) {
        await api.put(`/usuarios/${currentUsuario.id}`, currentUsuario);
        showSuccess(successMessages.update(entityNames.usuario));
      } else {
        await api.post("/usuarios", currentUsuario);
        showSuccess(successMessages.create(entityNames.usuario));
      }
      recarregarUsuarios();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);

      if (error.response) {
        const errorData = error.response.data;
        if (errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          showError(firstError[0] || errorMessages.create(entityNames.usuario));
        } else {
          showError(
            errorData.message || errorMessages.create(entityNames.usuario),
          );
        }
      } else {
        showError(
          editMode
            ? errorMessages.update(entityNames.usuario)
            : errorMessages.create(entityNames.usuario),
        );
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este usuário?")) {
      try {
        await api.delete(`/usuarios/${id}`);
        showSuccess(successMessages.delete(entityNames.usuario));
        recarregarUsuarios();
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        showError(errorMessages.delete(entityNames.usuario));
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
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh", color: "text.primary", ...(openDialog ? { display: "flex", flexDirection: "column", overflow: "hidden" } : {}) }}>
      {!openDialog ? (
        <>
          {/* Header listagem */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
                Usuários
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenDialog()}
                sx={{
                  textTransform: "none",
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
                    <Search sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: "background.paper",
                borderRadius: "10px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "divider" },
                  "&:hover fieldset": { borderColor: "divider" },
                  "&.Mui-focused fieldset": { borderWidth: "1px", borderColor: "primary.main" },
                },
              }}
            />

            <Typography
              variant="body2"
              sx={{ mt: 2, color: "text.secondary", fontSize: "14px" }}
            >
              {totalRegistros} {totalRegistros === 1 ? "usuário" : "usuários"}
            </Typography>
          </Box>

          {/* Tabela */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          maxHeight: "70vh",
          overflow: "auto",
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
                USUÁRIO
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                EMAIL
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                PERFIL
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                STATUS
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                AÇÕES
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carregando ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  Carregando...
                </TableCell>
              </TableRow>
            ) : Array.isArray(usuarios) && usuarios.length > 0 ? (
              usuarios.map((usuario, index) => (
                <TableRow
                  key={usuario.id}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom:
                      index === usuarios.length - 1
                        ? "none"
                        : "1px solid",
                    borderColor: "divider",
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
                        sx={{ fontWeight: 500, color: "text.primary" }}
                      >
                        {usuario.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "14px" }}>
                    {usuario.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={usuario.perfil || "Sem perfil"}
                      size="small"
                      sx={{
                        bgcolor: "action.hover",
                        color: "text.primary",
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
                        bgcolor: usuario.ativo ? "success.light" : "action.hover",
                        color: usuario.ativo ? "success.dark" : "text.secondary",
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
                        color: "text.secondary",
                        "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(usuario.id)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { bgcolor: "error.light", color: "error.main" },
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
                  sx={{ py: 8, color: "text.secondary" }}
                >
                  <Person sx={{ fontSize: 48, mb: 2, opacity: 0.5, color: "text.secondary" }} />
                  <Typography variant="body1" sx={{ color: "text.primary" }}>
                    Nenhum usuário encontrado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                    Clique em "Novo Usuário" para cadastrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Controles de Paginação */}
        {totalRegistros > 0 && (
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
              Mostrando {indiceInicial} a {indiceFinal} de {totalRegistros}{" "}
              {totalRegistros === 1 ? "usuário" : "usuários"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* Botão Primeira Página */}
              <IconButton
                onClick={irParaPrimeiraPagina}
                disabled={paginaAtual === 1}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <FirstPage fontSize="small" />
              </IconButton>

              {/* Botão Página Anterior */}
              <IconButton
                onClick={irParaPaginaAnterior}
                disabled={paginaAtual === 1}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>

              {/* Números de Página */}
              <Box sx={{ display: "flex", gap: 0.5, mx: 1 }}>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (numeroPagina) => {
                    // Mostra apenas páginas próximas à atual
                    if (
                      numeroPagina === 1 ||
                      numeroPagina === totalPaginas ||
                      (numeroPagina >= paginaAtual - 1 &&
                        numeroPagina <= paginaAtual + 1)
                    ) {
                      return (
                        <Button
                          key={numeroPagina}
                          onClick={() => setPaginaAtual(numeroPagina)}
                          size="small"
                          variant={paginaAtual === numeroPagina ? "contained" : "text"}
                          sx={{
                            minWidth: "32px",
                            height: "32px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: paginaAtual === numeroPagina ? "primary.contrastText" : "text.secondary",
                            "&:hover": {
                              bgcolor: paginaAtual === numeroPagina ? "primary.dark" : "action.hover",
                            },
                          }}
                        >
                          {numeroPagina}
                        </Button>
                      );
                    } else if (
                      numeroPagina === paginaAtual - 2 ||
                      numeroPagina === paginaAtual + 2
                    ) {
                      return (
                        <Typography
                          key={numeroPagina}
                          sx={{ px: 1, color: "text.secondary" }}
                        >
                          ...
                        </Typography>
                      );
                    }
                    return null;
                  },
                )}
              </Box>

              {/* Botão Próxima Página */}
              <IconButton
                onClick={irParaProximaPagina}
                disabled={paginaAtual >= totalPaginas}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>

              {/* Botão Última Página */}
              <IconButton
                onClick={irParaUltimaPagina}
                disabled={paginaAtual >= totalPaginas}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
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
        /* Tela inteira: formulário de cadastro */
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
              flexShrink: 0,
            }}
          >
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
              {editMode ? "Editar Usuário" : "Novo Usuário"}
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            sx={{
              flex: 1,
              overflow: "auto",
              pr: 1,
            }}
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
              {/* Avatar */}
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pb: 3, mb: 3, borderBottom: 1, borderColor: "divider" }}>
                <Avatar sx={{ width: 100, height: 100, bgcolor: "action.hover", mb: 1.5 }}>
                  <Person sx={{ fontSize: 50, color: "text.secondary" }} />
                </Avatar>
                <Button startIcon={<CameraAlt />} sx={{ textTransform: "none", color: "text.secondary", fontSize: "13px" }}>
                  Adicionar Foto
                </Button>
              </Box>

              {/* Seção Geral */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Person fontSize="small" /> Geral
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Nome" name="nome" value={currentUsuario.nome} onChange={handleChange} placeholder="Nome completo do usuário" size="small" sx={requiredFieldSx} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="CPF" name="cpf" value={currentUsuario.cpf} onChange={handleChange} placeholder="000.000.000-00" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="RG" name="rg" value={currentUsuario.rg || ""} onChange={handleChange} placeholder="RG" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="CNPJ" name="cnpj" value={currentUsuario.cnpj || ""} onChange={handleChange} placeholder="00.000.000/0000-00" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Data Nascimento" name="dataNascimento" type="date" value={currentUsuario.dataNascimento} onChange={handleChange} InputLabelProps={{ shrink: true }} size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="WhatsApp" name="telefone" value={currentUsuario.telefone} onChange={handleChange} placeholder="(00) 00000-0000" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={selectFieldSx}>
                    <InputLabel id="tipo-tel-label">Tipo de telefone</InputLabel>
                    <Select labelId="tipo-tel-label" label="Tipo de telefone" defaultValue="Celular">
                      <MenuItem value="Celular">Celular</MenuItem>
                      <MenuItem value="Fixo">Fixo</MenuItem>
                      <MenuItem value="Comercial">Comercial</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Telefone" placeholder="(00) 0000-0000" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={selectFieldSx}>
                    <InputLabel id="tipo-email-label">Tipo de e-mail</InputLabel>
                    <Select labelId="tipo-email-label" label="Tipo de e-mail" defaultValue="Email">
                      <MenuItem value="Email">E-mail</MenuItem>
                      <MenuItem value="Pessoal">Pessoal</MenuItem>
                      <MenuItem value="Comercial">Comercial</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Email" name="email" type="email" value={currentUsuario.email} onChange={handleChange} placeholder="usuario@exemplo.com" size="small" sx={requiredFieldSx} />
                </Grid>
              </Grid>

              {/* Seção Endereço */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <HomeIcon fontSize="small" /> Endereço
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="CEP" name="cep" value={currentUsuario.endereco.cep} onChange={handleEnderecoChange} placeholder="00000-000" size="small" />
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField fullWidth label="Endereço" name="rua" value={currentUsuario.endereco.rua} onChange={handleEnderecoChange} placeholder="Rua, Avenida..." size="small" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Número" name="numero" value={currentUsuario.endereco.numero} onChange={handleEnderecoChange} placeholder="Nº" size="small" />
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField fullWidth label="Complemento" name="complemento" value={currentUsuario.endereco.complemento} onChange={handleEnderecoChange} placeholder="Apto, Bloco, etc" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Bairro" name="bairro" value={currentUsuario.endereco.bairro} onChange={handleEnderecoChange} placeholder="Bairro" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Cidade" name="cidade" value={currentUsuario.endereco.cidade} onChange={handleEnderecoChange} placeholder="Cidade" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={selectFieldSx}>
                    <InputLabel id="estado-label" shrink>Estado (UF)</InputLabel>
                    <Select
                      name="estado"
                      value={currentUsuario.endereco.estado}
                      onChange={handleEnderecoChange}
                      label="Estado (UF)"
                      labelId="estado-label"
                      displayEmpty
                      renderValue={(v) => v || "Selecione o estado"}
                    >
                      <MenuItem value="">Selecione o estado</MenuItem>
                      <MenuItem value="SP">São Paulo</MenuItem>
                      <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                      <MenuItem value="MG">Minas Gerais</MenuItem>
                      <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                      <MenuItem value="BA">Bahia</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="País" defaultValue="Brasil" size="small" />
                </Grid>
              </Grid>

              {/* Seção Extras */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Extension fontSize="small" /> Extras
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required size="small" sx={[selectFieldSx, requiredFieldSx]}>
                    <InputLabel id="perfil-label" shrink>Perfil de Acesso</InputLabel>
                    <Select
                      name="perfil"
                      value={currentUsuario.perfil}
                      onChange={handleChange}
                      label="Perfil de Acesso"
                      labelId="perfil-label"
                      displayEmpty
                      renderValue={(v) => v || "Selecione o perfil"}
                    >
                      <MenuItem value="">Selecione o perfil</MenuItem>
                      {PERFIS.map((p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Cargo" name="cargo" value={currentUsuario.cargo} onChange={handleChange} placeholder="Ex: Vendedor" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={selectFieldSx}>
                    <InputLabel id="dept-label">Departamento</InputLabel>
                    <Select name="departamento" value={currentUsuario.departamento} onChange={handleChange} label="Departamento" labelId="dept-label">
                      {DEPARTAMENTOS.map((d) => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label={editMode ? "Nova Senha (opcional)" : "Senha"} name="senha" type="password" value={currentUsuario.senha} onChange={handleChange} placeholder="••••••••" helperText={editMode ? "Deixe em branco para manter a senha atual" : "Mínimo 6 caracteres"} size="small" sx={!editMode ? requiredFieldSx : undefined} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Observações" name="observacoes" value={currentUsuario.observacoes} onChange={handleChange} placeholder="Informações adicionais" multiline rows={4} size="small" />
                </Grid>
              </Grid>

              {/* Seção Configurações */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Settings fontSize="small" /> Configurações
              </Typography>
              <Box sx={{ py: 2 }}>
                <FormControlLabel
                  control={<Switch name="ativo" checked={currentUsuario.ativo} onChange={handleChange} color="success" />}
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>Usuário Ativo</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{currentUsuario.ativo ? "Este usuário pode acessar o sistema" : "Acesso bloqueado"}</Typography>
                    </Box>
                  }
                />
                <Divider sx={{ my: 3 }} />
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 2, color: "text.primary" }}>Permissões de Acesso</Typography>
                <FormControlLabel control={<Switch defaultChecked size="small" />} label="Visualizar relatórios" />
                <FormControlLabel control={<Switch defaultChecked size="small" />} label="Gerenciar clientes" />
                <FormControlLabel control={<Switch size="small" />} label="Acesso financeiro" />
                <FormControlLabel control={<Switch size="small" />} label="Configurações do sistema" />
              </Box>
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2, pb: 2, flexShrink: 0 }}>
              <Button onClick={handleCloseDialog} sx={{ textTransform: "none", color: "text.secondary" }}>Cancelar</Button>
              <Button type="submit" variant="contained" sx={{ textTransform: "none", px: 4 }}>Salvar</Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Modal: campos obrigatórios faltando */}
      <Dialog
        open={openValidacaoModal}
        onClose={() => setOpenValidacaoModal(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setOpenValidacaoModal(false);
          }
        }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 360 } }}
        aria-labelledby="validacao-dialog-title"
      >
        <DialogTitle id="validacao-dialog-title" sx={{ fontWeight: 600 }}>
          Campos obrigatórios
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.primary", fontSize: "14px" }}>
            {mensagemValidacao}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setOpenValidacaoModal(false)}
            onKeyDown={(e) => e.key === "Enter" && setOpenValidacaoModal(false)}
            sx={{ textTransform: "none", minWidth: 100 }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Usuarios;
