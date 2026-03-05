// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  TrendingUp,
  ShoppingCart,
  PeopleOutline,
  AttachMoney,
  Refresh,
  CalendarMonth,
  Inventory,
  LocalOffer,
  CreditCard,
  CheckCircle,
} from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { vendasService } from "../api/vendasService";
import { clientesService } from "../api/clientesService";
import { produtosService } from "../api/produtosService";

const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const STORAGE_METAS = "vexa_dashboard_metas";

function getPrimeiroUltimoDiaMes(ano, mes) {
  const primeiro = new Date(ano, mes, 1);
  const ultimo = new Date(ano, mes + 1, 0);
  return {
    inicio: primeiro.toISOString().split("T")[0],
    fim: ultimo.toISOString().split("T")[0],
  };
}

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const hoje = new Date();
  const [anoMes, setAnoMes] = useState({
    ano: hoje.getFullYear(),
    mes: hoje.getMonth(),
  });
  const { inicio: dataInicio, fim: dataFim } = getPrimeiroUltimoDiaMes(anoMes.ano, anoMes.mes);

  const [carregando, setCarregando] = useState(true);
  const [stats, setStats] = useState({
    faturamentoMes: 0,
    vendasMes: 0,
    novosClientes: 0,
    ticketMedio: 0,
    valorBrutoVendas: 0,
  });

  const [metas, setMetas] = useState({
    faturamento: 320000,
    vendas: 1500,
    novosClientes: 150,
  });
  const [openMetasDialog, setOpenMetasDialog] = useState(false);
  const [metasEdit, setMetasEdit] = useState({ faturamento: "", vendas: "", novosClientes: "" });

  const [faturamentoMensal, setFaturamentoMensal] = useState({
    meses: MESES_LABEL,
    valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    maxY: 300,
  });
  const [vendasPorCategoria, setVendasPorCategoria] = useState([
    { categoria: "Roupas", valor: 0, percentual: 0, cor: "#14B8A6" },
    { categoria: "Calçados", valor: 0, percentual: 0, cor: "#8B5CF6" },
    { categoria: "Acessórios", valor: 0, percentual: 0, cor: "#EAB308" },
  ]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([]);
  const [topVendedores, setTopVendedores] = useState([]);
  const [estoqueCritico, setEstoqueCritico] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([
    { tipo: "Crédito", percentual: 0, valor: 0, cor: "#14B8A6" },
    { tipo: "Débito", percentual: 0, valor: 0, cor: "#8B5CF6" },
    { tipo: "Pix", percentual: 0, valor: 0, cor: "#3B82F6" },
    { tipo: "Dinheiro", percentual: 0, valor: 0, cor: "#EAB308" },
  ]);

  const CORES_PRODUTOS = ["#14B8A6", "#8B5CF6", "#3B82F6", "#EAB308", "#EF4444"];
  const CORES_VENDEDORES = ["#10B981", "#14B8A6", "#F59E0B"];

  function mapearCategoria(nome) {
    if (!nome) return null;
    const n = String(nome).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    if (n.includes("roup") || n.includes("vestu")) return "Roupas";
    if (n.includes("calcad") || n.includes("tenis") || n.includes("sapato") || n.includes("bota") || n.includes("chinelo")) return "Calçados";
    if (n.includes("acessor") || n.includes("bolsa") || n.includes("relogio") || n.includes("mochila")) return "Acessórios";
    return null;
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_METAS);
      if (stored) {
        const parsed = JSON.parse(stored);
        setMetas({
          faturamento: parsed.faturamento ?? 320000,
          vendas: parsed.vendas ?? 1500,
          novosClientes: parsed.novosClientes ?? 150,
        });
      }
    } catch (_) {}
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setCarregando(true);
    try {
      const [vendasRes, clientesRes, produtosRes] = await Promise.all([
        vendasService.getAll({ pagina: 1, tamanho: 500 }),
        clientesService.getAll({ pagina: 1, tamanho: 500 }),
        produtosService.getAll({ pagina: 1, tamanho: 500 }),
      ]);

      const vendasList = Array.isArray(vendasRes)
        ? vendasRes
        : vendasRes?.vendas ?? vendasRes?.Vendas ?? vendasRes?.items ?? vendasRes?.data ?? [];
      const clientesList = Array.isArray(clientesRes)
        ? clientesRes
        : clientesRes?.clientes ?? clientesRes?.Clientes ?? clientesRes?.items ?? clientesRes?.data ?? [];
      const produtosList = Array.isArray(produtosRes)
        ? produtosRes
        : produtosRes?.produtos ?? produtosRes?.Produtos ?? produtosRes?.items ?? produtosRes?.data ?? [];

      const vendasValidas = vendasList.filter((v) => {
        const status = (v.status ?? v.Status ?? "").toString().toLowerCase();
        return status !== "cancelada";
      });

      const vendasFiltradas = vendasValidas.filter((v) => {
        const dataStr = v.dataVenda ?? v.DataVenda ?? v.data ?? v.Data ?? v.createdAt ?? v.CreatedAt ?? "";
        if (!dataStr) return false;
        const d = new Date(dataStr).toISOString().split("T")[0];
        return d >= dataInicio && d <= dataFim;
      });

      let lucroTotal = 0;
      let valorBrutoTotal = 0;

      for (const venda of vendasFiltradas) {
        const valorTotal = Number(venda.valorTotal ?? venda.ValorTotal) || 0;
        valorBrutoTotal += valorTotal;
        const itens = venda.itens ?? venda.Itens ?? venda.items ?? [];
        if (itens.length > 0) {
          for (const item of itens) {
            const qty = Number(item.quantidade) || 0;
            const precoVenda =
              Number(item.precoUnitario ?? item.produto?.precoVenda ?? item.precoVenda) || 0;
            const precoCusto =
              Number(item.produto?.precoCusto ?? item.precoCusto) || 0;
            lucroTotal += (precoVenda - precoCusto) * qty;
          }
        } else {
          lucroTotal += valorTotal;
        }
      }

      const novosClientes = clientesList.filter((c) => {
        const dataStr = c.dataCriacao ?? c.createdAt ?? c.created_at ?? "";
        if (!dataStr) return false;
        const d = new Date(dataStr).toISOString().split("T")[0];
        return d >= dataInicio && d <= dataFim;
      }).length;

      const ticketMedio =
        vendasFiltradas.length > 0
          ? Math.round((valorBrutoTotal / vendasFiltradas.length) * 100) / 100
          : 0;

      setStats({
        faturamentoMes: Math.round(lucroTotal * 100) / 100,
        vendasMes: vendasFiltradas.length,
        novosClientes,
        ticketMedio,
        valorBrutoVendas: Math.round(valorBrutoTotal * 100) / 100,
      });

      // Faturamento mensal - valor bruto por mês do ano selecionado
      const fatPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (const venda of vendasValidas) {
        const dataStr = venda.dataVenda ?? venda.DataVenda ?? venda.data ?? venda.Data ?? venda.createdAt ?? venda.CreatedAt ?? "";
        if (!dataStr) continue;
        const dt = new Date(dataStr);
        if (dt.getFullYear() !== anoMes.ano) continue;
        const mes = dt.getMonth();
        fatPorMes[mes] += Number(venda.valorTotal ?? venda.ValorTotal) || 0;
      }
      const maxFat = Math.max(...fatPorMes, 1);
      const valoresChart = fatPorMes.map((v) => Math.round((v / 1000) * 10) / 10);
      setFaturamentoMensal({ meses: MESES_LABEL, valores: valoresChart, maxY: Math.ceil(maxFat / 1000) + 10 });

      // Vendas por categoria - Roupas, Calçados, Acessórios (do mês)
      const catMap = { Roupas: 0, Calçados: 0, Acessórios: 0 };
      const produtosById = {};
      produtosList.forEach((p) => { produtosById[p.id] = p; });
      for (const venda of vendasFiltradas) {
        const itens = venda.itens ?? venda.Itens ?? venda.items ?? [];
        for (const item of itens) {
          const pid = item.produtoId ?? item.produto?.id;
          const catNome =
            item.produto?.categoria?.nome ??
            item.categoriaNome ??
            (pid ? (produtosById[pid]?.categoria?.nome ?? produtosById[pid]?.categoriaNome ?? "") : "");
          const cat = mapearCategoria(catNome);
          if (cat && catMap[cat] !== undefined) {
            const valor = (Number(item.precoUnitario ?? item.produto?.precoVenda ?? 0) || 0) * (Number(item.quantidade) || 0);
            catMap[cat] += valor;
          }
        }
      }
      const totalCat = Object.values(catMap).reduce((a, b) => a + b, 0);
      setVendasPorCategoria([
        { categoria: "Roupas", valor: catMap.Roupas, percentual: totalCat ? Math.round((catMap.Roupas / totalCat) * 100) : 0, cor: "#14B8A6" },
        { categoria: "Calçados", valor: catMap.Calçados, percentual: totalCat ? Math.round((catMap.Calçados / totalCat) * 100) : 0, cor: "#8B5CF6" },
        { categoria: "Acessórios", valor: catMap.Acessórios, percentual: totalCat ? Math.round((catMap.Acessórios / totalCat) * 100) : 0, cor: "#EAB308" },
      ]);

      // Produtos mais vendidos - top 5 por quantidade (do mês)
      const prodVendas = {};
      for (const venda of vendasFiltradas) {
        const itens = venda.itens ?? venda.Itens ?? venda.items ?? [];
        for (const item of itens) {
          const pid = item.produtoId ?? item.produto?.id;
          const nome = item.produto?.nome ?? item.nomeProduto ?? item.nome ?? "Produto";
          if (!pid) continue;
          if (!prodVendas[pid]) prodVendas[pid] = { id: pid, nome, quantidade: 0, valor: 0 };
          const qty = Number(item.quantidade) || 0;
          const preco = Number(item.precoUnitario ?? item.produto?.precoVenda ?? 0) || 0;
          prodVendas[pid].quantidade += qty;
          prodVendas[pid].valor += preco * qty;
        }
      }
      const top5 = Object.values(prodVendas)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5)
        .map((p, i) => ({
          label: p.nome,
          valor: Math.round(p.valor * 100) / 100,
          quantidade: p.quantidade,
          percentual: 0,
          cor: CORES_PRODUTOS[i] ?? "#14B8A6",
        }));
      const totQty = top5.reduce((a, p) => a + p.quantidade, 0);
      top5.forEach((p) => { p.percentual = totQty ? Math.round((p.quantidade / totQty) * 100) : 0; });
      setProdutosMaisVendidos(top5);

      // Estoque crítico - 5 produtos com menor estoque
      const prodsEstoque = produtosList
        .map((p) => ({
          produto: p.nome ?? "Produto",
          estoque: Number(p.quantidadeEstoque ?? p.estoque ?? 0) || 0,
          minimo: Number(p.estoqueMinimo ?? 0) || 0,
          status: "ok",
        }))
        .filter((p) => p.estoque >= 0)
        .sort((a, b) => a.estoque - b.estoque)
        .slice(0, 5);
      prodsEstoque.forEach((p) => {
        p.status = p.estoque <= p.minimo ? "crítico" : p.estoque <= p.minimo * 1.5 ? "baixo" : "ok";
      });
      setEstoqueCritico(prodsEstoque);

      // Top vendedores - vendas do mês por vendedor
      const vendedorMap = {};
      for (const venda of vendasFiltradas) {
        const vid = venda.vendedorId ?? venda.VendedorId ?? venda.usuarioId ?? venda.UsuarioId ?? venda.vendedor?.id ?? venda.Vendedor?.id ?? venda.usuario?.id ?? venda.Usuario?.id;
        const vnome = venda.vendedor?.nome ?? venda.Vendedor?.nome ?? venda.usuario?.nome ?? venda.Usuario?.nome ?? venda.nomeVendedor ?? venda.NomeVendedor ?? "Vendedor";
        const key = vid ?? "sem-id";
        if (!vendedorMap[key]) vendedorMap[key] = { id: key, nome: vnome, valor: 0 };
        vendedorMap[key].valor += Number(venda.valorTotal ?? venda.ValorTotal) || 0;
      }
      const topVend = Object.values(vendedorMap)
        .filter((v) => v.valor > 0)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 3)
        .map((v, i) => ({
          nome: v.nome,
          vendas: `R$ ${v.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          valor: v.valor,
          percentual: 0,
          meta: "R$ 50.000",
          cor: CORES_VENDEDORES[i] ?? "#10B981",
        }));
      const maxVal = topVend[0]?.valor ?? 1;
      topVend.forEach((v) => { v.percentual = Math.round((v.valor / maxVal) * 100); });
      setTopVendedores(topVend);

      // Formas de pagamento - distribuição das vendas do mês
      const fpMap = { credito: 0, debito: 0, pix: 0, dinheiro: 0 };
      for (const venda of vendasFiltradas) {
        const fp = (venda.formaPagamento ?? venda.FormaPagamento ?? "").toString().toLowerCase().replace(/[^a-z]/g, "");
        const val = Number(venda.valorTotal ?? venda.ValorTotal) || 0;
        if (fp.includes("cred") || fp === "credito") fpMap.credito += val;
        else if (fp.includes("deb") || fp === "debito") fpMap.debito += val;
        else if (fp.includes("pix")) fpMap.pix += val;
        else if (fp.includes("dinhe") || fp === "dinheiro") fpMap.dinheiro += val;
        else fpMap.credito += val;
      }
      const totalFp = Object.values(fpMap).reduce((a, b) => a + b, 0);
      const pct = (v) => (totalFp ? Math.round((v / totalFp) * 100) : 25);
      setFormasPagamento([
        { tipo: "Crédito", valor: fpMap.credito, percentual: pct(fpMap.credito), cor: "#14B8A6" },
        { tipo: "Débito", valor: fpMap.debito, percentual: pct(fpMap.debito), cor: "#8B5CF6" },
        { tipo: "Pix", valor: fpMap.pix, percentual: pct(fpMap.pix), cor: "#3B82F6" },
        { tipo: "Dinheiro", valor: fpMap.dinheiro, percentual: pct(fpMap.dinheiro), cor: "#EAB308" },
      ]);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      setStats({
        faturamentoMes: 0,
        vendasMes: 0,
        novosClientes: 0,
        ticketMedio: 0,
        valorBrutoVendas: 0,
      });
      setFaturamentoMensal({ meses: MESES_LABEL, valores: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], maxY: 300 });
      setVendasPorCategoria([
        { categoria: "Roupas", valor: 0, percentual: 0, cor: "#14B8A6" },
        { categoria: "Calçados", valor: 0, percentual: 0, cor: "#8B5CF6" },
        { categoria: "Acessórios", valor: 0, percentual: 0, cor: "#EAB308" },
      ]);
      setProdutosMaisVendidos([]);
      setTopVendedores([]);
      setEstoqueCritico([]);
      setFormasPagamento([
        { tipo: "Crédito", percentual: 0, valor: 0, cor: "#14B8A6" },
        { tipo: "Débito", percentual: 0, valor: 0, cor: "#8B5CF6" },
        { tipo: "Pix", percentual: 0, valor: 0, cor: "#3B82F6" },
        { tipo: "Dinheiro", percentual: 0, valor: 0, cor: "#EAB308" },
      ]);
    } finally {
      setCarregando(false);
    }
  }, [dataInicio, dataFim, anoMes.ano]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const metasDoMes = [
    {
      meta: "Faturamento",
      atual: stats.valorBrutoVendas,
      objetivo: metas.faturamento,
      percentual:
        metas.faturamento > 0
          ? Math.round((stats.valorBrutoVendas / metas.faturamento) * 100)
          : 0,
    },
    {
      meta: "Vendas",
      atual: stats.vendasMes,
      objetivo: metas.vendas,
      percentual:
        metas.vendas > 0
          ? Math.round((stats.vendasMes / metas.vendas) * 100)
          : 0,
    },
    {
      meta: "Novos Clientes",
      atual: stats.novosClientes,
      objetivo: metas.novosClientes,
      percentual:
        metas.novosClientes > 0
          ? Math.round((stats.novosClientes / metas.novosClientes) * 100)
          : 0,
    },
  ];

  const handleAbrirMetasDialog = () => {
    setMetasEdit({
      faturamento: String(metas.faturamento),
      vendas: String(metas.vendas),
      novosClientes: String(metas.novosClientes),
    });
    setOpenMetasDialog(true);
  };

  const handleSalvarMetas = () => {
    const fat = parseInt(metasEdit.faturamento, 10) || 0;
    const vend = parseInt(metasEdit.vendas, 10) || 0;
    const nov = parseInt(metasEdit.novosClientes, 10) || 0;
    const novas = { faturamento: fat, vendas: vend, novosClientes: nov };
    setMetas(novas);
    try {
      localStorage.setItem(STORAGE_METAS, JSON.stringify(novas));
    } catch (_) {}
    setOpenMetasDialog(false);
  };

  const irParaMesAtual = () => {
    setAnoMes({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  };

  const ehMesAtual =
    anoMes.ano === hoje.getFullYear() && anoMes.mes === hoje.getMonth();

  const formatFaturamento = (v) =>
    v >= 1000 ? `R$ ${(v / 1000).toFixed(v >= 1000000 ? 1 : 2)}${v >= 1000000 ? "M" : "K"}` : `R$ ${v.toFixed(2)}`;

  const statCards = [
    {
      title: "Faturamento do Mês (Lucro)",
      value: formatFaturamento(stats.faturamentoMes),
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      icon: <AttachMoney />,
      iconBg: "#FEF3C7",
      iconColor: "#F59E0B",
      borderColor: "#EAB308",
      trendData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, stats.faturamentoMes],
      trendColor: "#EAB308",
    },
    {
      title: "Total de Vendas",
      value: stats.vendasMes,
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      icon: <ShoppingCart />,
      iconBg: "#CCFBF1",
      iconColor: "#14B8A6",
      borderColor: "#14B8A6",
      trendData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, stats.vendasMes],
      trendColor: "#14B8A6",
    },
    {
      title: "Novos Clientes",
      value: stats.novosClientes,
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      icon: <PeopleOutline />,
      iconBg: "#FEE2E2",
      iconColor: "#EF4444",
      borderColor: "#EF4444",
      trendData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, stats.novosClientes],
      trendColor: "#EF4444",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${stats.ticketMedio.toFixed(2)}`,
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      icon: <LocalOffer />,
      iconBg: "#E0E7FF",
      iconColor: "#6366F1",
      borderColor: "#6366F1",
      trendData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, stats.ticketMedio],
      trendColor: "#6366F1",
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        p: { xs: 1.5, sm: 2, md: 2.5 },
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: { xs: 1.5, sm: 0 },
          mb: { xs: 2, md: 2.5 },
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 0.5,
              fontSize: { xs: 20, sm: 24, md: 28 },
            }}
          >
            Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: 12, sm: 13, md: 14 },
            }}
          >
            Visão geral da sua loja
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: { xs: 1, sm: 1.5 },
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={`${anoMes.mes}-${anoMes.ano}`}
                onChange={(e) => {
                  const [mes, ano] = e.target.value.split("-").map(Number);
                  setAnoMes({ ano, mes });
                }}
                sx={{
                  fontSize: { xs: 11, sm: 12 },
                  height: 36,
                  "& .MuiSelect-select": { py: 0.8 },
                }}
              >
                {(() => {
                  const opts = [];
                  const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                  for (let i = 0; i < 24; i++) {
                    const d = new Date(fim);
                    d.setMonth(d.getMonth() - i);
                    const m = d.getMonth();
                    const a = d.getFullYear();
                    opts.push(
                      <MenuItem key={`${m}-${a}`} value={`${m}-${a}`}>
                        {MESES_LABEL[m]} {a}
                      </MenuItem>
                    );
                  }
                  return opts;
                })()}
              </Select>
            </FormControl>
            <Box
              onClick={irParaMesAtual}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                bgcolor: ehMesAtual
                  ? theme.palette.primary.main
                  : theme.palette.background.paper,
                color: ehMesAtual
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.7, sm: 1 },
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                cursor: "pointer",
                "&:hover": {
                  bgcolor: ehMesAtual
                    ? theme.palette.primary.dark
                    : theme.palette.action.hover,
                },
              }}
            >
              <CalendarMonth sx={{ fontSize: { xs: 16, sm: 18 } }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: 11, sm: 12 } }}>
                Este Mês
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={() => fetchDashboardData()}
            sx={{
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              "&:hover": { bgcolor: theme.palette.action.hover },
              width: { xs: 32, sm: 36, md: 40 },
              height: { xs: 32, sm: 36, md: 40 },
            }}
          >
            <Refresh
              sx={{
                fontSize: { xs: 16, sm: 18, md: 20 },
                color: theme.palette.text.secondary,
              }}
            />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Cards + Metas do Mês */}
      <Grid
        container
        spacing={{ xs: 1, sm: 1.5, md: 2 }}
        sx={{ mb: { xs: 1.5, md: 2 } }}
      >
        {/* Stats Cards - 4 colunas em desktop, 2 em mobile */}
        {statCards.map((stat, index) => (
          <Grid item xs={6} sm={6} md={6} lg={2.4} key={index}>
            <Card
              elevation={0}
              sx={{
                borderRadius: { xs: 2, md: 3 },
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderTop: `3px solid ${stat.borderColor}`,
                height: "100%",
              }}
            >
              <CardContent
                sx={{
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.5 } },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: { xs: 1, md: 1.5 },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 36, sm: 42, md: 48 },
                      height: { xs: 36, sm: 42, md: 48 },
                      borderRadius: { xs: 1.5, md: 2 },
                      bgcolor: stat.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {React.cloneElement(stat.icon, {
                      sx: {
                        fontSize: { xs: 18, sm: 20, md: 24 },
                        color: stat.iconColor,
                      },
                    })}
                  </Box>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    display: "block",
                    mb: { xs: 0.5, md: 0.8 },
                    fontSize: { xs: 10, sm: 11, md: 13 },
                  }}
                >
                  {stat.title}
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    mb: { xs: 0.8, md: 1.2 },
                    fontSize: { xs: 18, sm: 24, md: 28 },
                  }}
                >
                  {stat.value}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: { xs: 9, sm: 10, md: 12 },
                  }}
                >
                  {stat.subtitle}
                </Typography>

                <Box
                  sx={{
                    width: "100%",
                    height: { xs: 30, sm: 35, md: 40 },
                    mt: 0.5,
                  }}
                >
                  <LineChart
                    xAxis={[
                      {
                        data: Array.from(
                          { length: stat.trendData.length },
                          (_, i) => i,
                        ),
                        hide: true,
                      },
                    ]}
                    yAxis={[{ hide: true }]}
                    series={[
                      {
                        data: stat.trendData,
                        color: stat.trendColor,
                        showMark: false,
                        curve: "catmullRom",
                        area: true,
                      },
                    ]}
                    height={isMobile ? 30 : isTablet ? 35 : 40}
                    margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    sx={{
                      "& .MuiLineElement-root": { strokeWidth: 2 },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Metas do Mês - No canto superior direito */}
        <Grid item xs={12} sm={12} md={12} lg={2.4}>
          <Card
            elevation={0}
            onClick={handleAbrirMetasDialog}
            sx={{
              borderRadius: { xs: 2, md: 3 },
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              height: "100%",
              cursor: "pointer",
              "&:hover": { bgcolor: theme.palette.action.hover },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.5 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: 13, sm: 14, md: 15 },
                  }}
                >
                  Metas do Mês
                </Typography>
                <CheckCircle
                  sx={{ fontSize: { xs: 16, md: 18 }, color: "#10B981" }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 2.5, md: 3 },
                }}
              >
                {metasDoMes.map((item, index) => (
                  <Box key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.primary,
                          fontSize: { xs: 11, md: 12 },
                          fontWeight: 600,
                        }}
                      >
                        {item.meta}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: { xs: 9, md: 10 },
                        }}
                      >
                        {item.meta === "Faturamento"
                          ? formatFaturamento(item.atual)
                          : String(item.atual)}
                      </Typography>
                    </Box>

                    <Box sx={{ position: "relative" }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, item.percentual)}
                        sx={{
                          height: { xs: 10, md: 12 },
                          borderRadius: 1.5,
                          bgcolor: theme.palette.action.disabledBackground,
                          "& .MuiLinearProgress-bar": {
                            bgcolor:
                              item.percentual >= 90
                                ? theme.palette.success.main
                                : item.percentual >= 70
                                  ? "#14B8A6"
                                  : theme.palette.warning.main,
                            borderRadius: 1.5,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          right: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: { xs: 8, md: 9 },
                        }}
                      >
                        {item.percentual}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Conteúdo principal - Grid Responsivo */}
      <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
        {/* Faturamento Mensal */}
        <Grid item xs={12} md={6} lg={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: { xs: 2, md: 3 },
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.5 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: 14, sm: 15, md: 16 },
                  }}
                >
                  Faturamento Mensal
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Box
                    sx={{
                      width: { xs: 8, md: 10 },
                      height: { xs: 8, md: 10 },
                      borderRadius: "50%",
                      bgcolor: "#14B8A6",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: { xs: 10, md: 11 },
                      fontWeight: 500,
                    }}
                  >
                    {anoMes.ano}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{ width: "100%", height: { xs: 180, sm: 220, md: 250 } }}
              >
                <LineChart
                  xAxis={[
                    {
                      scaleType: "point",
                      data: faturamentoMensal.meses,
                      tickLabelStyle: {
                        fontSize: isMobile ? 9 : isTablet ? 10 : 11,
                        fill: theme.palette.text.secondary,
                        fontWeight: 500,
                      },
                    },
                  ]}
                  yAxis={[
                    {
                      min: 0,
                      max: faturamentoMensal.maxY ?? 300,
                      tickLabelStyle: {
                        fontSize: isMobile ? 9 : 10,
                        fill: theme.palette.text.secondary,
                        fontWeight: 500,
                      },
                      valueFormatter: (value) => `${value}K`,
                    },
                  ]}
                  series={[
                    {
                      data: faturamentoMensal.valores,
                      color: "#14B8A6",
                      showMark: !isMobile,
                      curve: "catmullRom",
                      label: "Faturamento",
                    },
                  ]}
                  height={isMobile ? 180 : isTablet ? 220 : 250}
                  margin={{
                    left: isMobile ? 40 : 50,
                    right: isMobile ? 10 : 15,
                    top: 10,
                    bottom: isMobile ? 25 : 30,
                  }}
                  grid={{ horizontal: true }}
                  sx={{
                    "& .MuiChartsAxis-line": { stroke: theme.palette.divider },
                    "& .MuiChartsAxis-tick": { stroke: theme.palette.divider },
                    "& .MuiChartsGrid-line": {
                      stroke: theme.palette.action.disabledBackground,
                    },
                    "& .MuiLineElement-root": {
                      strokeWidth: isMobile ? 2 : 2.5,
                    },
                    "& .MuiMarkElement-root": {
                      scale: "0.6",
                      fill: theme.palette.background.paper,
                      strokeWidth: 2,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Vendas por Categoria */}
        <Grid item xs={12} md={6} lg={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: { xs: 2, md: 3 },
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.5 } },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontSize: { xs: 14, sm: 15, md: 16 },
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                Vendas por Categoria
              </Typography>

              <Box
                sx={{ width: "100%", height: { xs: 160, sm: 200, md: 220 } }}
              >
                <BarChart
                  xAxis={[
                    {
                      scaleType: "band",
                      data: vendasPorCategoria.map((item) => item.categoria),
                      tickLabelStyle: {
                        fontSize: isMobile ? 9 : 11,
                        fill: theme.palette.text.secondary,
                        fontWeight: 500,
                      },
                    },
                  ]}
                  yAxis={[
                    {
                      tickLabelStyle: {
                        fontSize: isMobile ? 9 : 10,
                        fill: theme.palette.text.secondary,
                        fontWeight: 500,
                      },
                      valueFormatter: (value) => `${value / 1000}K`,
                    },
                  ]}
                  series={[
                    {
                      data: vendasPorCategoria.map((item) => item.valor),
                      color: "#14B8A6",
                    },
                  ]}
                  height={isMobile ? 160 : isTablet ? 200 : 220}
                  margin={{
                    left: isMobile ? 40 : 50,
                    right: isMobile ? 10 : 15,
                    top: 10,
                    bottom: isMobile ? 25 : 30,
                  }}
                  sx={{
                    "& .MuiChartsAxis-line": { stroke: theme.palette.divider },
                    "& .MuiChartsAxis-tick": { stroke: theme.palette.divider },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  mt: { xs: 1.5, md: 2 },
                }}
              >
                {vendasPorCategoria.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
                    >
                      <Box
                        sx={{
                          width: { xs: 8, md: 10 },
                          height: { xs: 8, md: 10 },
                          borderRadius: "50%",
                          bgcolor: item.cor,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: { xs: 11, md: 12 },
                          fontWeight: 500,
                        }}
                      >
                        {item.categoria}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontSize: { xs: 11, md: 13 },
                        fontWeight: 700,
                      }}
                    >
                      R$ {item.valor >= 1000 ? `${(item.valor / 1000).toFixed(0)}K` : item.valor.toFixed(0)} ({item.percentual}%)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Produtos Mais Vendidos */}
        <Grid item xs={12} md={6} lg={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: { xs: 2, md: 3 },
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.5 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: 14, sm: 15, md: 16 },
                  }}
                >
                  Produtos Mais Vendidos
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: { xs: 10, md: 11 },
                  }}
                >
                  Este mês
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, md: 2 },
                  alignItems: "center",
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 140, sm: 160, md: 180 },
                    height: { xs: 140, sm: 160, md: 180 },
                    flexShrink: 0,
                  }}
                >
                  {produtosMaisVendidos.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: produtosMaisVendidos.map((item) => ({
                          value: item.percentual || 1,
                          label: item.label,
                          color: item.cor,
                        })),
                        innerRadius: isMobile ? 45 : isTablet ? 50 : 55,
                        outerRadius: isMobile ? 65 : isTablet ? 75 : 85,
                      },
                    ]}
                    height={isMobile ? 140 : isTablet ? 160 : 180}
                    width={isMobile ? 140 : isTablet ? 160 : 180}
                    slotProps={{
                      legend: { hidden: true },
                    }}
                    sx={{
                      "& .MuiChartsLegend-root": { display: "none" },
                    }}
                  />
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "text.secondary" }}>
                      <Typography variant="body2">Nenhuma venda este mês</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1.5, md: 2 },
                }}
              >
                {produtosMaisVendidos.length > 0 && produtosMaisVendidos.map((item, index) => (
                  <Box key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.6,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
                      >
                        <Box
                          sx={{
                            width: { xs: 8, md: 10 },
                            height: { xs: 8, md: 10 },
                            borderRadius: "50%",
                            bgcolor: item.cor,
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: { xs: 11, md: 12 },
                            fontWeight: 500,
                          }}
                        >
                          {item.label}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.primary,
                          fontSize: { xs: 11, md: 12 },
                          fontWeight: 700,
                        }}
                      >
                        {item.quantidade} un.
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <LinearProgress
                        variant="determinate"
                        value={item.percentual * 2.5}
                        sx={{
                          width: "70%",
                          height: { xs: 5, md: 6 },
                          borderRadius: 1,
                          bgcolor: theme.palette.action.disabledBackground,
                          "& .MuiLinearProgress-bar": {
                            bgcolor: item.cor,
                            borderRadius: 1,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: { xs: 10, md: 11 },
                          fontWeight: 600,
                        }}
                      >
                        R$ {(item.valor / 1000).toFixed(1)}K
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Estoque Crítico */}
        <Grid item xs={12} md={6} lg={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: { xs: 2, md: 3 },
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.5 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: 14, sm: 15, md: 16 },
                  }}
                >
                  Estoque Crítico
                </Typography>
                <Chip
                  icon={<Inventory sx={{ fontSize: { xs: 12, md: 14 } }} />}
                  label={estoqueCritico.filter((p) => p.status !== "ok").length || estoqueCritico.length}
                  size="small"
                  sx={{
                    bgcolor: "#FEE2E2",
                    color: "#DC2626",
                    fontWeight: 700,
                    fontSize: { xs: 10, md: 11 },
                    height: { xs: 22, md: 24 },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 2, md: 2.5 },
                }}
              >
                {estoqueCritico.map((item, index) => (
                  <Box key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.8,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.primary,
                          fontSize: { xs: 12, md: 13 },
                          fontWeight: 600,
                        }}
                      >
                        {item.produto}
                      </Typography>
                      <Chip
                        label={item.status === "crítico" ? "CRÍTICO" : item.status === "baixo" ? "BAIXO" : "NORMAL"}
                        size="small"
                        sx={{
                          bgcolor:
                            item.status === "crítico" ? "#FEE2E2" : item.status === "baixo" ? "#FEF3C7" : "#E0E7FF",
                          color:
                            item.status === "crítico" ? "#DC2626" : item.status === "baixo" ? "#D97706" : "#4F46E5",
                          fontWeight: 700,
                          fontSize: { xs: 8, md: 9 },
                          height: { xs: 18, md: 20 },
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.6,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: { xs: 10, md: 11 },
                        }}
                      >
                        Atual: {item.estoque} un.
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.disabled,
                          fontSize: { xs: 10, md: 11 },
                        }}
                      >
                        Mín: {item.minimo} un.
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={item.minimo > 0 ? Math.min(100, (item.estoque / item.minimo) * 100) : 100}
                      sx={{
                        height: { xs: 6, md: 8 },
                        borderRadius: 1,
                        bgcolor: "#F1F5F9",
                        "& .MuiLinearProgress-bar": {
                          bgcolor:
                            item.status === "crítico" ? "#EF4444" : "#F59E0B",
                          borderRadius: 1,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Vendedores */}
        <Grid item xs={12} md={6} lg={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: { xs: 2, md: 3 },
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.5 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: 14, sm: 15, md: 16 },
                  }}
                >
                  Top Vendedores
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#14B8A6",
                    fontSize: { xs: 11, md: 12 },
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Este mês
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 2.5, md: 3.5 },
                }}
              >
                {topVendedores.map((item, index) => (
                  <Box key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1.2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.primary,
                            fontSize: { xs: 12, md: 13 },
                            fontWeight: 600,
                            mb: 0.3,
                          }}
                        >
                          {item.nome}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            fontSize: { xs: 10, md: 11 },
                          }}
                        >
                          Meta: {item.meta}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.primary,
                          fontSize: { xs: 12, md: 14 },
                          fontWeight: 700,
                        }}
                      >
                        {item.vendas}
                      </Typography>
                    </Box>

                    <Box sx={{ position: "relative" }}>
                      <LinearProgress
                        variant="determinate"
                        value={item.percentual}
                        sx={{
                          height: { xs: 10, md: 12 },
                          borderRadius: 2,
                          bgcolor: theme.palette.action.disabledBackground,
                          "& .MuiLinearProgress-bar": {
                            bgcolor: item.cor,
                            borderRadius: 2,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: "absolute",
                          left: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: { xs: 8, md: 9 },
                        }}
                      >
                        {item.percentual}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Formas de Pagamento */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card
            elevation={0}
            sx={{
              borderRadius: { xs: 2, md: 3 },
              bgcolor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              height: "100%",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.5 } },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: { xs: 1.5, md: 2 },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    fontSize: { xs: 14, sm: 15, md: 16 },
                  }}
                >
                  Formas de Pagamento
                </Typography>
                <CreditCard
                  sx={{
                    fontSize: { xs: 16, md: 18 },
                    color: theme.palette.text.secondary,
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                  mb: { xs: 1.5, md: 2 },
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    width: { xs: 130, sm: 150, md: 160 },
                    height: { xs: 130, sm: 150, md: 160 },
                    flexShrink: 0,
                  }}
                >
                  <PieChart
                    series={[
                      {
                        data: formasPagamento.map((item) => ({
                          value: item.percentual,
                          label: item.tipo,
                          color: item.cor,
                        })),
                        innerRadius: isMobile ? 40 : isTablet ? 45 : 50,
                        outerRadius: isMobile ? 60 : isTablet ? 70 : 75,
                      },
                    ]}
                    height={isMobile ? 130 : isTablet ? 150 : 160}
                    width={isMobile ? 130 : isTablet ? 150 : 160}
                    slotProps={{
                      legend: { hidden: true },
                    }}
                    sx={{
                      "& .MuiChartsLegend-root": { display: "none" },
                    }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1.2, md: 1.5 },
                }}
              >
                {formasPagamento.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.8 }}
                    >
                      <Box
                        sx={{
                          width: { xs: 8, md: 10 },
                          height: { xs: 8, md: 10 },
                          borderRadius: "50%",
                          bgcolor: item.cor,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: { xs: 11, md: 12 },
                          fontWeight: 500,
                        }}
                      >
                        {item.tipo}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.primary,
                        fontSize: { xs: 12, md: 13 },
                        fontWeight: 700,
                      }}
                    >
                      {item.percentual}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de configuração das Metas */}
      <Dialog
        open={openMetasDialog}
        onClose={() => setOpenMetasDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Configurar Metas do Mês</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Defina as metas. O progresso é calculado com base no valor bruto das vendas.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Meta Faturamento (R$)"
              type="number"
              value={metasEdit.faturamento}
              onChange={(e) =>
                setMetasEdit((p) => ({ ...p, faturamento: e.target.value }))
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Meta Vendas (quantidade)"
              type="number"
              value={metasEdit.vendas}
              onChange={(e) =>
                setMetasEdit((p) => ({ ...p, vendas: e.target.value }))
              }
              fullWidth
              size="small"
            />
            <TextField
              label="Meta Novos Clientes"
              type="number"
              value={metasEdit.novosClientes}
              onChange={(e) =>
                setMetasEdit((p) => ({ ...p, novosClientes: e.target.value }))
              }
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenMetasDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvarMetas}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard;
