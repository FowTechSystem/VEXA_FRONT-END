// src/pages/Produtos.jsx
import React, { useState } from "react";
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
  Chip,
  Paper,
  InputAdornment,
} from "@mui/material";
import { Add, Edit, Delete, Inventory, Search } from "@mui/icons-material";
import { produtosService } from "../api/produtosService";

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProduto, setCurrentProduto] = useState({
    nome: "",
    descricao: "",
    preco: "",
    estoque: "",
    categoria: "",
  });
  const [editMode, setEditMode] = useState(false);

  const fetchProdutos = async () => {
    try {
      const data = await produtosService.getAll();
      const produtosArray = Array.isArray(data) ? data : [];
      setProdutos(produtosArray);
      setProdutosFiltrados(produtosArray);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setProdutos([]);
      setProdutosFiltrados([]);
    }
  };

  // useEffect(() => {
  //   fetchProdutos();
  // }, []);

  const handleSearch = (e) => {
    const termo = e.target.value.toLowerCase();
    setSearchTerm(termo);

    if (termo === "") {
      setProdutosFiltrados(produtos);
    } else {
      const filtrados = produtos.filter(
        (produto) =>
          produto.nome?.toLowerCase().includes(termo) ||
          produto.categoria?.toLowerCase().includes(termo) ||
          produto.descricao?.toLowerCase().includes(termo)
      );
      setProdutosFiltrados(filtrados);
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
    // Validação
    if (!currentProduto.nome.trim()) {
      alert("Nome do produto é obrigatório");
      return;
    }

    if (!currentProduto.preco || parseFloat(currentProduto.preco) <= 0) {
      alert("Preço deve ser maior que zero");
      return;
    }

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
      alert("Erro ao salvar produto. Tente novamente.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este produto?")) {
      try {
        await produtosService.delete(id);
        fetchProdutos();
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
        alert("Erro ao excluir produto.");
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
    <Box sx={{ p: 3, bgcolor: "#fafafa", minHeight: "100vh" }}>
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
            Produtos
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
            Novo Produto
          </Button>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Buscar por nome, categoria ou descrição..."
          value={searchTerm}
          onChange={handleSearch}
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

        {/* Contador */}
        <Typography
          variant="body2"
          sx={{ mt: 2, color: "#6b7280", fontSize: "14px" }}
        >
          {produtosFiltrados.length}{" "}
          {produtosFiltrados.length === 1 ? "produto" : "produtos"}
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
                PRODUTO
              </TableCell>
              <TableCell
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                CATEGORIA
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                PREÇO
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 600, color: "#374151", fontSize: "13px" }}
              >
                ESTOQUE
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
            {Array.isArray(produtosFiltrados) &&
            produtosFiltrados.length > 0 ? (
              produtosFiltrados.map((produto, index) => (
                <TableRow
                  key={produto.id}
                  sx={{
                    "&:hover": { bgcolor: "#f9fafb" },
                    borderBottom:
                      index === produtosFiltrados.length - 1
                        ? "none"
                        : "1px solid #f3f4f6",
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          bgcolor: "#eff6ff",
                          borderRadius: "8px",
                          p: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Inventory sx={{ color: "#2563eb", fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: "#111827" }}
                        >
                          {produto.nome}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          {produto.descricao || "—"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={produto.categoria || "Sem categoria"}
                      size="small"
                      sx={{
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "#111827", fontWeight: 500 }}
                  >
                    R$ {parseFloat(produto.preco || 0).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={produto.estoque || 0}
                      size="small"
                      sx={{
                        bgcolor:
                          (produto.estoque || 0) > 10 ? "#dcfce7" : "#fef3c7",
                        color:
                          (produto.estoque || 0) > 10 ? "#16a34a" : "#d97706",
                        fontWeight: 500,
                        fontSize: "12px",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(produto)}
                      sx={{
                        color: "#6b7280",
                        "&:hover": { bgcolor: "#f3f4f6", color: "#2563eb" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(produto.id)}
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
                  colSpan={5}
                  align="center"
                  sx={{ py: 8, color: "#9ca3af" }}
                >
                  <Inventory sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1">
                    Nenhum produto encontrado
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Clique em "Novo Produto" para cadastrar
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
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "20px" }}>
          {editMode ? "Editar Produto" : "Novo Produto"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Produto *"
                name="nome"
                value={currentProduto.nome}
                onChange={handleChange}
                placeholder="Ex: Notebook Dell Inspiron"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="descricao"
                multiline
                rows={3}
                value={currentProduto.descricao}
                onChange={handleChange}
                placeholder="Descreva as características do produto..."
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Preço *"
                name="preco"
                type="number"
                value={currentProduto.preco}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                inputProps={{
                  step: "0.01",
                  min: "0",
                }}
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
                inputProps={{
                  min: "0",
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Categoria"
                name="categoria"
                value={currentProduto.categoria}
                onChange={handleChange}
                placeholder="Ex: Eletrônicos"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{ textTransform: "none", color: "#6b7280" }}
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
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Produtos;
