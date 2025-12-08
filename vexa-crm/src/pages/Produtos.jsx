// src/pages/Produtos.jsx
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
  Chip,
} from "@mui/material";
import { Add, Edit, Delete, Inventory } from "@mui/icons-material";
import { produtosService } from "../api/produtosService";

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProduto, setCurrentProduto] = useState({
    nome: "",
    descricao: "",
    preco: "",
    estoque: "",
    categoria: "",
  });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const data = await produtosService.getAll();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const handleOpenDialog = (produto = null) => {
    if (produto) {
      setCurrentProduto(produto);
      setEditMode(true);
    } else {
      setCurrentProduto({
        nome: "",
        descricao: "",
        preco: "",
        estoque: "",
        categoria: "",
      });
      setEditMode(false);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProduto({
      nome: "",
      descricao: "",
      preco: "",
      estoque: "",
      categoria: "",
    });
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await produtosService.update(currentProduto.id, currentProduto);
      } else {
        await produtosService.create(currentProduto);
      }
      fetchProdutos();
      handleCloseDialog();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este produto?")) {
      try {
        await produtosService.delete(id);
        fetchProdutos();
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
      }
    }
  };

  const handleChange = (e) => {
    setCurrentProduto({
      ...currentProduto,
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
          Produtos
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Produto
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Produto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Categoria</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Preço</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Estoque</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Ações</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Inventory color="primary" />
                        <div>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {produto.nome}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {produto.descricao}
                          </Typography>
                        </div>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={produto.categoria}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      R$ {parseFloat(produto.preco).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={produto.estoque}
                        size="small"
                        color={produto.estoque > 10 ? "success" : "warning"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenDialog(produto)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(produto.id)}
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
          {editMode ? "Editar Produto" : "Novo Produto"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Produto"
                name="nome"
                value={currentProduto.nome}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="descricao"
                multiline
                rows={2}
                value={currentProduto.descricao}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Preço"
                name="preco"
                type="number"
                value={currentProduto.preco}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Estoque"
                name="estoque"
                type="number"
                value={currentProduto.estoque}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Categoria"
                name="categoria"
                value={currentProduto.categoria}
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

export default Produtos;
