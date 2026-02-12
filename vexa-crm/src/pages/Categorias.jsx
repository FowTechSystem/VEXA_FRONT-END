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
import { Add, Edit, Delete, Search, Close } from "@mui/icons-material";
import { CategoriaService } from "../api/categoriaService";

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

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentCategoria, setCurrentCategoria] = useState({
    nome: "",
    descricao: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchCategorias = async () => {
    try {
      const response = await CategoriaService.getAll();
      const data =
        response.categoria || response.items || response.categorias || response;
      const categoriasArray = Array.isArray(data) ? data : [];
      setCategorias(categoriasArray);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      setCategorias([]);
    }
  };

  useEffect(() => {}, []);

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
      alert("Erro ao salvar categoria. Tente novamente.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir esta categoria?")) {
      try {
        await CategoriaService.delete(id);
        fetchCategorias();
      } catch (error) {
        console.error("Erro ao excluir categoria:", error);
        alert("Erro ao excluir categoria.");
      }
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#fafafa", height: "100vh", overflow: "hidden" }}>
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
            Categorias
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
                CATEGORIA
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                DESCRIÇÃO
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
            {Array.isArray(categoriasFiltradas) &&
            categoriasFiltradas.length > 0 ? (
              categoriasFiltradas.map((categoria, index) => (
                <TableRow
                  key={categoria.id}
                  sx={{
                    "&:hover": { bgcolor: "#f9fafb" },
                    borderBottom:
                      index === categoriasFiltradas.length - 1
                        ? "none"
                        : "1px solid #f3f4f6",
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
                        sx={{ fontWeight: 500, color: "#111827" }}
                      >
                        {categoria.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "#6b7280", fontSize: "14px" }}>
                    {categoria.descricao || "—"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(categoria)}
                      sx={{
                        color: "#6b7280",
                        "&:hover": { bgcolor: "#f3f4f6", color: "#2563eb" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(categoria.id)}
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
                  colSpan={3}
                  align="center"
                  sx={{ py: 8, color: "#9ca3af" }}
                >
                  <Typography variant="body1">
                    Nenhuma categoria encontrada
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Clique em "Nova Categoria" para cadastrar
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
        maxWidth="sm"
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
          {editMode ? "Editar Categoria" : "Nova Categoria"}
          <IconButton onClick={handleCloseDialog} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
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
            <Grid item xs={12}>
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

export default Categorias;
