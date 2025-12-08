// src/pages/Clientes.jsx
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
import { clientesService } from "../api/clientesService";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCliente, setCurrentCliente] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpfCnpj: "",
    endereco: "",
  });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const data = await clientesService.getAll();
      setClientes(data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const handleOpenDialog = (cliente = null) => {
    if (cliente) {
      setCurrentCliente(cliente);
      setEditMode(true);
    } else {
      setCurrentCliente({
        nome: "",
        email: "",
        telefone: "",
        cpfCnpj: "",
        endereco: "",
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentCliente({
      nome: "",
      email: "",
      telefone: "",
      cpfCnpj: "",
      endereco: "",
    });
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await clientesService.update(currentCliente.id, currentCliente);
      } else {
        await clientesService.create(currentCliente);
      }
      fetchClientes();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este cliente?")) {
      try {
        await clientesService.delete(id);
        fetchClientes();
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
      }
    }
  };

  const handleChange = (e) => {
    setCurrentCliente({
      ...currentCliente,
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
          Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cliente
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
                    <strong>CPF/CNPJ</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>{cliente.nome}</TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell>{cliente.cpfCnpj}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(cliente)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(cliente.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
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
          {editMode ? "Editar Cliente" : "Novo Cliente"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                name="nome"
                value={currentCliente.nome}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={currentCliente.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={currentCliente.telefone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CPF/CNPJ"
                name="cpfCnpj"
                value={currentCliente.cpfCnpj}
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
                value={currentCliente.endereco}
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

export default Clientes;
