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
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  InputAdornment,
  Paper,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Search,
  ArrowBack,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { LoadingBox } from "../components/LoadingBox";
import { FornecedorService } from "../api/fornecedorService";
import { showSuccess, showError } from "../utils/notifications";
import {
  successMessages,
  errorMessages,
  confirmMessages,
  entityNames,
} from "../utils/entityMessages";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";

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

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const fornecedoresPorPagina = 10;
  const [carregando, setCarregando] = useState(false);

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
  const [errors, setErrors] = useState({});
  const [cepLoading, setCepLoading] = useState(false);
  const [openValidacaoModal, setOpenValidacaoModal] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState(null);
  const [excluindoFornecedor, setExcluindoFornecedor] = useState(false);

  // Cálculos de paginação
  const totalPaginas = Math.ceil(
    fornecedoresFiltrados.length / fornecedoresPorPagina,
  );
  const indiceInicial = (paginaAtual - 1) * fornecedoresPorPagina;
  const indiceFinal = indiceInicial + fornecedoresPorPagina;
  const fornecedoresPaginados = fornecedoresFiltrados.slice(
    indiceInicial,
    indiceFinal,
  );

  // Funções de navegação de página
  const irParaPrimeiraPagina = () => setPaginaAtual(1);
  const irParaUltimaPagina = () => setPaginaAtual(totalPaginas);
  const irParaPaginaAnterior = () =>
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  const irParaProximaPagina = () =>
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));

  const fetchFornecedores = async () => {
    setCarregando(true);
    try {
      const response = await FornecedorService.getAll();

      console.log("Response completo:", response);
      console.log("Primeiro fornecedor:", response.fornecedor?.[0]);
      console.log(
        "Endereços do primeiro:",
        response.fornecedor?.[0]?.enderecos,
      );

      const data =
        response.fornecedor ||
        response.items ||
        response.fornecedores ||
        response;
      const fornecedoresArray = Array.isArray(data) ? data : [];
      setFornecedores(fornecedoresArray);
      setFornecedoresFiltrados(fornecedoresArray);
      setPaginaAtual(1); // Volta para a primeira página ao recarregar
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      showError(errorMessages.fetch(entityNames.fornecedores), { id: "fetch-fornecedores" });
      setFornecedores([]);
      setFornecedoresFiltrados([]);
    } finally {
      setCarregando(false);
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
          fornecedor.cnpj?.toLowerCase().includes(termo),
      );
      setFornecedoresFiltrados(filtrados);
    }
    setPaginaAtual(1); // Volta para a primeira página ao filtrar
  };

  const handleOpenDialog = (fornecedor = null) => {
    if (fornecedor) {
      const primeiroEndereco = fornecedor.enderecos?.[0] || {};

      setCurrentFornecedor({
        ...fornecedor,
        cep: primeiroEndereco.cep || "",
        rua: primeiroEndereco.rua || "",
        numero: primeiroEndereco.numero || "",
        complemento: primeiroEndereco.complemento || "",
        bairro: primeiroEndereco.bairro || "",
        cidade: primeiroEndereco.cidade || "",
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
    const faltando = [];
    if (!currentFornecedor.nome?.trim()) faltando.push("Nome");
    if (!currentFornecedor.cnpj?.trim()) faltando.push("CNPJ");
    if (faltando.length > 0) {
      setMensagemValidacao("Faltam: " + faltando.join(", ") + ".");
      setOpenValidacaoModal(true);
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
        showSuccess(successMessages.update(entityNames.fornecedor));
      } else {
        await FornecedorService.create(fornecedorData);
        showSuccess(successMessages.create(entityNames.fornecedor));
      }

      fetchFornecedores();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);

      if (error.response) {
        const errorData = error.response.data;
        if (errorData.errors) {
          const firstError = Object.values(errorData.errors)[0];
          showError(
            firstError[0] || errorMessages.create(entityNames.fornecedor),
          );
        } else {
          showError(
            errorData.message || errorMessages.create(entityNames.fornecedor),
          );
        }
      } else {
        showError(
          editMode
            ? errorMessages.update(entityNames.fornecedor)
            : errorMessages.create(entityNames.fornecedor),
        );
      }
    }
  };

  const handleAbrirConfirmExcluir = (fornecedor) => {
    setFornecedorParaExcluir({
      id: fornecedor.id,
      nome: fornecedor.razaoSocial || fornecedor.nome || "",
    });
  };

  const handleFecharConfirmExcluir = () => {
    if (excluindoFornecedor) return;
    setFornecedorParaExcluir(null);
  };

  const handleConfirmarExcluir = async () => {
    if (!fornecedorParaExcluir?.id) return;
    setExcluindoFornecedor(true);
    try {
      await FornecedorService.delete(fornecedorParaExcluir.id);
      showSuccess(successMessages.delete(entityNames.fornecedor));
      setFornecedorParaExcluir(null);
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      showError(errorMessages.delete(entityNames.fornecedor));
    } finally {
      setExcluindoFornecedor(false);
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

  const handleDigitsOnlyChange = (e) => {
    const { name, value } = e.target;
    const digits = String(value).replace(/\D/g, "");
    let lim = 15;
    if (name === "cnpj") lim = 14;
    else if (name === "cep") lim = 8;
    else if (name === "telefone" || name === "whatsApp") lim = 11;
    setCurrentFornecedor({
      ...currentFornecedor,
      [name]: digits.slice(0, lim),
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const buscarCep = async () => {
    const cep = currentFornecedor.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        showError("CEP não encontrado");
        return;
      }

      setCurrentFornecedor({
        ...currentFornecedor,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        complemento: data.complemento || "",
      });
      showSuccess("Endereço carregado com sucesso!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      showError("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh", color: "text.primary", ...(openDialog ? { display: "flex", flexDirection: "column", overflow: "hidden" } : {}) }}>
      {!openDialog ? (
        <>
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
          <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
            Fornecedores
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

        {/* Contador */}
        <Typography
          variant="body2"
          sx={{ mt: 2, color: "text.secondary", fontSize: "14px" }}
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
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
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
                FORNECEDOR
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                EMAIL
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                CNPJ
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}
              >
                TELEFONE
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
            ) : fornecedoresPaginados.length > 0 ? (
              fornecedoresPaginados.map((fornecedor, index) => (
                <TableRow
                  key={fornecedor.id}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom:
                      index === fornecedoresPaginados.length - 1
                        ? "none"
                        : "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(fornecedor.nome),
                          width: 40,
                          height: 40,
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {getInitials(fornecedor.nome)}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "text.primary" }}
                      >
                        {fornecedor.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "14px" }}>
                    {fornecedor.email || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={fornecedor.cnpj || "Sem CNPJ"}
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
                      label={fornecedor.telefone || "Sem telefone"}
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
                      onClick={() => handleOpenDialog(fornecedor)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": { bgcolor: "action.hover", color: "primary.main" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleAbrirConfirmExcluir(fornecedor)}
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
                  <Typography variant="body1" sx={{ color: "text.primary" }}>
                    Nenhum fornecedor encontrado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
                    Clique em "Novo Fornecedor" para cadastrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Controles de Paginação */}
        {fornecedoresFiltrados.length > 0 && (
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
              Mostrando {indiceInicial + 1} a{" "}
              {Math.min(indiceFinal, fornecedoresFiltrados.length)} de{" "}
              {fornecedoresFiltrados.length}{" "}
              {fornecedoresFiltrados.length === 1
                ? "fornecedor"
                : "fornecedores"}
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

              {/* Botão Última Página */}
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
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexShrink: 0 }}>
            <Button startIcon={<ArrowBack />} onClick={handleCloseDialog} sx={{ textTransform: "none", color: "text.secondary" }}>Voltar</Button>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>{editMode ? "Editar Fornecedor" : "Novo Fornecedor"}</Typography>
          </Box>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} sx={{ flex: 1, overflow: "auto", pr: 1 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>Geral</Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}><TextField fullWidth required label="Nome" name="nome" value={currentFornecedor.nome} onChange={handleChange} error={!!errors.nome} helperText={errors.nome} size="small" /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Razão Social" name="razaoSocial" value={currentFornecedor.razaoSocial} onChange={handleChange} size="small" /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth required label="CNPJ" name="cnpj" value={currentFornecedor.cnpj} onChange={handleDigitsOnlyChange} error={!!errors.cnpj} helperText={errors.cnpj || "Apenas números"} placeholder="00000000000000" inputProps={{ inputMode: "numeric" }} size="small" /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Nome do Representante" name="nomeRepresentante" value={currentFornecedor.nomeRepresentante} onChange={handleChange} size="small" /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Telefone" name="telefone" value={currentFornecedor.telefone} onChange={handleDigitsOnlyChange} placeholder="00000000000" inputProps={{ inputMode: "numeric" }} size="small" /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="WhatsApp" name="whatsApp" value={currentFornecedor.whatsApp} onChange={handleDigitsOnlyChange} placeholder="00000000000" inputProps={{ inputMode: "numeric" }} size="small" /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Email" name="email" type="email" value={currentFornecedor.email} onChange={handleChange} placeholder="fornecedor@exemplo.com" size="small" /></Grid>
              </Grid>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>Endereço</Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}><TextField fullWidth label="CEP" name="cep" value={currentFornecedor.cep} onChange={handleDigitsOnlyChange} onBlur={buscarCep} disabled={cepLoading} placeholder="00000000" inputProps={{ inputMode: "numeric", maxLength: 8 }} size="small" /></Grid>
                <Grid item xs={12} md={8}><TextField fullWidth label="Rua" name="rua" value={currentFornecedor.rua} onChange={handleChange} disabled={cepLoading} size="small" /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label="Número" name="numero" value={currentFornecedor.numero} onChange={handleChange} placeholder="Nº" size="small" /></Grid>
                <Grid item xs={12} md={8}><TextField fullWidth label="Complemento" name="complemento" value={currentFornecedor.complemento} onChange={handleChange} placeholder="Apto, Sala, etc" size="small" /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Bairro" name="bairro" value={currentFornecedor.bairro} onChange={handleChange} disabled={cepLoading} size="small" /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label="Cidade" name="cidade" value={currentFornecedor.cidade} onChange={handleChange} disabled={cepLoading} size="small" /></Grid>
              </Grid>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>Extras</Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12}><TextField fullWidth label="Categoria de Produtos" name="categoriaProdutos" value={currentFornecedor.categoriaProdutos} onChange={handleChange} placeholder="Ex: Eletrônicos, Roupas, Alimentos..." size="small" /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Condição de Pagamento" name="condicaoPagamento" value={currentFornecedor.condicaoPagamento} onChange={handleChange} placeholder="Ex: 30/60/90 dias, À vista..." size="small" /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Observações" name="observacoes" value={currentFornecedor.observacoes} onChange={handleChange} multiline rows={4} placeholder="Informações adicionais sobre o fornecedor" size="small" /></Grid>
              </Grid>
            </Paper>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2, pb: 2 }}><Button onClick={handleCloseDialog} sx={{ textTransform: "none", color: "text.secondary" }}>Cancelar</Button><Button type="submit" variant="contained" sx={{ textTransform: "none", px: 4 }}>Salvar</Button></Box>
          </Box>
        </Box>
      )}

      <Dialog open={openValidacaoModal} onClose={() => setOpenValidacaoModal(false)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpenValidacaoModal(false); } }} PaperProps={{ sx: { borderRadius: 2, minWidth: 360 } }} aria-labelledby="validacao-dialog-title">
        <DialogTitle id="validacao-dialog-title" sx={{ fontWeight: 600 }}>Campos obrigatórios</DialogTitle>
        <DialogContent><Typography variant="body2" sx={{ color: "text.primary", fontSize: "14px" }}>{mensagemValidacao}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button variant="contained" autoFocus onClick={() => setOpenValidacaoModal(false)} sx={{ textTransform: "none", minWidth: 100 }}>OK</Button></DialogActions>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!fornecedorParaExcluir}
        onClose={handleFecharConfirmExcluir}
        onConfirm={handleConfirmarExcluir}
        title="Excluir fornecedor"
        message={confirmMessages.delete(entityNames.fornecedor)}
        itemLabel={fornecedorParaExcluir?.nome}
        loading={excluindoFornecedor}
      />
    </Box>
  );
}

export default Fornecedores;
