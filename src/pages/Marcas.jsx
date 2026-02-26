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
} from "@mui/material";
import { Add, Edit, Delete, Search, ArrowBack } from "@mui/icons-material";
import { LoadingBox } from "../components/LoadingBox";
import { MarcaService } from "../api/marcaService";
import { showError, showSuccess } from "../utils/notifications";
import { getInitials, getAvatarColor } from "../utils/avatarUtils";

function Marcas() {
  const [marcas, setMarcas] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMarca, setCurrentMarca] = useState({
    nome: "",
    descricao: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [carregando, setCarregando] = useState(false);

  const fetchMarcas = async () => {
    setCarregando(true);
    try {
      const response = await MarcaService.getAll();
      const data =
        response.marca || response.items || response.marcas || response;
      const marcasArray = Array.isArray(data) ? data : [];
      setMarcas(marcasArray);
    } catch (error) {
      console.error("Erro ao buscar marcas:", error);
      setMarcas([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    fetchMarcas();
  }, []);

  const marcasFiltradas = useMemo(() => {
    if (searchTerm === "") return marcas;
    return marcas.filter(
      (marca) =>
        marca.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marca.descricao?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, marcas]);

  const handleOpenDialog = (marca = null) => {
    if (marca) {
      setCurrentMarca(marca);
      setEditMode(true);
    } else {
      setCurrentMarca({ nome: "", descricao: "" });
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
    setCurrentMarca({ ...currentMarca, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!currentMarca.nome?.trim()) newErrors.nome = "Nome é obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      if (editMode) {
        await MarcaService.update(currentMarca.id, currentMarca);
        showSuccess("Marca atualizada com sucesso.");
      } else {
        await MarcaService.create(currentMarca);
        showSuccess("Marca cadastrada com sucesso.");
      }
      fetchMarcas();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar marca:", error);
      showError("Erro ao salvar marca. Tente novamente.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir esta marca?")) {
      try {
        await MarcaService.delete(id);
        showSuccess("Marca excluída.");
        fetchMarcas();
      } catch (error) {
        console.error("Erro ao excluir marca:", error);
        showError("Erro ao excluir marca.");
      }
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh", color: "text.primary", ...(openDialog ? { display: "flex", flexDirection: "column", overflow: "hidden" } : {}) }}>
      {!openDialog ? (
        <>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
            Marcas
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ textTransform: "none", borderRadius: "8px", px: 3, py: 1, boxShadow: "none" }}
          >
            Nova Marca
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
                <Search sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            bgcolor: "background.paper",
            borderRadius: "10px",
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "divider" },
              "&:hover fieldset": { borderColor: "text.secondary" },
              "&.Mui-focused fieldset": { borderColor: "primary.main" },
            },
          }}
        />

        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary", fontSize: "14px" }}>
          {marcasFiltradas.length} {marcasFiltradas.length === 1 ? "marca" : "marcas"}
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: "12px", border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px", py: 2 }}>MARCA</TableCell>
              <TableCell sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>DESCRIÇÃO</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: "text.primary", fontSize: "13px" }}>AÇÕES</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carregando ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <LoadingBox size={40} py={8} />
                </TableCell>
              </TableRow>
            ) : marcasFiltradas.length > 0 ? (
              marcasFiltradas.map((marca, index) => (
                <TableRow
                  key={marca.id}
                  sx={{
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom: index === marcasFiltradas.length - 1 ? "none" : "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ bgcolor: getAvatarColor(marca.nome), width: 40, height: 40, fontWeight: 600, fontSize: "14px" }}>
                        {getInitials(marca.nome)}
                      </Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>{marca.nome}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", fontSize: "14px" }}>{marca.descricao || "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(marca)} sx={{ color: "text.secondary", "&:hover": { bgcolor: "action.hover", color: "primary.main" } }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(marca.id)} sx={{ color: "text.secondary", "&:hover": { bgcolor: "error.light", color: "error.main" } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 8, color: "text.secondary" }}>
                  <Typography variant="body1">Nenhuma marca encontrada</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>Clique em "Nova Marca" para cadastrar</Typography>
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
            <Button startIcon={<ArrowBack />} onClick={handleCloseDialog} sx={{ textTransform: "none", color: "text.secondary" }}>
              Voltar
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
              {editMode ? "Editar Marca" : "Nova Marca"}
            </Typography>
          </Box>
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} sx={{ flex: 1, overflow: "auto", pr: 1 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}>
                Geral
              </Typography>
              <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth required label="Nome da Marca" name="nome" value={currentMarca.nome} onChange={handleChange} error={!!errors.nome} helperText={errors.nome} size="small" placeholder="Ex: Nike, Adidas..." />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Descrição" name="descricao" multiline rows={3} value={currentMarca.descricao} onChange={handleChange} size="small" placeholder="Descrição opcional da marca..." />
                </Grid>
              </Grid>
            </Paper>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2, pb: 2 }}>
              <Button onClick={handleCloseDialog} sx={{ textTransform: "none", color: "text.secondary" }}>Cancelar</Button>
              <Button type="submit" variant="contained" sx={{ textTransform: "none", px: 4 }}>Salvar</Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default Marcas;
