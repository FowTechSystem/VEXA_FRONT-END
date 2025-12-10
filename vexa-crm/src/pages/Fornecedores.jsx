// src/pages/Fornecedores.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
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
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from "../api/axiosConfig";

function Fornecedores() {
  const [fornecedores, setFornecedores] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentFornecedor, setCurrentFornecedor] = useState({
    nome: "",
    email: "",
    telefone: "",
    cnpj: "",
    endereco: "",
  });
  const [editMode, setEditMode] = useState(false);

  // MOVA A FUNÇÃO PARA ANTES DO useEffect
  const fetchFornecedores = async () => {
    try {
      const response = await api.get("/fornecedores");
      setFornecedores(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      setFornecedores([]);
    }
  };

  useEffect(() => {
    fetchFornecedores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenDialog = (fornecedor = null) => {
    if (fornecedor) {
      setCurrentFornecedor(fornecedor);
      setEditMode(true);
    } else {
      setCurrentFornecedor({
        nome: "",
        email: "",
        telefone: "",
        cnpj: "",
        endereco: "",
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await api.put(
          `/fornecedores/${currentFornecedor.id}`,
          currentFornecedor
        );
      } else {
        await api.post("/fornecedores", currentFornecedor);
      }
      fetchFornecedores();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este fornecedor?")) {
      try {
        await api.delete(`/fornecedores/${id}`);
        fetchFornecedores();
      } catch (error) {
        console.error("Erro ao excluir fornecedor:", error);
      }
    }
  };

  const handleChange = (e) => {
    setCurrentFornecedor({
      ...currentFornecedor,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Fornecedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Fornecedor
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Nome</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Email</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Telefone</strong>
                  </TableCell>
                  <TableCell>
                    <strong>CNPJ</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(fornecedores) && fornecedores.length > 0 ? (
                  fornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell>{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.email}</TableCell>
                      <TableCell>{fornecedor.telefone}</TableCell>
                      <TableCell>{fornecedor.cnpj}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(fornecedor)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(fornecedor.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nenhum fornecedor cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? "Editar Fornecedor" : "Novo Fornecedor"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                name="nome"
                value={currentFornecedor.nome}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={currentFornecedor.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={currentFornecedor.telefone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CNPJ"
                name="cnpj"
                value={currentFornecedor.cnpj}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                name="endereco"
                multiline
                rows={2}
                value={currentFornecedor.endereco}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Fornecedores;
