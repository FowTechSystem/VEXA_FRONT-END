// src/pages/Condicional.jsx
// Condicional: reserva produto do estoque e conta como venda.
// Ao devolver: produto volta ao estoque e valor é removido dos cálculos de venda.
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tab,
  Tabs,
  Container,
  Stack,
  List,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Add,
  Remove,
  Delete,
  Search,
  Person,
  PersonSearch,
  ShoppingCart,
  AssignmentReturn,
  CheckCircle,
  History,
} from "@mui/icons-material";
import { showSuccess, showError } from "../utils/notifications";
import { produtosService } from "../api/produtosService";
import { clientesService } from "../api/clientesService";
import { condicionalService } from "../api/condicionalService";

function Condicional() {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const [tabAtual, setTabAtual] = useState(0);
  const [carrinho, setCarrinho] = useState([]);
  const [searchProduto, setSearchProduto] = useState("");
  const [listaProdutos, setListaProdutos] = useState([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);

  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [openDialogCliente, setOpenDialogCliente] = useState(false);
  const [searchClienteBusca, setSearchClienteBusca] = useState("");
  const [clientesBusca, setClientesBusca] = useState([]);
  const [carregandoClientesBusca, setCarregandoClientesBusca] = useState(false);

  const [condicionaisPendentes, setCondicionaisPendentes] = useState([]);
  const [carregandoPendentes, setCarregandoPendentes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [devolvendo, setDevolvendo] = useState(null);

  const [openConfirmDevolver, setOpenConfirmDevolver] = useState(false);
  const [condicionalParaDevolver, setCondicionalParaDevolver] = useState(null);

  const produtosFiltrados = listaProdutos.filter((p) => {
    const termo = (searchProduto || "").trim().toLowerCase();
    if (!termo) return true;
    const nome = (p.nome || "").toLowerCase();
    const sku = (p.sku || "").toLowerCase();
    const codigo = String(p.id || "").toLowerCase();
    return nome.includes(termo) || sku.includes(termo) || codigo.includes(termo);
  });

  const calcularTotal = () =>
    carrinho.reduce((acc, item) => acc + item.precoVenda * item.quantidade, 0);

  const podeSalvar = () =>
    clienteSelecionado && carrinho.length > 0;

  const handleAdicionarAoCarrinho = (produto) => {
    const precoVenda = Number(produto.precoVenda ?? produto.precoCusto ?? 0) || 0;
    const item = {
      id: produto.id,
      nome: produto.nome || "Produto",
      precoVenda,
      quantidade: 1,
    };
    const jaNoCarrinho = carrinho.find((c) => c.id === produto.id);
    if (jaNoCarrinho) {
      handleAlterarQuantidade(produto.id, jaNoCarrinho.quantidade + 1);
    } else {
      setCarrinho([...carrinho, item]);
    }
  };

  const handleRemoverProduto = (id) => {
    setCarrinho(carrinho.filter((item) => item.id !== id));
  };

  const handleAlterarQuantidade = (id, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      handleRemoverProduto(id);
      return;
    }
    setCarrinho(
      carrinho.map((item) =>
        item.id === id ? { ...item, quantidade: novaQuantidade } : item
      )
    );
  };

  const salvarCondicional = async () => {
    if (!podeSalvar()) return;
    setSalvando(true);
    try {
      const total = calcularTotal();
      const payload = {
        clienteId: Number(clienteSelecionado.id),
        itens: carrinho.map((item) => ({
          produtoId: Number(item.id),
          quantidade: Number(item.quantidade) || 1,
          precoUnitario: Number(item.precoVenda) || 0,
        })),
        valorTotal: Number(total.toFixed(2)),
      };
      const criado = await condicionalService.criar(payload);
      const cond = {
        id: criado?.id ?? criado?.Id ?? Date.now(),
        data: criado?.data ?? criado?.Data ?? criado?.dataCriacao ?? new Date().toISOString(),
        clienteNome: clienteSelecionado.nome,
        clienteId: clienteSelecionado.id,
        valorTotal: total,
        itens: carrinho.length,
        status: "pendente",
      };
      setCondicionaisPendentes((prev) => [cond, ...prev]);
      setCarrinho([]);
      setClienteSelecionado(null);
      showSuccess("Condicional registrado! Produto reservado do estoque e contabilizado como venda.");
      setTabAtual(1);
    } catch (err) {
      const data = err?.response?.data;
      const status = err?.response?.status;
      // .NET: message/Message, errors (validação), title, detail (ProblemDetails)
      let msg =
        data?.mensagem ??
        data?.message ??
        data?.Message ??
        data?.detail ??
        data?.Detail ??
        data?.title ??
        data?.Title;
      if (!msg && data?.errors) {
        const errs = typeof data.errors === "object"
          ? Object.values(data.errors).flat().filter(Boolean)
          : (Array.isArray(data.errors) ? data.errors : []);
        msg = errs[0] || null;
      }
      if (!msg) {
        msg = status === 404
          ? "Endpoint /api/condicional não encontrado. Implemente no backend."
          : status === 400
          ? "Requisição inválida (400). Verifique o formato do payload ou se a rota existe no backend."
          : "Erro ao registrar condicional. Verifique os dados e o backend.";
      }
      console.error("Condicional create error:", status, data);
      showError(typeof msg === "string" ? msg : "Erro ao registrar condicional.");
    } finally {
      setSalvando(false);
    }
  };

  const abrirConfirmDevolver = (cond) => {
    setCondicionalParaDevolver(cond);
    setOpenConfirmDevolver(true);
  };

  const fecharConfirmDevolver = () => {
    setOpenConfirmDevolver(false);
    setCondicionalParaDevolver(null);
  };

  const handleDevolver = async (cond) => {
    fecharConfirmDevolver();
    setDevolvendo(cond.id);
    try {
      await condicionalService.devolver(cond.id);
      setCondicionaisPendentes((prev) => prev.filter((c) => c.id !== cond.id));
      showSuccess("Condicional devolvido. Produtos voltaram ao estoque e valor removido das vendas.");
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.mensagem ?? data?.message ?? "Erro ao devolver condicional.";
      showError(msg);
    } finally {
      setDevolvendo(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function carregarProdutos() {
      setCarregandoProdutos(true);
      try {
        const data = await produtosService.getAll();
        if (!cancelled) {
          const prods = Array.isArray(data) ? data : data?.produtos ?? data?.items ?? [];
          setListaProdutos(Array.isArray(prods) ? prods : []);
        }
      } catch (err) {
        if (!cancelled) {
          showError("Erro ao carregar produtos.");
          setListaProdutos([]);
        }
      } finally {
        if (!cancelled) setCarregandoProdutos(false);
      }
    }
    carregarProdutos();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (tabAtual !== 1) return;
    let cancelled = false;
    setCarregandoPendentes(true);
    condicionalService
      .listar({ pendente: true, tamanho: 100 })
      .then((data) => {
        if (cancelled) return;
        const list = data?.condicionais ?? data?.Condicionais ?? data?.items ?? (Array.isArray(data) ? data : []);
        const norm = (Array.isArray(list) ? list : []).map((c) => ({
          id: c.id ?? c.Id,
          data: c.data ?? c.Data ?? c.dataCriacao ?? "",
          clienteNome: c.clienteNome ?? c.ClienteNome ?? c.cliente?.nomeCompleto ?? "Cliente",
          clienteId: c.clienteId ?? c.ClienteId,
          valorTotal: Number(c.valorTotal ?? c.ValorTotal ?? 0) || 0,
          itens: c.itens?.length ?? c.Itens?.length ?? 0,
          status: "pendente",
        }));
        setCondicionaisPendentes(norm);
      })
      .catch(() => {
        if (!cancelled) setCondicionaisPendentes([]);
      })
      .finally(() => {
        if (!cancelled) setCarregandoPendentes(false);
      });
    return () => { cancelled = true; };
  }, [tabAtual]);

  useEffect(() => {
    if (!openDialogCliente) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setCarregandoClientesBusca(true);
      try {
        let data;
        if (searchClienteBusca.trim()) {
          data = await clientesService.listarPaginado({
            filtro: "nome",
            valor: searchClienteBusca.trim(),
            pagina: 1,
            tamanho: 50,
          });
        } else {
          data = await clientesService.getAll({ pagina: 1, tamanho: 100 });
        }
        if (cancelled) return;
        const list = data?.clientes ?? data?.Clientes ?? (Array.isArray(data) ? data : data?.items ?? []);
        setClientesBusca(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setClientesBusca([]);
      } finally {
        if (!cancelled) setCarregandoClientesBusca(false);
      }
    }, searchClienteBusca.trim() ? 400 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [openDialogCliente, searchClienteBusca]);

  const selecionarCliente = (cliente) => {
    setClienteSelecionado({
      id: cliente.id ?? cliente.Id,
      nome: cliente.nomeCompleto ?? cliente.NomeCompleto ?? cliente.nome ?? "Cliente",
    });
    setOpenDialogCliente(false);
    setSearchClienteBusca("");
    setClientesBusca([]);
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, color: "text.primary" }}>
          Condicional
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          O condicional reserva produtos do estoque e conta como venda. Ao devolver, os produtos voltam ao estoque e o valor é removido dos cálculos de venda.
        </Typography>

        <Tabs
          value={tabAtual}
          onChange={(_, v) => setTabAtual(v)}
          sx={{
            mb: 3,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
              height: 3,
            },
          }}
        >
          <Tab icon={<ShoppingCart />} iconPosition="start" label="Novo Condicional" />
          <Tab icon={<History />} iconPosition="start" label="Condicionais Pendentes" />
        </Tabs>

        {tabAtual === 0 && (
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {/* Produtos */}
            <Paper
              elevation={0}
              sx={{
                flex: "1 1 55%",
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Produtos
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar produto..."
                value={searchProduto}
                onChange={(e) => setSearchProduto(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
                {carregandoProdutos ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                    Carregando produtos...
                  </Typography>
                ) : produtosFiltrados.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                    Nenhum produto encontrado.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {produtosFiltrados.map((produto) => {
                      const preco = Number(produto.precoVenda ?? produto.precoCusto ?? 0) || 0;
                      return (
                        <Paper
                          key={produto.id}
                          elevation={0}
                          sx={{
                            p: 2,
                            cursor: "pointer",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            "&:hover": {
                              bgcolor: "action.hover",
                              borderColor: isLight ? alpha(theme.palette.primary.main, 0.55) : "primary.main",
                            },
                          }}
                          onClick={() => handleAdicionarAoCarrinho(produto)}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {produto.nome || "Produto"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {produto.sku ? `SKU: ${produto.sku}` : `#${produto.id}`}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: isLight ? "text.primary" : "primary.main",
                                }}
                              >
                                R$ {preco.toFixed(2)}
                              </Typography>
                              <Add sx={{ color: isLight ? "primary.dark" : "primary.main" }} />
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Paper>

            {/* Carrinho */}
            <Paper
              elevation={0}
              sx={{
                flex: "1 1 40%",
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                boxShadow: isLight
                  ? `inset 0 0 0 2px ${alpha(theme.palette.primary.main, 0.35)}`
                  : undefined,
                outline: isLight ? "none" : undefined,
                ...(!isLight && { border: "2px solid", borderColor: "primary.main" }),
                bgcolor: "background.paper",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Carrinho
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="Cliente"
                required
                placeholder="Clique para selecionar o cliente"
                value={clienteSelecionado ? clienteSelecionado.nome : ""}
                onClick={() => setOpenDialogCliente(true)}
                readOnly
                sx={{
                  mb: 2,
                  ...(isLight && {
                    "& .MuiInputLabel-root": { color: "text.secondary" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "primary.dark" },
                    "& .MuiInputLabel-root.MuiInputLabel-shrink": { color: "text.primary" },
                    "& .MuiInputLabel-asterisk": { color: "error.main" },
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "background.paper",
                    },
                  }),
                }}
                error={!clienteSelecionado && carrinho.length > 0}
                helperText={!clienteSelecionado && carrinho.length > 0 ? "Selecione um cliente" : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: clienteSelecionado ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setClienteSelecionado(null); }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                inputProps={{ sx: { cursor: "pointer" } }}
              />

              <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
                {carrinho.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                    Adicione produtos ao carrinho
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="center">Qtd</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right">Valor</TableCell>
                          <TableCell sx={{ fontWeight: 600 }} align="right"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {carrinho.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.nome}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); handleAlterarQuantidade(item.id, item.quantidade - 1); }}
                                >
                                  <Remove fontSize="small" />
                                </IconButton>
                                <Typography variant="body2">{item.quantidade}</Typography>
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); handleAlterarQuantidade(item.id, item.quantidade + 1); }}
                                >
                                  <Add fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              R$ {(item.precoVenda * item.quantidade).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoverProduto(item.id); }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: isLight ? "text.primary" : "primary.main",
                    }}
                  >
                    R$ {calcularTotal().toFixed(2)}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!podeSalvar() || salvando}
                  onClick={salvarCondicional}
                  startIcon={<CheckCircle />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    ...(isLight && {
                      "&.Mui-disabled": {
                        bgcolor: "action.disabledBackground",
                        color: "text.secondary",
                      },
                    }),
                  }}
                >
                  {salvando ? "Registrando..." : "Registrar Condicional"}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
                  Produtos serão reservados do estoque e contabilizados como venda.
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}

        {tabAtual === 1 && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Condicionais Pendentes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ao devolver, os produtos voltam ao estoque e o valor é removido das vendas.
            </Typography>
            {carregandoPendentes ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Carregando...
              </Typography>
            ) : condicionaisPendentes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Nenhum condicional pendente.
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">Itens</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Valor</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {condicionaisPendentes.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          {c.data ? new Date(c.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </TableCell>
                        <TableCell>{c.clienteNome ?? "—"}</TableCell>
                        <TableCell align="center">{c.itens ?? 0}</TableCell>
                        <TableCell align="right">R$ {Number(c.valorTotal || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<AssignmentReturn />}
                            disabled={devolvendo === c.id}
                            onClick={() => abrirConfirmDevolver(c)}
                            sx={{ textTransform: "none" }}
                          >
                            {devolvendo === c.id ? "Devolvendo..." : "Devolver"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}
      </Container>

      <Dialog open={openDialogCliente} onClose={() => setOpenDialogCliente(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonSearch /> Selecionar cliente
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nome..."
            value={searchClienteBusca}
            onChange={(e) => setSearchClienteBusca(e.target.value)}
            autoFocus
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
            {carregandoClientesBusca ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                Carregando...
              </Typography>
            ) : clientesBusca.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                {searchClienteBusca.trim() ? "Nenhum cliente encontrado." : "Digite para buscar."}
              </Typography>
            ) : (
              <List dense>
                {clientesBusca.map((c) => {
                  const nome = c.nomeCompleto ?? c.NomeCompleto ?? c.nome ?? `Cliente #${c.id ?? c.Id}`;
                  return (
                    <ListItemButton
                      key={c.id ?? c.Id}
                      onClick={() => selecionarCliente(c)}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        mb: 1,
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <ListItemText primary={nome} secondary={c.cpf ? `CPF: ${c.cpf}` : `ID: ${c.id ?? c.Id}`} />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialogCliente(false)} sx={{ textTransform: "none" }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openConfirmDevolver}
        onClose={fecharConfirmDevolver}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: "background.paper",
            p: 1,
          },
        }}
        sx={{
          "& .MuiDialog-container": {
            alignItems: "center",
            justifyContent: "center",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}>
          <AssignmentReturn /> Devolver condicional
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Devolver condicional para <strong>{condicionalParaDevolver?.clienteNome ?? "cliente"}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            Os produtos voltarão ao estoque e o valor será removido das vendas.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={fecharConfirmDevolver} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => condicionalParaDevolver && handleDevolver(condicionalParaDevolver)}
            sx={{ textTransform: "none" }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Condicional;
