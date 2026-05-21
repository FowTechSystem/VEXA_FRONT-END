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
  FormHelperText,
  Divider,
  Autocomplete,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Person,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
  ArrowBack,
  Home as HomeIcon,
  Extension,
  Settings,
} from "@mui/icons-material";
import { LoadingBox } from "../components/LoadingBox";
import { FotoPerfilPicker } from "../components/FotoPerfilPicker";
import VexaDatePicker from "../components/VexaDatePicker";
import api from "../api/axiosConfig";
import { usuariosService } from "../api/usuariosService";
import { listarPermissoes } from "../api/permissoesService";
import { showSuccess, showError } from "../utils/notifications";
import {
  successMessages,
  errorMessages,
  entityNames,
  confirmMessages,
} from "../utils/entityMessages";
import { validateCPF } from "../utils/validators";

// Todos os estados do Brasil (UF + nome) para busca
const ESTADOS_BR = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

function Usuarios() {
  const theme = useTheme();
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [openValidacaoModal, setOpenValidacaoModal] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);
  const [excluindoUsuario, setExcluindoUsuario] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

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
    login: "",
    senha: "",
    perfil: "",
    telefone: "",
    whatsApp: "",
    cargo: "",
    departamento: "",
    ativo: true,
    cpf: "",
    rg: "",
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
    permissaoIds: [],
  });
  const [permissoes, setPermissoes] = useState([]);

  const PERFIS = ["Administrador", "Gerente", "Vendedor", "Suporte"];
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

  useEffect(() => {
    listarPermissoes().then(setPermissoes).catch(() => setPermissoes([]));
  }, []);

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

  const handlePhotoReady = ({ dataUrl, file }) => {
    setFotoPreview(dataUrl);
    if (file) setFotoFile(file);
  };

  const handleOpenDialog = async (usuario = null) => {
    if (usuario?.id) {
      try {
        const full = await usuariosService.getById(usuario.id);
        usuario = full;
      } catch (err) {
        console.warn("Erro ao carregar usuário, usando dados da lista:", err);
      }
    }
    if (usuario?.id) {
      const end = (usuario.enderecos && usuario.enderecos[0]) || usuario.endereco || {};
      const dataNasc = usuario.dataNascimento ? String(usuario.dataNascimento).split("T")[0] : "";
      setCurrentUsuario({
        ...usuario,
        fotoUrl:
          usuario.fotoUrl ||
          usuario.avatarUrl ||
          usuario.urlFoto ||
          usuario.foto ||
          "",
        login: usuario.login || usuario.email || "",
        whatsApp: usuario.whatsApp || usuario.telefone || "",
        rg: usuario.rg || "",
        dataNascimento: dataNasc,
        endereco: {
          id: end.id,
          cep: end.cep || "",
          rua: end.rua || "",
          numero: end.numero || "",
          complemento: end.complemento || "",
          bairro: end.bairro || "",
          cidade: end.cidade || "",
          estado: end.estado || "",
        },
        permissaoIds: Array.isArray(usuario.permissaoIds) ? usuario.permissaoIds : [],
        senha: "",
      });
      setFotoPreview(
        usuario.fotoUrl ||
          usuario.avatarUrl ||
          usuario.urlFoto ||
          usuario.foto ||
          null,
      );
      setFotoFile(null);
      setEditMode(true);
    } else {
      setCurrentUsuario({
        nome: "",
        email: "",
        login: "",
        senha: "",
        perfil: "",
        telefone: "",
        whatsApp: "",
        cargo: "",
        departamento: "",
        ativo: true,
        cpf: "",
        rg: "",
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
        permissaoIds: [],
      });
      setFotoPreview(null);
      setFotoFile(null);
      setEditMode(false);
    }
    setCpfError("");
    setCepLoading(false);
    setOpenDialog(true);
  };

  const toApiPayload = (u, isCreate) => {
    const e = u.endereco || {};
    const enderecos = (e.cep || e.rua) ? [{
      id: e.id ?? null,
      cep: e.cep || "",
      rua: e.rua || "",
      numero: String(e.numero || ""),
      complemento: e.complemento || "",
      bairro: e.bairro || "",
      cidade: e.cidade || "",
      estado: e.estado || "",
    }] : [];
    const dataNasc = u.dataNascimento ? (u.dataNascimento.includes("T") ? u.dataNascimento : `${u.dataNascimento}T00:00:00Z`) : null;
    const base = {
      nome: u.nome?.trim() || "",
      email: u.email?.trim() || "",
      login: (u.login || u.email || "").trim(),
      cargo: u.cargo?.trim() || "",
      cpf: (u.cpf || "").replace(/\D/g, "") || undefined,
      rg: u.rg?.trim() || undefined,
      telefone: u.telefone?.trim() || undefined,
      whatsApp: (u.whatsApp || u.telefone || "").replace(/\D/g, "") || undefined,
      dataNascimento: dataNasc,
      perfil: u.perfil || undefined,
      departamento: u.departamento || undefined,
      observacoes: u.observacoes?.trim() || undefined,
      ativo: u.ativo !== false,
      permissaoIds: Array.isArray(u.permissaoIds) ? u.permissaoIds : [],
      podeVender: false,
      podeEditarEstoque: false,
      podeEditarProduto: false,
      podeAbrirFecharCaixa: false,
      podeEmitirRelatorios: (u.permissaoIds || []).some((id) => {
        const p = permissoes.find((x) => x.id === id);
        return p && (String(p.codigo || p.nome || "").toLowerCase().includes("relatorio") || String(p.nome || "").toLowerCase().includes("visualizar"));
      }),
      podeCadastrarFornecedores: false,
      enderecos,
    };
    if (isCreate) {
      base.senhaHash = u.senha || "";
      base.fotoBase64 = u.fotoBase64 ?? null;
    } else {
      base.id = u.id;
      base.novaSenha = u.senha?.trim() ? u.senha : null;
      base.fotoUrl = u.fotoUrl ?? null;
      base.fotoBase64 = null;
    }
    return base;
  };

  const togglePermissao = (permId) => {
    setCurrentUsuario((prev) => {
      const ids = prev.permissaoIds || [];
      const has = ids.includes(permId);
      return {
        ...prev,
        permissaoIds: has ? ids.filter((id) => id !== permId) : [...ids, permId],
      };
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFotoPreview(null);
    setFotoFile(null);
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
    const nextVal =
      name === "cep" ? String(value).replace(/\D/g, "").slice(0, 8) : value;
    setCurrentUsuario({
      ...currentUsuario,
      endereco: {
        ...currentUsuario.endereco,
        [name]: nextVal,
      },
    });
  };

  const handleCpfBlur = () => {
    const cpf = (currentUsuario.cpf || "").replace(/[^\d]/g, "");
    if (cpf.length === 0) {
      setCpfError("");
      return;
    }
    if (cpf.length !== 11) {
      setCpfError("CPF deve ter 11 dígitos.");
      return;
    }
    const result = validateCPF(currentUsuario.cpf);
    setCpfError(result.valid ? "" : result.message);
  };

  const buscarCep = async () => {
    const cep = (currentUsuario.endereco?.cep || "").replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    setCpfError("");
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      if (!res.ok) throw new Error("CEP não encontrado");
      const data = await res.json();
      setCurrentUsuario({
        ...currentUsuario,
        endereco: {
          ...currentUsuario.endereco,
          cep: currentUsuario.endereco.cep,
          rua: data.street || data.logradouro || currentUsuario.endereco.rua,
          bairro: data.neighborhood || data.bairro || currentUsuario.endereco.bairro,
          cidade: data.city || data.localidade || currentUsuario.endereco.cidade,
          estado: (data.state || data.uf || "").toUpperCase() || currentUsuario.endereco.estado,
          numero: currentUsuario.endereco.numero,
          complemento: currentUsuario.endereco.complemento,
        },
      });
    } catch (err) {
      showError("CEP não encontrado. Verifique e tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepBlur = () => {
    const cep = (currentUsuario.endereco?.cep || "").replace(/\D/g, "");
    if (cep.length === 8) buscarCep();
  };

  const estadoOption = ESTADOS_BR.find(
    (e) => e.sigla === (currentUsuario.endereco?.estado || "")
  ) || null;

  const handleSave = async () => {
    const faltando = [];
    if (!currentUsuario.nome?.trim()) faltando.push("Nome");
    if (!currentUsuario.email?.trim()) faltando.push("Email");
    if (!editMode && !currentUsuario.senha) faltando.push("Senha");
    if (!currentUsuario.perfil) faltando.push("Perfil de Acesso");
    if (!currentUsuario.cargo?.trim()) faltando.push("Cargo");

    const cpfDigits = (currentUsuario.cpf || "").replace(/[^\d]/g, "");
    if (cpfDigits.length > 0) {
      const result = validateCPF(currentUsuario.cpf);
      if (!result.valid) {
        setCpfError(result.message);
        showError(result.message);
        return;
      }
    }

    if (faltando.length > 0) {
      setMensagemValidacao("Faltam: " + faltando.join(", ") + ".");
      setOpenValidacaoModal(true);
      return;
    }

    try {
      let fotoBase64 = null;
      let fotoUrl = currentUsuario.fotoUrl || null;

      if (fotoFile) {
        if (editMode) {
          const uploadResult = await usuariosService.uploadFoto(fotoFile);
          const novaUrl =
            uploadResult?.url ??
            uploadResult?.fotoUrl ??
            uploadResult?.path ??
            uploadResult?.location ??
            (typeof uploadResult === "string" ? uploadResult : null);
          if (novaUrl) {
            fotoUrl = novaUrl;
          } else {
            console.warn(
              "[Usuarios] POST /usuarios/upload-foto: resposta sem URL conhecida",
              uploadResult,
            );
            showError(
              "A foto foi enviada, mas a API não retornou a URL no formato esperado (url, fotoUrl ou path). Verifique o backend.",
            );
            return;
          }
        } else {
          fotoBase64 = fotoPreview?.includes(",") ? fotoPreview.split(",")[1] : null;
        }
      }

      const payload = toApiPayload(
        {
          ...currentUsuario,
          fotoBase64: editMode ? null : fotoBase64,
          fotoUrl: editMode ? fotoUrl : undefined,
        },
        !editMode,
      );

      if (editMode) {
        await usuariosService.update(currentUsuario.id, payload);
        showSuccess(successMessages.update(entityNames.usuario));
      } else {
        await usuariosService.create(payload);
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

  const handleAbrirConfirmExcluir = (usuario) => {
    setUsuarioParaExcluir({ id: usuario.id, nome: usuario.nome || "" });
    setOpenConfirmDelete(true);
  };

  const handleFecharConfirmExcluir = () => {
    if (excluindoUsuario) return;
    setOpenConfirmDelete(false);
    setUsuarioParaExcluir(null);
  };

  const handleConfirmarExcluir = async () => {
    if (!usuarioParaExcluir?.id) return;
    setExcluindoUsuario(true);
    try {
      await api.delete(`/usuarios/${usuarioParaExcluir.id}`);
      showSuccess(successMessages.delete(entityNames.usuario));
      recarregarUsuarios();
      setOpenConfirmDelete(false);
      setUsuarioParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      showError(errorMessages.delete(entityNames.usuario));
    } finally {
      setExcluindoUsuario(false);
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
      "#F8F32B",
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
                <TableCell colSpan={5} align="center">
                  <LoadingBox size={40} py={8} />
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
                      onClick={() => handleAbrirConfirmExcluir(usuario)}
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
                <Avatar src={fotoPreview || undefined} sx={{ width: 100, height: 100, bgcolor: "action.hover", mb: 1.5 }}>
                  {!fotoPreview && <Person sx={{ fontSize: 50, color: "text.secondary" }} />}
                </Avatar>
                <FotoPerfilPicker
                  onPhotoReady={handlePhotoReady}
                  onError={showError}
                  sx={{ mt: 0.5, width: "100%", maxWidth: 320 }}
                />
              </Box>

              {/* Seção Geral */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <Person fontSize="small" /> Geral
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                  <TextField fullWidth required label="Nome" name="nome" value={currentUsuario.nome} onChange={handleChange} placeholder="Nome completo do usuário" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CPF"
                    name="cpf"
                    value={currentUsuario.cpf}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setCurrentUsuario({ ...currentUsuario, cpf: digits });
                      if (cpfError) setCpfError("");
                    }}
                    onBlur={handleCpfBlur}
                    placeholder="00000000000"
                    size="small"
                    error={!!cpfError}
                    helperText={cpfError || "Apenas números (11 dígitos)."}
                    inputProps={{ inputMode: "numeric", maxLength: 11 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="RG" name="rg" value={currentUsuario.rg || ""} onChange={handleChange} placeholder="RG" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <VexaDatePicker
                    label="Data Nascimento"
                    value={currentUsuario.dataNascimento}
                    onChange={(v) =>
                      handleChange({ target: { name: "dataNascimento", value: v } })
                    }
                    fullWidth
                    minWidth={0}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="WhatsApp"
                    name="whatsApp"
                    value={currentUsuario.whatsApp ?? currentUsuario.telefone ?? ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setCurrentUsuario({ ...currentUsuario, whatsApp: digits });
                    }}
                    placeholder="Somente números"
                    size="small"
                    inputProps={{ inputMode: "numeric" }}
                  />
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
                  <TextField
                    fullWidth
                    label="Telefone"
                    name="telefone"
                    value={currentUsuario.telefone ?? ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setCurrentUsuario({ ...currentUsuario, telefone: digits });
                    }}
                    placeholder="Somente números"
                    size="small"
                    inputProps={{ inputMode: "numeric" }}
                  />
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
                  <TextField fullWidth required label="Email" name="email" type="email" value={currentUsuario.email} onChange={handleChange} placeholder="usuario@exemplo.com" size="small" />
                </Grid>
              </Grid>

              {/* Seção Endereço */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <HomeIcon fontSize="small" /> Endereço
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="CEP"
                    name="cep"
                    value={currentUsuario.endereco.cep}
                    onChange={handleEnderecoChange}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    size="small"
                    helperText="Digite o CEP (8 dígitos) e saia do campo para preencher o endereço automaticamente."
                    InputProps={{
                      endAdornment: cepLoading ? (
                        <InputAdornment position="end">
                          <CircularProgress size={20} />
                        </InputAdornment>
                      ) : null,
                    }}
                    inputProps={{ maxLength: 9 }}
                  />
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
                  <Autocomplete
                    options={ESTADOS_BR}
                    getOptionLabel={(opt) =>
                      opt ? `${opt.nome} (${opt.sigla})` : ""
                    }
                    value={estadoOption}
                    onChange={(_, newValue) => {
                      setCurrentUsuario({
                        ...currentUsuario,
                        endereco: {
                          ...currentUsuario.endereco,
                          estado: newValue ? newValue.sigla : "",
                        },
                      });
                    }}
                    isOptionEqualToValue={(opt, val) => opt?.sigla === val?.sigla}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Estado (UF)"
                        placeholder="Digite para buscar (ex.: Paraná)"
                        size="small"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1.5,
                            bgcolor: "background.paper",
                          },
                        }}
                      />
                    )}
                  />
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
                  <FormControl fullWidth required size="small" sx={selectFieldSx}>
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
                  <TextField fullWidth required label="Cargo" name="cargo" value={currentUsuario.cargo} onChange={handleChange} placeholder="Ex: Vendedor" size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small" sx={selectFieldSx}>
                    <InputLabel id="departamento-label" shrink>
                      Departamento
                    </InputLabel>
                    <Select
                      labelId="departamento-label"
                      id="departamento-select"
                      name="departamento"
                      label="Departamento"
                      value={currentUsuario.departamento || ""}
                      onChange={handleChange}
                      displayEmpty
                      renderValue={(v) => v || "Selecione o departamento"}
                    >
                      <MenuItem value="">Selecione o departamento</MenuItem>
                      {DEPARTAMENTOS.map((d) => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>Ex.: Vendas, RH, TI</FormHelperText>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required={!editMode} label={editMode ? "Nova Senha (opcional)" : "Senha"} name="senha" type="password" value={currentUsuario.senha} onChange={handleChange} placeholder="••••••••" helperText={editMode ? "Deixe em branco para manter a senha atual" : "Mínimo 6 caracteres"} size="small" />
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
                {permissoes.map((p) => (
                  <FormControlLabel
                    key={p.id}
                    control={
                      <Switch
                        size="small"
                        checked={(currentUsuario.permissaoIds || []).includes(p.id)}
                        onChange={() => togglePermissao(p.id)}
                      />
                    }
                    label={p.nome || p.codigo}
                  />
                ))}
                {permissoes.length === 0 && (
                  <Typography variant="caption" color="text.secondary">Carregando permissões...</Typography>
                )}
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

      <Dialog
        open={openConfirmDelete}
        onClose={handleFecharConfirmExcluir}
        aria-labelledby="confirm-delete-usuario-title"
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 380,
            maxWidth: 440,
            bgcolor: theme.palette.background.paper,
            border: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        <DialogTitle id="confirm-delete-usuario-title" sx={{ fontWeight: 600, color: "text.primary", pb: 1 }}>
          Excluir usuário
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.primary", fontSize: "14px", lineHeight: 1.6 }}>
            {confirmMessages.delete(entityNames.usuario)}
          </Typography>
          {usuarioParaExcluir?.nome ? (
            <Typography
              variant="subtitle2"
              sx={{ mt: 2, fontWeight: 600, color: "text.primary", wordBreak: "break-word" }}
            >
              {usuarioParaExcluir.nome}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            type="button"
            onClick={handleFecharConfirmExcluir}
            disabled={excluindoUsuario}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            color="error"
            onClick={handleConfirmarExcluir}
            disabled={excluindoUsuario}
            sx={{ textTransform: "none", minWidth: 100 }}
          >
            {excluindoUsuario ? "Excluindo…" : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Usuarios;
