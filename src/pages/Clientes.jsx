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
  Avatar,
  Chip,
  CircularProgress,
  Paper,
  InputAdornment,
  useTheme,
  Divider,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  Person,
  Home,
  Extension,
  AccountBalance,
  ArrowBack,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import { LoadingBox } from "../components/LoadingBox";
import { FotoPerfilPicker } from "../components/FotoPerfilPicker";
import { clientesService } from "../api/clientesService";
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

function Clientes() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [clientes, setClientes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openValidacaoModal, setOpenValidacaoModal] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);
  const [excluindoCliente, setExcluindoCliente] = useState(false);

  // Estados para busca e paginação
  const [filtro] = useState("nome");
  const [valorBusca, setValorBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const tamanhoPagina = 10;
  const [carregando, setCarregando] = useState(false);

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

  /**
   * Converte o formulário para o payload da API conforme contrato.
   * POST: endereco como objeto, cpf, fotoBase64.
   * PUT: aceita flat ou endereco; usamos endereco para consistência.
   */
  const toApiPayload = (u, isCreate) => {
    const enderecoRaw =
      u.cep || u.rua
        ? {
            cep: (u.cep || "").replace(/\D/g, "").slice(0, 8) || undefined,
            rua: u.rua?.trim() || undefined,
            numero: u.numero?.trim() || undefined,
            complemento: u.complemento?.trim() || undefined,
            bairro: u.bairro?.trim() || undefined,
            cidade: u.cidade?.trim() || undefined,
          }
        : null;
    const endereco =
      enderecoRaw && Object.values(enderecoRaw).some((v) => v != null && v !== "")
        ? enderecoRaw
        : undefined;

    const base = {
      nomeCompleto: u.nomeCompleto?.trim() || "",
      cpf: (u.cpf || "").replace(/\D/g, "") || null,
      rg: u.rg?.trim() || null,
      cnpj: u.cnpj?.replace(/\D/g, "") || null,
      telefone: (u.telefone || "").replace(/\D/g, "") || null,
      whatsApp: (u.whatsApp || u.telefone || "").replace(/\D/g, "") || null,
      email: u.email?.trim() || null,
      dataNascimento: u.dataNascimento || null,
      preferencias: u.preferencias?.trim() || null,
      observacoes: u.observacoes?.trim() || null,
      fotoBase64: u.fotoBase64 ?? null,
    };

    if (isCreate) {
      const body = { ...base, endereco };
      if (endereco == null) delete body.endereco;
      return body;
    }
    const body = {
      ...base,
      id: u.id,
      fotoUrl: u.fotoUrl ?? null,
      endereco,
    };
    if (endereco == null) delete body.endereco;
    return body;
  };

  // Funções de navegação de página
  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  // Cálculo de índices para exibição
  const indiceInicial = (paginaAtual - 1) * tamanhoPagina;
  const indiceFinal = Math.min(indiceInicial + tamanhoPagina, totalRegistros);

  // VERIFICAR CPF EXISTENTE
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

  // BUSCAR CEP - ViaCEP API
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

  // HANDLERS
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

    if (cnpj.length > 0) {
      setCpfError("");
    }
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

  const handleTelefoneChange = (e) => {
    const telefone = e.target.value.replace(/\D/g, "").slice(0, 11);
    setCurrentCliente({ ...currentCliente, telefone });
  };

  const handleWhatsAppChange = (e) => {
    const whatsApp = e.target.value.replace(/\D/g, "").slice(0, 11);
    setCurrentCliente({ ...currentCliente, whatsApp });
  };

  const fetchClientes = useCallback(async () => {
    setCarregando(true);
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
    } finally {
      setCarregando(false);
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

  const handlePhotoReady = ({ dataUrl, file }) => {
    setFotoPreview(dataUrl);
    if (file) setFotoFile(file);
  };

  const handleOpenDialog = (cliente = null) => {
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
    const faltando = [];
    if (!currentCliente.nomeCompleto?.trim()) faltando.push("Nome");
    if (!currentCliente.dataNascimento?.trim()) faltando.push("Data de Nascimento");

    const cpfDigits = (currentCliente.cpf || "").replace(/\D/g, "");
    const cnpjDigits = (currentCliente.cnpj || "").replace(/\D/g, "");
    const usandoCnpj = cnpjDigits.length > 0;

    if (usandoCnpj) {
      if (cnpjDigits.length !== 14) {
        faltando.push(validationMessages.exactLength("CNPJ", 14));
      } else {
        const cnpjOk = validateCNPJ(currentCliente.cnpj || cnpjDigits);
        if (!cnpjOk.valid) faltando.push(cnpjOk.message);
      }
      if (cpfDigits.length > 0 && cpfDigits.length < 11) {
        faltando.push("Complete o CPF com 11 dígitos ou deixe o CPF em branco ao usar CNPJ.");
      } else if (cpfDigits.length === 11) {
        const cpfOk = validateCPF(currentCliente.cpf || cpfDigits);
        if (!cpfOk.valid) faltando.push(cpfOk.message);
      }
    } else {
      if (!cpfDigits.length) {
        faltando.push("CPF");
      } else {
        const cpfOk = validateCPF(currentCliente.cpf || cpfDigits);
        if (!cpfOk.valid) faltando.push(cpfOk.message);
      }
    }

    if (cpfError || cnpjError) {
      faltando.push("Corrija CPF ou CNPJ antes de salvar");
    }
    if (faltando.length > 0) {
      setMensagemValidacao("Faltam: " + faltando.join(", ") + ".");
      setOpenValidacaoModal(true);
      return;
    }

    try {
      let fotoBase64 = null;
      let fotoUrl = currentCliente.fotoUrl;

      if (fotoFile) {
        if (editMode) {
          const uploadResult = await clientesService.uploadFoto(fotoFile);
          const novaUrl =
            uploadResult?.url ??
            uploadResult?.fotoUrl ??
            uploadResult?.path ??
            uploadResult?.location ??
            (typeof uploadResult === "string" ? uploadResult : null);
          if (novaUrl) {
            fotoUrl = novaUrl;
          } else {
            console.warn("[Clientes] POST /clientes/upload-foto: resposta sem URL conhecida", uploadResult);
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
          ...currentCliente,
          fotoBase64: editMode ? null : fotoBase64,
          fotoUrl: editMode ? fotoUrl : undefined,
        },
        !editMode,
      );

      if (editMode) {
        await clientesService.update(currentCliente.id, payload);
        showSuccess(successMessages.update(entityNames.cliente));
      } else {
        await clientesService.create(payload);
        showSuccess(successMessages.create(entityNames.cliente));
      }

      fetchClientes();
      handleCloseDialog();
    } catch (error) {
      const res = error.response;
      const status = res?.status;
      const errorData = res?.data;
      console.error("[Clientes] Erro ao salvar cliente", {
        status,
        url: res?.config?.url,
        method: res?.config?.method,
        data: errorData,
        payloadEnviado: res?.config?.data,
      });

      const fallback = editMode
        ? errorMessages.update(entityNames.cliente)
        : errorMessages.create(entityNames.cliente);

      if (res && errorData) {
        if (errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          showError(
            Array.isArray(firstError) ? firstError[0] : firstError || fallback,
          );
        } else {
          showError(
            errorData.message ||
              errorData.detail ||
              errorData.title ||
              (typeof errorData === "string" ? errorData : fallback),
          );
        }
      } else {
        showError(fallback);
      }
    }
  };

  const handleAbrirConfirmExcluir = (cliente) => {
    setClienteParaExcluir({ id: cliente.id, nome: cliente.nomeCompleto || "" });
    setOpenConfirmDelete(true);
  };

  const handleFecharConfirmExcluir = () => {
    if (excluindoCliente) return;
    setOpenConfirmDelete(false);
    setClienteParaExcluir(null);
  };

  const handleConfirmarExcluir = async () => {
    if (!clienteParaExcluir?.id) return;
    setExcluindoCliente(true);
    try {
      await clientesService.delete(clienteParaExcluir.id);
      showSuccess(successMessages.delete(entityNames.cliente));
      fetchClientes();
      setOpenConfirmDelete(false);
      setClienteParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      showError(errorMessages.delete(entityNames.cliente));
    } finally {
      setExcluindoCliente(false);
    }
  };

  const handleChange = (e) => {
    setCurrentCliente({
      ...currentCliente,
      [e.target.name]: e.target.value,
    });
  };

  const selectFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1.5,
      bgcolor: theme.palette.background.paper,
      "& fieldset": { borderColor: theme.palette.divider },
      "&:hover fieldset": { borderColor: theme.palette.text.secondary },
      "&.Mui-focused fieldset": { borderWidth: 1, borderColor: theme.palette.primary.main },
    },
    "& .MuiInputLabel-root": { color: theme.palette.text.secondary },
    "& .MuiSelect-select": { py: 1.25, fontSize: "0.875rem" },
  };

  /** Com qualquer dígito em CNPJ: documento principal é CNPJ (estilo obrigatório nele); senão, CPF. */
  const cnpjDigitsSomente = (currentCliente.cnpj || "").replace(/\D/g, "");
  const documentoPrincipalCnpj = cnpjDigitsSomente.length > 0;
  const cpfObrigatorio = !documentoPrincipalCnpj;
  const cnpjObrigatorio = documentoPrincipalCnpj;

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "background.default",
        minHeight: "100vh",
        color: "text.primary",
        ...(openDialog ? { display: "flex", flexDirection: "column", overflow: "hidden" } : {}),
      }}
    >
      {!openDialog ? (
        <>
      {/* Header - mesmo padrão de Usuários */}
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
            {entityNames.clientes}
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
            Novo {entityNames.cliente}
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Buscar por nome, email ou CPF..."
          value={valorBusca}
          onChange={handleBuscaChange}
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

        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary", fontSize: "14px" }}>
          {totalRegistros} {totalRegistros === 1 ? "cliente" : "clientes"}
        </Typography>
      </Box>

      {/* Tabela - mesmo padrão de Usuários */}
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
              <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px", py: 2 }}>
                CLIENTE
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
                EMAIL
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
                CPF
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
                TELEFONE
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>
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
            ) : Array.isArray(clientes) && clientes.length > 0 ? (
              clientes.map((cliente, index) => (
                <TableRow
                  key={cliente.id}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom:
                      index === clientes.length - 1 ? "none" : "1px solid",
                    borderColor: "divider",
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
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                        {cliente.nomeCompleto}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "14px" }}>
                    {cliente.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cliente.cpf || "—"}
                      size="small"
                      sx={{
                        bgcolor: "action.hover",
                        color: "text.primary",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cliente.telefone || cliente.whatsApp || "—"}
                      size="small"
                      sx={{
                        bgcolor: "action.hover",
                        color: "text.primary",
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
                        color: "text.secondary",
                        "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleAbrirConfirmExcluir(cliente)}
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
                <TableCell colSpan={5} align="center" sx={{ py: 8, color: "text.secondary" }}>
                  <Person sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
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
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "14px" }}>
              Mostrando {indiceInicial + 1} a {indiceFinal} de {totalRegistros}{" "}
              {totalRegistros === 1 ? "cliente" : "clientes"}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

              <Box sx={{ display: "flex", gap: 0.5, mx: 1 }}>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (numeroPagina) => {
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

              <IconButton
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": { bgcolor: "action.hover" },
                  "&.Mui-disabled": { color: "text.disabled" },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>

              <IconButton
                onClick={irParaUltimaPagina}
                disabled={paginaAtual === totalPaginas}
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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            bgcolor: theme.palette.background.default,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexShrink: 0 }}>
            <Button startIcon={<ArrowBack />} onClick={handleCloseDialog} sx={{ textTransform: "none", color: theme.palette.text.secondary }}>Voltar</Button>
            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>{editMode ? "Editar Cliente" : "Novo Cliente"}</Typography>
          </Box>
          <Box
            component="form"
            onSubmit={(e) => { e.preventDefault(); handleSave(); }}
            sx={{ flex: 1, overflow: "auto", pr: 1, bgcolor: theme.palette.background.default }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: theme.palette.divider,
                bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : theme.palette.background.paper,
              }}
            >
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
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Person fontSize="small" /> Geral</Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}><TextField fullWidth required label="Nome" name="nomeCompleto" value={currentCliente.nomeCompleto} onChange={handleChange} placeholder="Nome completo do cliente" size="small" /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth required={cpfObrigatorio} label="CPF" name="cpf" value={currentCliente.cpf} onChange={handleCPFChange} error={!!cpfError} helperText={cpfError || ""} size="small" placeholder="000.000.000-00" InputProps={{ endAdornment: cpfChecking && <CircularProgress size={20} /> }} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth label="RG" name="rg" value={currentCliente.rg} onChange={handleChange} size="small" placeholder="RG" /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth required={cnpjObrigatorio} label="CNPJ" name="cnpj" value={currentCliente.cnpj} onChange={handleCNPJChange} error={!!cnpjError} helperText={cnpjError || ""} size="small" placeholder="00.000.000/0000-00" /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth required label="Data Nascimento" name="dataNascimento" type="date" value={currentCliente.dataNascimento} onChange={handleChange} size="small" InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="WhatsApp" name="whatsApp" value={currentCliente.whatsApp} onChange={handleWhatsAppChange} size="small" placeholder="Somente números" inputProps={{ inputMode: "numeric" }} /></Grid>
                <Grid item xs={12} md={4}><FormControl fullWidth size="small" sx={selectFieldSx}><InputLabel id="tipo-tel-label">Tipo</InputLabel><Select labelId="tipo-tel-label" label="Tipo" defaultValue="Celular"><MenuItem value="Celular">Celular</MenuItem><MenuItem value="Fixo">Fixo</MenuItem><MenuItem value="Comercial">Comercial</MenuItem></Select></FormControl></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Telefone" name="telefone" value={currentCliente.telefone} onChange={handleTelefoneChange} size="small" placeholder="Somente números" inputProps={{ inputMode: "numeric" }} /></Grid>
                <Grid item xs={12} md={4}><FormControl fullWidth size="small" sx={selectFieldSx}><InputLabel id="tipo-email-label">Tipo Email</InputLabel><Select labelId="tipo-email-label" label="Tipo Email" defaultValue="Email"><MenuItem value="Email">Email</MenuItem><MenuItem value="Pessoal">Pessoal</MenuItem><MenuItem value="Comercial">Comercial</MenuItem></Select></FormControl></Grid>
                <Grid item xs={12} md={8}><TextField fullWidth label="Email" name="email" type="email" value={currentCliente.email} onChange={handleChange} size="small" placeholder="cliente@exemplo.com" /></Grid>
              </Grid>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Home fontSize="small" /> Endereço</Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}><TextField fullWidth label="CEP" name="cep" value={currentCliente.cep} onChange={handleCEPChange} size="small" placeholder="00000-000" InputProps={{ endAdornment: cepLoading && <CircularProgress size={20} /> }} /></Grid>
                <Grid item xs={12} md={8}><TextField fullWidth label="Endereço" name="rua" value={currentCliente.rua} onChange={handleChange} disabled={cepLoading} size="small" placeholder="Rua, Avenida..." /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Número" name="numero" value={currentCliente.numero} onChange={handleChange} size="small" placeholder="Nº" /></Grid>
                <Grid item xs={12} md={8}><TextField fullWidth label="Complemento" name="complemento" value={currentCliente.complemento} onChange={handleChange} size="small" placeholder="Apto, Bloco, etc" /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Bairro" name="bairro" value={currentCliente.bairro} onChange={handleChange} disabled={cepLoading} size="small" placeholder="Bairro" /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Cidade" name="cidade" value={currentCliente.cidade} onChange={handleChange} disabled={cepLoading} size="small" placeholder="Cidade" /></Grid>
              </Grid>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Extension fontSize="small" /> Extras</Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}><TextField fullWidth label="Preferências" name="preferencias" multiline rows={4} value={currentCliente.preferencias} onChange={handleChange} size="small" placeholder="Descreva as preferências do cliente..." /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Observações" name="observacoes" multiline rows={4} value={currentCliente.observacoes} onChange={handleChange} size="small" placeholder="Adicione observações relevantes..." /></Grid>
              </Grid>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2, display: "flex", alignItems: "center", gap: 1 }}><AccountBalance fontSize="small" /> Crédito</Typography>
              <Box sx={{ py: 2, textAlign: "center" }}><AccountBalance sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 1 }} /><Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Funcionalidade em desenvolvimento</Typography></Box>
            </Paper>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2, pb: 2 }}><Button onClick={handleCloseDialog} sx={{ textTransform: "none", color: theme.palette.text.secondary }}>Cancelar</Button><Button type="submit" variant="contained" sx={{ textTransform: "none", px: 4 }}>Salvar</Button></Box>
          </Box>
        </Box>
      )}

      <Dialog
        open={openValidacaoModal}
        onClose={() => setOpenValidacaoModal(false)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpenValidacaoModal(false); } }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 360, bgcolor: theme.palette.background.paper } }}
        aria-labelledby="validacao-dialog-title"
      >
        <DialogTitle id="validacao-dialog-title" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>Campos obrigatórios</DialogTitle>
        <DialogContent><Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: "14px" }}>{mensagemValidacao}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button variant="contained" autoFocus onClick={() => setOpenValidacaoModal(false)} sx={{ textTransform: "none", minWidth: 100 }}>OK</Button></DialogActions>
      </Dialog>

      <Dialog
        open={openConfirmDelete}
        onClose={handleFecharConfirmExcluir}
        aria-labelledby="confirm-delete-cliente-title"
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
        <DialogTitle id="confirm-delete-cliente-title" sx={{ fontWeight: 600, color: "text.primary", pb: 1 }}>
          Excluir cliente
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.primary", fontSize: "14px", lineHeight: 1.6 }}>
            {confirmMessages.delete(entityNames.cliente)}
          </Typography>
          {clienteParaExcluir?.nome ? (
            <Typography
              variant="subtitle2"
              sx={{ mt: 2, fontWeight: 600, color: "text.primary", wordBreak: "break-word" }}
            >
              {clienteParaExcluir.nome}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, gap: 1 }}>
          <Button
            type="button"
            onClick={handleFecharConfirmExcluir}
            disabled={excluindoCliente}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            color="error"
            onClick={handleConfirmarExcluir}
            disabled={excluindoCliente}
            sx={{ textTransform: "none", minWidth: 100 }}
          >
            {excluindoCliente ? "Excluindo…" : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Clientes;
