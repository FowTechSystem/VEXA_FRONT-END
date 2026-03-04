import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  Grid,
  InputAdornment,
  Alert,
} from "@mui/material";
import {
  Inventory,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Search,
  Warning,
  CheckCircle,
  FirstPage,
  LastPage,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

const TIPOS_MOVIMENTACAO = {
  entrada: { label: "Entrada", icon: <TrendingUp />, color: "#16a34a" },
  saida: { label: "Saída", icon: <TrendingDown />, color: "#dc2626" },
  ajuste: { label: "Ajuste", icon: <SwapHoriz />, color: "#2563eb" },
  inventario: { label: "Inventário", icon: <Inventory />, color: "#9333ea" },
};

// Componente de Paginação Reutilizável - FORA do componente principal
const PaginationControls = ({
  paginaAtual,
  totalPaginas,
  indiceInicial,
  indiceFinal,
  totalItens,
  itemLabel,
  onPrimeira,
  onAnterior,
  onProxima,
  onUltima,
  onPagina,
}) => {
  if (totalItens === 0) return null;

  return (
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
        Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, totalItens)} de{" "}
        {totalItens} {totalItens === 1 ? itemLabel : `${itemLabel}s`}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton
          onClick={onPrimeira}
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
          onClick={onAnterior}
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
                    onClick={() => onPagina(numeroPagina)}
                    size="small"
                    sx={{
                      minWidth: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: paginaAtual === numeroPagina ? "primary.contrastText" : "text.secondary",
                      bgcolor:
                        paginaAtual === numeroPagina
                          ? "primary.main"
                          : "transparent",
                      "&:hover": {
                        bgcolor:
                          paginaAtual === numeroPagina ? "primary.dark" : "action.hover",
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
          onClick={onProxima}
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
          onClick={onUltima}
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
  );
};

function Estoque() {
  const [tabAtual, setTabAtual] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para paginação
  const [paginaAtualProdutos, setPaginaAtualProdutos] = useState(1);
  const [paginaAtualMovimentacoes, setPaginaAtualMovimentacoes] = useState(1);
  const itensPorPagina = 10;

  const [produtos, setProdutos] = useState([
    {
      id: 1,
      nome: "Camiseta Básica",
      sku: "CAM-001",
      estoqueAtual: 45,
      estoqueMinimo: 20,
      estoqueMaximo: 100,
      valorUnitario: 29.9,
    },
    {
      id: 2,
      nome: "Calça Jeans",
      sku: "CAL-002",
      estoqueAtual: 8,
      estoqueMinimo: 15,
      estoqueMaximo: 50,
      valorUnitario: 89.9,
    },
  ]);

  const [movimentacoes] = useState([]);

  const getProdutoStatus = (produto) => {
    if (produto.estoqueAtual <= produto.estoqueMinimo) {
      return { label: "Crítico", color: "error.main", bgcolor: "error.light" };
    } else if (produto.estoqueAtual <= produto.estoqueMinimo * 1.5) {
      return { label: "Baixo", color: "#d97706", bgcolor: "#fef3c7" };
    }
    return { label: "Normal", color: "success.main", bgcolor: "success.light" };
  };

  const calcularValorEstoque = () => {
    return produtos.reduce(
      (acc, p) => acc + p.estoqueAtual * p.valorUnitario,
      0,
    );
  };

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Cálculos de paginação para produtos
  const totalPaginasProdutos = Math.ceil(
    produtosFiltrados.length / itensPorPagina,
  );
  const indiceInicialProdutos = (paginaAtualProdutos - 1) * itensPorPagina;
  const indiceFinalProdutos = indiceInicialProdutos + itensPorPagina;
  const produtosPaginados = produtosFiltrados.slice(
    indiceInicialProdutos,
    indiceFinalProdutos,
  );

  // Cálculos de paginação para movimentações
  const totalPaginasMovimentacoes = Math.ceil(
    movimentacoes.length / itensPorPagina,
  );
  const indiceInicialMovimentacoes =
    (paginaAtualMovimentacoes - 1) * itensPorPagina;
  const indiceFinalMovimentacoes = indiceInicialMovimentacoes + itensPorPagina;
  const movimentacoesPaginadas = movimentacoes.slice(
    indiceInicialMovimentacoes,
    indiceFinalMovimentacoes,
  );

  // Funções de navegação - Produtos
  const irParaPrimeiraPaginaProdutos = () => setPaginaAtualProdutos(1);
  const irParaUltimaPaginaProdutos = () =>
    setPaginaAtualProdutos(totalPaginasProdutos);
  const irParaPaginaAnteriorProdutos = () =>
    setPaginaAtualProdutos((prev) => Math.max(prev - 1, 1));
  const irParaProximaPaginaProdutos = () =>
    setPaginaAtualProdutos((prev) => Math.min(prev + 1, totalPaginasProdutos));

  // Funções de navegação - Movimentações
  const irParaPrimeiraPaginaMovimentacoes = () =>
    setPaginaAtualMovimentacoes(1);
  const irParaUltimaPaginaMovimentacoes = () =>
    setPaginaAtualMovimentacoes(totalPaginasMovimentacoes);
  const irParaPaginaAnteriorMovimentacoes = () =>
    setPaginaAtualMovimentacoes((prev) => Math.max(prev - 1, 1));
  const irParaProximaPaginaMovimentacoes = () =>
    setPaginaAtualMovimentacoes((prev) =>
      Math.min(prev + 1, totalPaginasMovimentacoes),
    );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPaginaAtualProdutos(1); // Volta para a primeira página ao buscar
  };

  const handleTabChange = (e, newValue) => {
    setTabAtual(newValue);
    // Mantém as páginas atuais ao trocar de aba
  };

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "background.default",
        minHeight: "100vh",
        color: "text.primary",
      }}
    >
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
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
              Estoque
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
              Consulta de estoque. O estoque é atualizado automaticamente pelas compras recebidas.
            </Typography>
          </Box>
        </Box>

        {/* Cards de resumo */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Inventory sx={{ color: "primary.main", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Total de Produtos
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {produtos.length}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Warning sx={{ color: "#d97706", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Estoque Baixo
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {
                  produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo)
                    .length
                }
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CheckCircle sx={{ color: "success.main", mr: 1 }} />
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Itens em Estoque
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {produtos.reduce((acc, p) => acc + p.estoqueAtual, 0)}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={3}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Valor Total
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 600, color: "success.main" }}
              >
                R$ {calcularValorEstoque().toFixed(2)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          border: "1px solid",
                borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box sx={{ borderBottom: "1px solid",
          borderColor: "divider", px: 3 }}>
          <Tabs
            value={tabAtual}
            onChange={handleTabChange}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: "14px",
                color: "text.secondary",
              },
              "& .Mui-selected": {
                color: "primary.main",
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "primary.main",
              },
            }}
          >
            <Tab label="Visão Geral" />
            <Tab label="Movimentações" />
            <Tab label="Inventário" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* Tab Visão Geral */}
          {tabAtual === 0 && (
            <Box>
              <TextField
                fullWidth
                placeholder="Buscar produto por nome ou SKU..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  bgcolor: "background.paper",
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "background.paper",
                    color: "text.primary",
                    "& fieldset": { borderColor: "divider" },
                    "&:hover fieldset": { borderColor: "divider" },
                    "&.Mui-focused fieldset": { borderWidth: "1px", borderColor: "primary.main" },
                    "& input": { color: "text.primary" },
                    "& input::placeholder": { color: "text.secondary", opacity: 1 },
                  },
                }}
              />

              {produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo)
                .length > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Existem{" "}
                    {
                      produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo)
                        .length
                    }{" "}
                    produtos com estoque baixo ou crítico
                  </Typography>
                </Alert>
              )}

              <TableContainer
                sx={{ border: "1px solid",
                borderColor: "divider", borderRadius: "8px" }}
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
                        PRODUTO
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        SKU
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        ESTOQUE ATUAL
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        ESTOQUE MÍN/MÁX
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        VALOR UNIT.
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        VALOR TOTAL
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        STATUS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {produtosPaginados.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          align="center"
                          sx={{ py: 8, color: "text.secondary" }}
                        >
                          <Inventory
                            sx={{ fontSize: 48, mb: 2, opacity: 0.5 }}
                          />
                          <Typography variant="body1">
                            Nenhum produto encontrado
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      produtosPaginados.map((produto, index) => {
                        const status = getProdutoStatus(produto);
                        return (
                          <TableRow
                            key={produto.id}
                            sx={{
                              "&:hover": { bgcolor: "action.hover" },
                              borderBottom:
                                index === produtosPaginados.length - 1
                                  ? "none"
                                  : "1px solid",
                                  borderColor: "divider",
                            }}
                          >
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, color: "text.primary" }}
                              >
                                {produto.nome}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={produto.sku}
                                size="small"
                                sx={{
                                  bgcolor: "action.hover",
                                  fontSize: "11px",
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, fontSize: "16px" }}
                              >
                                {produto.estoqueAtual}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {produto.estoqueMinimo} /{" "}
                                {produto.estoqueMaximo}
                              </Typography>
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 500, fontSize: "14px" }}
                            >
                              R$ {produto.valorUnitario.toFixed(2)}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{ fontWeight: 500, fontSize: "14px" }}
                            >
                              R${" "}
                              {(
                                produto.estoqueAtual * produto.valorUnitario
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={status.label}
                                size="small"
                                sx={{
                                  bgcolor: status.bgcolor,
                                  color: status.color,
                                  fontWeight: 500,
                                  fontSize: "12px",
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Paginação - Produtos */}
                <PaginationControls
                  paginaAtual={paginaAtualProdutos}
                  totalPaginas={totalPaginasProdutos}
                  indiceInicial={indiceInicialProdutos}
                  indiceFinal={indiceFinalProdutos}
                  totalItens={produtosFiltrados.length}
                  itemLabel="produto"
                  onPrimeira={irParaPrimeiraPaginaProdutos}
                  onAnterior={irParaPaginaAnteriorProdutos}
                  onProxima={irParaProximaPaginaProdutos}
                  onUltima={irParaUltimaPaginaProdutos}
                  onPagina={setPaginaAtualProdutos}
                />
              </TableContainer>
            </Box>
          )}

          {/* Tab Movimentações */}
          {tabAtual === 1 && (
            <Box>
              <TableContainer
                sx={{ border: "1px solid",
                borderColor: "divider", borderRadius: "8px" }}
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
                        DATA/HORA
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        TIPO
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        PRODUTO
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        QUANTIDADE
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        MOTIVO
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "13px",
                        }}
                      >
                        OBSERVAÇÕES
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movimentacoesPaginadas.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          sx={{ py: 8, color: "text.secondary" }}
                        >
                          <SwapHoriz
                            sx={{ fontSize: 48, mb: 2, opacity: 0.5 }}
                          />
                          <Typography variant="body1">
                            Nenhuma movimentação registrada
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            As movimentações são geradas automaticamente quando compras são recebidas.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentacoesPaginadas.map((mov, index) => {
                        const tipo = TIPOS_MOVIMENTACAO[mov.tipo];
                        return (
                          <TableRow
                            key={mov.id}
                            sx={{
                              "&:hover": { bgcolor: "action.hover" },
                              borderBottom:
                                index === movimentacoesPaginadas.length - 1
                                  ? "none"
                                  : "1px solid",
                                  borderColor: "divider",
                            }}
                          >
                            <TableCell sx={{ py: 2.5 }}>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {new Date(mov.timestamp).toLocaleString(
                                  "pt-BR",
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={tipo.icon}
                                label={tipo.label}
                                size="small"
                                sx={{
                                  bgcolor: `${tipo.color}20`,
                                  color: tipo.color,
                                  fontWeight: 500,
                                  fontSize: "12px",
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500, color: "text.primary" }}
                              >
                                {mov.produtoNome}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {mov.produtoSku}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color:
                                    mov.tipo === "saida"
                                      ? "error.main"
                                      : "success.main",
                                }}
                              >
                                {mov.tipo === "saida" ? "-" : "+"}
                                {mov.quantidade}
                              </Typography>
                            </TableCell>
                            <TableCell
                              sx={{ color: "text.secondary", fontSize: "14px" }}
                            >
                              {mov.motivo || "—"}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {mov.observacoes || "—"}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Paginação - Movimentações */}
                <PaginationControls
                  paginaAtual={paginaAtualMovimentacoes}
                  totalPaginas={totalPaginasMovimentacoes}
                  indiceInicial={indiceInicialMovimentacoes}
                  indiceFinal={indiceFinalMovimentacoes}
                  totalItens={movimentacoes.length}
                  itemLabel="movimentação"
                  onPrimeira={irParaPrimeiraPaginaMovimentacoes}
                  onAnterior={irParaPaginaAnteriorMovimentacoes}
                  onProxima={irParaProximaPaginaMovimentacoes}
                  onUltima={irParaUltimaPaginaMovimentacoes}
                  onPagina={setPaginaAtualMovimentacoes}
                />
              </TableContainer>
            </Box>
          )}

          {/* Tab Inventário */}
          {tabAtual === 2 && (
            <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
              <Inventory sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body1" sx={{ mb: 1 }}>
                Inventário em desenvolvimento
              </Typography>
              <Typography variant="body2">
                Aqui você poderá realizar contagens de estoque
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default Estoque;
