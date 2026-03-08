// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Grid,
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
import { dashboardService } from "../api/dashboardService";
import { vendasService } from "../api/vendasService";

const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const STORAGE_METAS = "vexa_dashboard_metas";

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const hoje = new Date();
  const [anoMes, setAnoMes] = useState({
    ano: hoje.getFullYear(),
    mes: hoje.getMonth(),
  });
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
  const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const [vendasPorDiaSemana, setVendasPorDiaSemana] = useState([0, 0, 0, 0, 0, 0, 0]);

  const CORES_PRODUTOS = ["#14B8A6", "#8B5CF6", "#3B82F6", "#EAB308"];
  const CORES_VENDEDORES = ["#10B981", "#14B8A6", "#F59E0B"];
  const CORES_CATEGORIAS = { Roupas: "#14B8A6", Calçados: "#8B5CF6", Acessórios: "#EAB308", Outros: "#6B7280" };

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
      const mesApi = anoMes.mes + 1;
      const res = await dashboardService.getResumo(anoMes.ano, mesApi);

      let fatLucro = Number(res.faturamentoMesLucro ?? res.FaturamentoMesLucro) || 0;
      let totalV = Number(res.totalVendas ?? res.TotalVendas) || 0;
      const novosC = Number(res.novosClientes ?? res.NovosClientes) || 0;
      let fatBruto = Number(res.faturamentoMesBruto ?? res.FaturamentoMesBruto) || 0;
      let ticket = Number(res.ticketMedio ?? res.TicketMedio) || 0;

      if (fatLucro === 0 || totalV === 0) {
        try {
          const vendasRes = await vendasService.getAll({ pagina: 1, tamanho: 500 });
          const vendasList = Array.isArray(vendasRes) ? vendasRes : vendasRes?.vendas ?? vendasRes?.Vendas ?? vendasRes?.items ?? vendasRes?.data ?? [];
          const inicio = new Date(anoMes.ano, anoMes.mes, 1).toISOString().split("T")[0];
          const fim = new Date(anoMes.ano, anoMes.mes + 1, 0).toISOString().split("T")[0];
          const vendasFiltradas = vendasList.filter((v) => {
            if ((v.status ?? v.Status ?? "").toString().toLowerCase() === "cancelada") return false;
            const d = (v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? v.dataCriacao ?? "").toString().split("T")[0];
            return d && d >= inicio && d <= fim;
          });
          let lucroCalc = 0;
          let valorBrutoCalc = 0;
          for (const v of vendasFiltradas) {
            valorBrutoCalc += Number(v.valorTotal ?? v.ValorTotal ?? v.valor ?? 0) || 0;
            const itens = v.itens ?? v.Itens ?? v.items ?? [];
            for (const i of itens) {
              const qty = Number(i.quantidade ?? i.Quantidade) || 0;
              const pv = Number(i.precoUnitario ?? i.produto?.precoVenda ?? i.precoVenda ?? 0) || 0;
              const pc = Number(i.produto?.precoCusto ?? i.precoCusto ?? 0) || 0;
              lucroCalc += (pv - pc) * qty;
            }
            if (itens.length === 0) lucroCalc += Number(v.valorTotal ?? v.ValorTotal ?? v.valor ?? 0) || 0;
          }
          if (vendasFiltradas.length > 0) {
            if (fatLucro === 0) fatLucro = Math.round(lucroCalc * 100) / 100;
            if (totalV === 0) totalV = vendasFiltradas.length;
            if (fatBruto === 0) fatBruto = Math.round(valorBrutoCalc * 100) / 100;
            ticket = totalV > 0 ? Math.round((fatBruto / totalV) * 100) / 100 : 0;
          }
        } catch (_) {}
      }

      setStats({
        faturamentoMes: fatLucro,
        vendasMes: totalV,
        novosClientes: novosC,
        ticketMedio: ticket,
        valorBrutoVendas: fatBruto,
      });

      const fatMensal = res.faturamentoMensal ?? res.FaturamentoMensal ?? [];
      const fatPorMes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      (Array.isArray(fatMensal) ? fatMensal : []).forEach((item) => {
        const m = (item.mes ?? item.Mes ?? 1) - 1;
        if (m >= 0 && m < 12) fatPorMes[m] = Number(item.valorBruto ?? item.ValorBruto) || 0;
      });
      const maxFat = Math.max(...fatPorMes, 1);
      const valoresChart = fatPorMes.map((v) => Math.round((v / 1000) * 10) / 10);
      setFaturamentoMensal({ meses: MESES_LABEL, valores: valoresChart, maxY: Math.ceil(maxFat / 1000) + 10 });

      const vendasCat = res.vendasPorCategoria ?? res.VendasPorCategoria ?? [];
      const catList = Array.isArray(vendasCat) ? vendasCat : [];
      const totalQtd = catList.reduce((a, x) => a + (Number(x.quantidadeVendida ?? x.QuantidadeVendida) || 0), 0);
      const totalVal = catList.reduce((a, x) => a + (Number(x.valorVendido ?? x.ValorVendido) || 0), 0);
      const catFormat = catList.map((c) => {
        const nome = c.categoriaNome ?? c.CategoriaNome ?? "Outros";
        const valor = Number(c.valorVendido ?? c.ValorVendido) || 0;
        const qtd = Number(c.quantidadeVendida ?? c.QuantidadeVendida) || 0;
        const pct = totalQtd ? Math.round((qtd / totalQtd) * 100) : (totalVal ? Math.round((valor / totalVal) * 100) : 0);
        return {
          categoria: nome,
          valor,
          quantidade: qtd,
          percentual: pct,
          cor: CORES_CATEGORIAS[nome] ?? "#6B7280",
        };
      });
      if (catFormat.length === 0) {
        setVendasPorCategoria([
          { categoria: "Roupas", valor: 0, percentual: 0, cor: "#14B8A6" },
          { categoria: "Calçados", valor: 0, percentual: 0, cor: "#8B5CF6" },
          { categoria: "Acessórios", valor: 0, percentual: 0, cor: "#EAB308" },
        ]);
      } else {
        setVendasPorCategoria(catFormat);
      }

      const prodsTop = res.produtosMaisVendidos ?? res.ProdutosMaisVendidos ?? [];
      const prodsList = Array.isArray(prodsTop) ? prodsTop : [];
      const totQty = prodsList.reduce((a, p) => a + (Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0), 0);
      const prodsFormat = prodsList.slice(0, 4).map((p, i) => ({
        label: p.produtoNome ?? p.ProdutoNome ?? "Produto",
        quantidade: Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0,
        valor: Number(p.valorVendido ?? p.ValorVendido) || 0,
        percentual: totQty ? Math.round(((Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0) / totQty) * 100) : 0,
        cor: CORES_PRODUTOS[i] ?? "#14B8A6",
      }));
      setProdutosMaisVendidos(prodsFormat);

      const estoqueC = res.estoqueCritico ?? res.EstoqueCritico ?? [];
      const estList = Array.isArray(estoqueC) ? estoqueC : [];
      const estFormat = estList.map((e) => ({
        produto: e.produtoNome ?? e.ProdutoNome ?? "Produto",
        estoque: Number(e.quantidadeAtual ?? e.QuantidadeAtual) ?? 0,
        minimo: Number(e.estoqueMinimo ?? e.EstoqueMinimo) ?? 0,
        status: (e.status ?? e.Status ?? "crítico").toString().toLowerCase().includes("crit") ? "crítico" : "baixo",
      }));
      setEstoqueCritico(estFormat);

      const topV = res.topVendedores ?? res.TopVendedores ?? [];
      const topList = Array.isArray(topV) ? topV : [];
      const maxVal = topList[0] ? (Number(topList[0].valorTotalVendido ?? topList[0].ValorTotalVendido) || 1) : 1;
      const topFormat = topList.slice(0, 3).map((v, i) => ({
        nome: v.nome ?? v.Nome ?? "Vendedor",
        valor: Number(v.valorTotalVendido ?? v.ValorTotalVendido) || 0,
        vendas: `R$ ${(Number(v.valorTotalVendido ?? v.ValorTotalVendido) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        percentual: Math.round(((Number(v.valorTotalVendido ?? v.ValorTotalVendido) || 0) / maxVal) * 100),
        meta: "R$ 50.000",
        cor: CORES_VENDEDORES[i] ?? "#10B981",
      }));
      setTopVendedores(topFormat);

      const formas = res.formasPagamento ?? res.FormasPagamento ?? [];
      const fpList = Array.isArray(formas) ? formas : [];
      const fpPorTipo = { Crédito: 0, Débito: 0, Pix: 0, Dinheiro: 0 };
      fpList.forEach((f) => {
        const t = (f.formaPagamento ?? f.FormaPagamento ?? "").toString().toLowerCase();
        const val = Number(f.valor ?? f.Valor) || 0;
        if (t.includes("cred") || t.includes("credi")) fpPorTipo.Crédito += val;
        else if (t.includes("deb")) fpPorTipo.Débito += val;
        else if (t.includes("pix")) fpPorTipo.Pix += val;
        else if (t.includes("dinhe")) fpPorTipo.Dinheiro += val;
        else fpPorTipo.Crédito += val;
      });
      const totalFp = Object.values(fpPorTipo).reduce((a, b) => a + b, 0);
      const pctFp = (v) => (totalFp ? Math.round((v / totalFp) * 100) : 25);
      setFormasPagamento([
        { tipo: "Crédito", valor: fpPorTipo.Crédito, percentual: pctFp(fpPorTipo.Crédito), cor: "#14B8A6" },
        { tipo: "Débito", valor: fpPorTipo.Débito, percentual: pctFp(fpPorTipo.Débito), cor: "#8B5CF6" },
        { tipo: "Pix", valor: fpPorTipo.Pix, percentual: pctFp(fpPorTipo.Pix), cor: "#3B82F6" },
        { tipo: "Dinheiro", valor: fpPorTipo.Dinheiro, percentual: pctFp(fpPorTipo.Dinheiro), cor: "#EAB308" },
      ]);

      const vendasDia = res.vendasPorDiaSemana ?? res.VendasPorDiaSemana ?? res.vendasPorDia ?? [];
      if (Array.isArray(vendasDia) && vendasDia.length >= 7) {
        setVendasPorDiaSemana(vendasDia.slice(0, 7).map((v) => Number(v.quantidade ?? v.valor ?? v) || 0));
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      try {
        const vendasRes = await vendasService.getAll({ pagina: 1, tamanho: 500 });
        const vendasList = Array.isArray(vendasRes) ? vendasRes : vendasRes?.vendas ?? vendasRes?.Vendas ?? vendasRes?.items ?? [];
        const inicio = new Date(anoMes.ano, anoMes.mes, 1).toISOString().split("T")[0];
        const fim = new Date(anoMes.ano, anoMes.mes + 1, 0).toISOString().split("T")[0];

        const vendasFiltradas = vendasList.filter((v) => {
          if ((v.status ?? v.Status ?? "").toString().toLowerCase() === "cancelada") return false;
          const d = (v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? "").toString().split("T")[0];
          return d >= inicio && d <= fim;
        });

        let lucro = 0;
        let valorBruto = 0;
        for (const v of vendasFiltradas) {
          valorBruto += Number(v.valorTotal ?? v.ValorTotal) || 0;
          const itens = v.itens ?? v.Itens ?? v.items ?? [];
          for (const i of itens) {
            const qty = Number(i.quantidade) || 0;
            const pv = Number(i.precoUnitario ?? i.produto?.precoVenda ?? 0) || 0;
            const pc = Number(i.produto?.precoCusto ?? i.precoCusto ?? 0) || 0;
            lucro += (pv - pc) * qty;
          }
          if (itens.length === 0) lucro += Number(v.valorTotal ?? v.ValorTotal) || 0;
        }
        const ticket = vendasFiltradas.length > 0 ? valorBruto / vendasFiltradas.length : 0;
        setStats({
          faturamentoMes: Math.round(lucro * 100) / 100,
          vendasMes: vendasFiltradas.length,
          novosClientes: 0,
          ticketMedio: Math.round(ticket * 100) / 100,
          valorBrutoVendas: Math.round(valorBruto * 100) / 100,
        });
        const diasSemana = [0, 0, 0, 0, 0, 0, 0];
        vendasFiltradas.forEach((v) => {
          const d = new Date((v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? "").toString());
          const dia = d.getDay();
          if (!isNaN(dia) && dia >= 0 && dia < 7) diasSemana[dia]++;
        });
        setVendasPorDiaSemana(diasSemana);
      } catch (fallbackErr) {
        console.error("Fallback vendas também falhou:", fallbackErr);
        setStats({
          faturamentoMes: 0,
          vendasMes: 0,
          novosClientes: 0,
          ticketMedio: 0,
          valorBrutoVendas: 0,
        });
      }
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
      setVendasPorDiaSemana([0, 0, 0, 0, 0, 0, 0]);
    } finally {
      setCarregando(false);
    }
  }, [anoMes.ano, anoMes.mes]);

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

  const gerarTrendData = (valor) => {
    const base = valor * 0.3;
    return Array.from({ length: 12 }, (_, i) =>
      Math.max(0, base + Math.sin(i * 0.8) * (valor * 0.15) + (i / 12) * valor * 0.5)
    );
  };

  const statCards = [
    {
      title: "Faturamento (Lucro)",
      value: formatFaturamento(stats.faturamentoMes),
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      trendData: gerarTrendData(stats.faturamentoMes || 1),
      trendColor: "#3B82F6",
    },
    {
      title: "Total de Vendas",
      value: String(stats.vendasMes),
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      trendData: gerarTrendData(stats.vendasMes || 1),
      trendColor: "#3B82F6",
    },
    {
      title: "Novos Clientes",
      value: String(stats.novosClientes),
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      trendData: gerarTrendData(stats.novosClientes || 1),
      trendColor: "#3B82F6",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${stats.ticketMedio.toFixed(2)}`,
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      trendData: gerarTrendData(stats.ticketMedio || 1),
      trendColor: "#3B82F6",
    },
  ];

  const stackedSeriesData = (() => {
    const cats = vendasPorCategoria.filter((c) => (c.percentual ?? 0) > 0);
    const vals = faturamentoMensal.valores;
    if (cats.length === 0) {
      return [{ id: "faturamento", label: "Faturamento", color: "#3B82F6", data: vals }];
    }
    const totalPct = cats.reduce((a, c) => a + (c.percentual ?? 0), 0) || 100;
    return cats.map((c, i) => ({
      id: c.categoria,
      label: c.categoria,
      color: c.cor || ["#3B82F6", "#F59E0B", "#EF4444", "#10B981"][i],
      data: vals.map((v) => ((c.percentual ?? 0) / totalPct) * v),
    }));
  })();

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100vw",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: { xs: 1.5, sm: 1.5, md: 2 },
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 22, sm: 26, md: 30 }, letterSpacing: "-0.02em" }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 14, mt: 0.5 }}>
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
        spacing={{ xs: 1.5, sm: 2, md: 2 }}
        alignItems="stretch"
        sx={{ mb: 1 }}
      >
        {/* Stats Cards - 4 colunas em desktop, 2 em mobile */}
        {statCards.map((stat, index) => (
          <Grid item xs={6} sm={6} md={3} lg={2.4} key={index}>
            <Box sx={{ height: "100%", p: { xs: 2.5, md: 3 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 17, fontWeight: 500, display: "block" }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 28, sm: 34, md: 36 }, mt: 0.5, letterSpacing: "-0.02em" }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 15, mt: 0.5, display: "block" }}>
                      {stat.subtitle}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 112, height: 59, flexShrink: 0 }}>
                    <LineChart
                      xAxis={[{ data: stat.trendData.map((_, i) => i), hide: true }]}
                      yAxis={[{ hide: true }]}
                      series={[{ data: stat.trendData, color: stat.trendColor, showMark: false, curve: "catmullRom", area: true }]}
                      height={59}
                      margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                      sx={{ "& .MuiAreaElement-root": { opacity: 0.4 }, "& .MuiLineElement-root": { strokeWidth: 2 } }}
                    />
                  </Box>
                </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Conteúdo principal - Grid Responsivo */}
      <Grid container spacing={{ xs: 1, sm: 1, md: 1.5 }} alignItems="stretch">
        {/* Linha 1: Faturamento | Vendas por dia (lado a lado, mesmo tamanho) */}
        <Grid item xs={12} sm={6} sx={{ order: 1 }}>
          <Box sx={{ p: { xs: 2.5, md: 3 } }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: 25 }}>
                  Faturamento por categoria
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <Select
                      value={anoMes.ano}
                      onChange={(e) => setAnoMes((p) => ({ ...p, ano: Number(e.target.value) }))}
                      sx={{ fontSize: 13, height: 36, bgcolor: "action.hover" }}
                    >
                      {[anoMes.ano, anoMes.ano - 1, anoMes.ano - 2].map((a) => (
                        <MenuItem key={a} value={a}>{a}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    {stackedSeriesData.map((s) => (
                      <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: s.color }} />
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 12 }}>{s.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ width: "100%", height: { xs: 360, sm: 420, md: 480 } }}>
                <LineChart
                  xAxis={[{
                    scaleType: "point",
                    data: faturamentoMensal.meses,
                    tickLabelStyle: { fontSize: isMobile ? 10 : 12, fill: theme.palette.text.secondary },
                  }]}
                  yAxis={[{
                    min: 0,
                    max: faturamentoMensal.maxY ? faturamentoMensal.maxY + 20 : 350,
                    tickLabelStyle: { fontSize: isMobile ? 10 : 11, fill: theme.palette.text.secondary },
                    valueFormatter: (v) => `${v}K`,
                  }]}
                  series={stackedSeriesData.map((s) => ({
                    data: s.data,
                    color: s.color,
                    label: s.label,
                    area: true,
                    stack: "total",
                    curve: "catmullRom",
                    showMark: !isMobile,
                  }))}
                  height={isMobile ? 360 : isTablet ? 420 : 480}
                  margin={{ left: 55, right: 25, top: 20, bottom: 40 }}
                  grid={{ horizontal: true }}
                  slotProps={{ legend: { hidden: true } }}
                  sx={{
                    "& .MuiChartsAxis-line": { stroke: theme.palette.divider },
                    "& .MuiChartsAxis-tick": { stroke: theme.palette.divider },
                    "& .MuiChartsGrid-line": { stroke: theme.palette.action.disabledBackground },
                    "& .MuiLineElement-root": { strokeWidth: 2 },
                    "& .MuiAreaElement-root": { opacity: 0.85 },
                    "& .MuiMarkElement-root": { scale: "0.5", fill: theme.palette.background.paper, strokeWidth: 2 },
                  }}
                />
              </Box>
          </Box>
        </Grid>

        {/* Vendas por dia da semana - ao lado do Faturamento, mesmo tamanho */}
        <Grid item xs={12} sm={6} sx={{ order: 2 }}>
          <Box sx={{ height: "100%", p: { xs: 2.5, md: 3 }, minHeight: { xs: 360, sm: 420, md: 480 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: 25, mb: 2 }}>
                Vendas por dia da semana
              </Typography>
              <Box sx={{ width: "100%", height: { xs: 360, sm: 420, md: 480 } }}>
                <BarChart
                  xAxis={[{ scaleType: "band", data: DIAS_SEMANA, tickLabelStyle: { fontSize: isMobile ? 10 : 12, fill: theme.palette.text.secondary } }]}
                  yAxis={[{ tickLabelStyle: { fontSize: isMobile ? 10 : 11, fill: theme.palette.text.secondary } }]}
                  series={[{ data: vendasPorDiaSemana, color: "#3B82F6", label: "Vendas" }]}
                  height={isMobile ? 360 : isTablet ? 420 : 480}
                  margin={{ left: 50, right: 25, top: 20, bottom: 40 }}
                  sx={{ "& .MuiChartsAxis-line": { stroke: theme.palette.divider }, "& .MuiChartsAxis-tick": { stroke: theme.palette.divider } }}
                />
              </Box>
          </Box>
        </Grid>

        {/* Linha 3 - Vendas por Categoria */}
        <Grid item xs={12} sm={6} md={4} lg={4} sx={{ order: 5 }}>
          <Box sx={{ height: "100%", p: { xs: 2.5, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: 21, mb: 2 }}>
                Vendas por Categoria
              </Typography>

              <Box
                sx={{ width: "100%", height: { xs: 196, sm: 238, md: 266 } }}
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
                      data: vendasPorCategoria.map((item) => item.quantidade ?? item.valor ?? 0),
                      color: "#14B8A6",
                    },
                  ]}
                  height={isMobile ? 220 : isTablet ? 260 : 300}
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
                      {item.quantidade != null
                        ? `${item.quantidade} un. (${item.percentual}%)`
                        : `R$ ${(item.valor ?? 0) >= 1000 ? `${((item.valor ?? 0) / 1000).toFixed(0)}K` : (item.valor ?? 0).toFixed(0)} (${item.percentual}%)`}
                    </Typography>
                  </Box>
                ))}
              </Box>
          </Box>
        </Grid>

        {/* Produtos Mais Vendidos - ao lado de Formas de Pagamento */}
        <Grid item xs={12} sm={6} md={4} lg={4} sx={{ order: 3 }}>
          <Box sx={{ height: "100%", p: { xs: 2.5, md: 3 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: 21 }}>
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
                    width: { xs: 196, sm: 224, md: 252 },
                    height: { xs: 196, sm: 224, md: 252 },
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
                        innerRadius: isMobile ? 63 : isTablet ? 70 : 77,
                        outerRadius: isMobile ? 91 : isTablet ? 105 : 119,
                      },
                    ]}
                    height={isMobile ? 196 : isTablet ? 224 : 252}
                    width={isMobile ? 196 : isTablet ? 224 : 252}
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
          </Box>
        </Grid>

        {/* Metas do Mês - junto com Estoque Crítico e Top Vendedores */}
        <Grid item xs={12} sm={6} md={4} lg={4} sx={{ order: 6 }}>
          <Box
            onClick={handleAbrirMetasDialog}
            sx={{
              height: "100%",
              p: { xs: 2, md: 2.8 },
              cursor: "pointer",
              borderRadius: 2,
              transition: "all 0.2s",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: { xs: 1.5, md: 2 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: { xs: 18, sm: 20, md: 21 } }}>
                Metas do Mês
              </Typography>
              <CheckCircle sx={{ fontSize: { xs: 22, md: 25 }, color: "#10B981" }} />
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>
              {metasDoMes.map((item, index) => (
                <Box key={index}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: { xs: 15, md: 17 }, fontWeight: 600 }}>
                      {item.meta}
                    </Typography>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: { xs: 13, md: 14 } }}>
                      {item.meta === "Faturamento" ? formatFaturamento(item.atual) : String(item.atual)}
                    </Typography>
                  </Box>
                  <Box sx={{ position: "relative" }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, item.percentual)}
                      sx={{
                        height: { xs: 14, md: 17 },
                        borderRadius: 1.5,
                        bgcolor: theme.palette.action.disabledBackground,
                        "& .MuiLinearProgress-bar": {
                          bgcolor: item.percentual >= 90 ? theme.palette.success.main : item.percentual >= 70 ? "#14B8A6" : theme.palette.warning.main,
                          borderRadius: 1.5,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#FFFFFF", fontWeight: 700, fontSize: { xs: 11, md: 13 } }}>
                      {item.percentual}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Estoque Crítico - junto com Metas e Top Vendedores */}
        <Grid item xs={12} sm={6} md={4} lg={4} sx={{ order: 7 }}>
          <Box sx={{ height: "100%", p: { xs: 2.5, md: 3 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: 21 }}>
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
                  gap: { xs: 1.5, md: 2 },
                }}
              >
                {estoqueCritico.map((item, index) => (
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
                        mb: 1,
                        mt: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontSize: { xs: 11, md: 12 },
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
          </Box>
        </Grid>

        {/* Formas de Pagamento - ao lado de Produtos Mais Vendidos */}
        <Grid item xs={12} sm={6} md={4} lg={4} sx={{ order: 4 }}>
          <Box sx={{ height: "100%", p: { xs: 2.5, md: 3 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: 21 }}>
                  Formas de Pagamento
                </Typography>
                <CreditCard sx={{ fontSize: { xs: 22, md: 25 }, color: "text.secondary" }} />
              </Box>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2, justifyContent: "center" }}>
                <Box
                  sx={{
                    width: { xs: 182, sm: 210, md: 224 },
                    height: { xs: 182, sm: 210, md: 224 },
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
                        innerRadius: isMobile ? 56 : isTablet ? 63 : 70,
                        outerRadius: isMobile ? 84 : isTablet ? 98 : 105,
                      },
                    ]}
                    height={isMobile ? 182 : isTablet ? 210 : 224}
                    width={isMobile ? 182 : isTablet ? 210 : 224}
                    slotProps={{
                      legend: { hidden: true },
                    }}
                    sx={{
                      "& .MuiChartsLegend-root": { display: "none" },
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, md: 2 } }}>
                {formasPagamento.map((item, index) => (
                  <Box key={index} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box
                        sx={{
                          width: { xs: 8, md: 10 },
                          height: { xs: 8, md: 10 },
                          borderRadius: "50%",
                          bgcolor: item.cor,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: "text.secondary", fontSize: { xs: 12, md: 13 }, fontWeight: 500 }}>
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
          </Box>
        </Grid>

        {/* Top Vendedores - junto com Metas e Estoque Crítico */}
        <Grid item xs={12} sm={6} md={4} lg={4} sx={{ order: 8 }}>
          <Box sx={{ height: "100%", p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: 23 }}>
                  Top Vendedores
                </Typography>
                <Typography variant="body2" sx={{ color: "#14B8A6", fontSize: { xs: 16, md: 18 }, fontWeight: 600 }}>
                  Este mês
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, md: 3 } }}>
                {topVendedores.map((item, index) => (
                  <Box key={index}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5, gap: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ color: "text.primary", fontSize: { xs: 14, md: 15 }, fontWeight: 600, display: "block", mb: 0.5 }}>
                          {item.nome}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: { xs: 13, md: 14 }, display: "block" }}>
                          Meta: {item.meta}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: "text.primary", fontSize: { xs: 14, md: 16 }, fontWeight: 700 }}>
                        {item.vendas}
                      </Typography>
                    </Box>

                    <Box sx={{ position: "relative", mt: 0.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={item.percentual}
                        sx={{
                          height: { xs: 12, md: 14 },
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
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: { xs: 10, md: 11 },
                        }}
                      >
                        {item.percentual}%
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
          </Box>
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
