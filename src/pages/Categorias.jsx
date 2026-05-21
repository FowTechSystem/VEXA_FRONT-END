import React, { useEffect, useState, useMemo } from "react";
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
  TextField,
  Grid,
  InputAdornment,
  Paper,
  useTheme,
} from "@mui/material";
import { Add, Edit, Delete, Search, ArrowBack } from "@mui/icons-material";
import { LoadingBox } from "../components/LoadingBox";
import { CategoriaService } from "../api/categoriaService";
import { showError, showSuccess } from "../utils/notifications";
import ConfirmDeleteDialog from "../components/ConfirmDeleteDialog";
import { confirmMessages, entityNames } from "../utils/entityMessages";

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

function Categorias() {
  const theme = useTheme();

  const [categorias, setCategorias] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategoria, setCurrentCategoria] = useState({
    nome: "",
    descricao: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState(null);
  const [excluindoCategoria, setExcluindoCategoria] = useState(false);

  const fetchCategorias = async () => {
    setCarregando(true);
    try {
      const response = await CategoriaService.getAll();
      const data =
        response.categoria || response.items || response.categorias || response;
      const categoriasArray = Array.isArray(data) ? data : [];
      setCategorias(categoriasArray);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      setCategorias([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    if (searchTerm === "") {
      return categorias;
    }
    return categorias.filter(
      (categoria) =>
        categoria.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categoria.descricao?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, categorias]);

  const handleOpenDialog = (categoria = null) => {
    if (categoria) {
      setCurrentCategoria(categoria);
      setEditMode(true);
    } else {
      setCurrentCategoria({
        nome: "",
        descricao: "",
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategoria({
      ...currentCategoria,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!currentCategoria.nome || currentCategoria.nome.trim() === "") {
      newErrors.nome = "Nome é obrigatório";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      if (editMode) {
        await CategoriaService.update(currentCategoria.id, currentCategoria);
      } else {
        await CategoriaService.create(currentCategoria);
      }
      fetchCategorias();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      showError("Erro ao salvar categoria. Tente novamente.");
    }
  };

  const handleAbrirConfirmExcluir = (categoria) => {
    setCategoriaParaExcluir({ id: categoria.id, nome: categoria.nome || "" });
  };

  const handleFecharConfirmExcluir = () => {
    if (excluindoCategoria) return;
    setCategoriaParaExcluir(null);
  };

  const handleConfirmarExcluir = async () => {
    if (!categoriaParaExcluir?.id) return;
    setExcluindoCategoria(true);
    try {
      await CategoriaService.delete(categoriaParaExcluir.id);
      showSuccess("Categoria excluída.");
      setCategoriaParaExcluir(null);
      fetchCategorias();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      showError("Erro ao excluir categoria.");
    } finally {
      setExcluindoCategoria(false);
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
          <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Categorias
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
            Nova Categoria
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: "10px",
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: theme.palette.divider },
              "&:hover fieldset": { borderColor: theme.palette.text.secondary },
              "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
            },
          }}
        />

        <Typography
          variant="body2"
          sx={{ mt: 2, color: theme.palette.text.secondary, fontSize: "14px" }}
        >
          {categoriasFiltradas.length}{" "}
          {categoriasFiltradas.length === 1 ? "categoria" : "categorias"}
        </Typography>
      </Box>

      {/* Tabela */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
          borderColor: theme.palette.divider,
          overflow: "hidden",
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
              <TableCell
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  fontSize: "13px",
                  py: 2,
                }}
              >
                CATEGORIA
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: "13px" }}
              >
                DESCRIÇÃO
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: "13px" }}
              >
                AÇÕES
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carregando ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <LoadingBox size={40} py={8} />
                </TableCell>
              </TableRow>
            ) : Array.isArray(categoriasFiltradas) &&
            categoriasFiltradas.length > 0 ? (
              categoriasFiltradas.map((categoria, index) => (
                <TableRow
                  key={categoria.id}
                  sx={{
                    "&:hover": { bgcolor: theme.palette.action.hover },
                    borderBottom:
                      index === categoriasFiltradas.length - 1
                        ? "none"
                        : "1px solid",
                    borderColor: theme.palette.divider,
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(categoria.nome),
                          width: 40,
                          height: 40,
                          fontWeight: 600,
                          fontSize: "14px",
                        }}
                      >
                        {getInitials(categoria.nome)}
                      </Avatar>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: theme.palette.text.primary }}
                      >
                        {categoria.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.secondary, fontSize: "14px" }}>
                    {categoria.descricao || "—"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(categoria)}
                      sx={{
                        color: theme.palette.text.secondary,
                        "&:hover": { bgcolor: theme.palette.action.hover, color: theme.palette.primary.main },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleAbrirConfirmExcluir(categoria)}
                      sx={{
                        color: theme.palette.text.secondary,
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
                  colSpan={3}
                  align="center"
                  sx={{ py: 8, color: theme.palette.text.secondary }}
                >
                  <Typography variant="body1" sx={{ color: theme.palette.text.primary }}>
                    Nenhuma categoria encontrada
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
                    Clique em "Nova Categoria" para cadastrar
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
        </>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexShrink: 0 }}>
            <Button startIcon={<ArrowBack />} onClick={handleCloseDialog} sx={{ textTransform: "none", color: theme.palette.text.secondary }}>
              Voltar
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              {editMode ? "Editar Categoria" : "Nova Categoria"}
            </Typography>
          </Box>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} sx={{ flex: 1, overflow: "auto", pr: 1 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: theme.palette.divider, bgcolor: theme.palette.background.paper }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 2 }}>
                Geral
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Nome da Categoria"
                    name="nome"
                    value={currentCategoria.nome}
                    onChange={handleChange}
                    error={!!errors.nome}
                    helperText={errors.nome}
                    size="small"
                    placeholder="Ex: Eletrônicos, Roupas..."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Descrição"
                    name="descricao"
                    multiline
                    rows={3}
                    value={currentCategoria.descricao}
                    onChange={handleChange}
                    size="small"
                    placeholder="Descrição opcional da categoria..."
                  />
                </Grid>
              </Grid>
            </Paper>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2, pb: 2 }}>
              <Button onClick={handleCloseDialog} sx={{ textTransform: "none", color: theme.palette.text.secondary }}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" sx={{ textTransform: "none", px: 4 }}>
                Salvar
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <ConfirmDeleteDialog
        open={!!categoriaParaExcluir}
        onClose={handleFecharConfirmExcluir}
        onConfirm={handleConfirmarExcluir}
        title="Excluir categoria"
        message={confirmMessages.delete(entityNames.categoria)}
        itemLabel={categoriaParaExcluir?.nome}
        loading={excluindoCategoria}
      />
    </Box>
  );
}

export default Categorias;
