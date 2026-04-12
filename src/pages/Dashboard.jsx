// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Grid,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import {
  Refresh,
  CalendarMonth,
  CreditCard,
  CheckCircle,
} from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { dashboardService } from "../api/dashboardService";
import { vendasService } from "../api/vendasService";
import { vexaColors } from "../theme";

const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

/** Gráficos no claro (mantém o visual que você curtiu) */
const CORES_CATEGORIAS_LIGHT = {
  Roupas: "#14B8A6",
  Calçados: "#8B5CF6",
  Acessórios: "#EAB308",
  Outros: "#6B7280",
};
const CORES_PRODUTOS_LIGHT = ["#14B8A6", "#8B5CF6", "#F8F32B", "#EAB308"];
const FORMAS_PAGAMENTO_LIGHT = ["#14B8A6", "#8B5CF6", "#F8F32B", "#EAB308"];

/** Gráficos no escuro — paleta VEXA (sem teal) */
const CORES_CATEGORIAS_DARK = {
  Roupas: vexaColors.amareloNeon,
  Calçados: vexaColors.cinzaAzulado,
  Acessórios: "#A8B2C3",
  Outros: "#6F7A8C",
};
const CORES_PRODUTOS_DARK = [
  vexaColors.amareloNeon,
  vexaColors.cinzaAzulado,
  "#A8B2C3",
  "#6F7A8C",
];
const FORMAS_PAGAMENTO_DARK = [
  vexaColors.amareloNeon,
  vexaColors.cinzaAzulado,
  "#FAF45A",
  "#6F7A8C",
];
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

  const [vendasPorCategoria, setVendasPorCategoria] = useState([
    { categoria: "Roupas", valor: 0, percentual: 0, cor: CORES_CATEGORIAS_LIGHT.Roupas },
    { categoria: "Calçados", valor: 0, percentual: 0, cor: CORES_CATEGORIAS_LIGHT.Calçados },
    { categoria: "Acessórios", valor: 0, percentual: 0, cor: CORES_CATEGORIAS_LIGHT.Acessórios },
  ]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([
    { tipo: "Crédito", percentual: 0, valor: 0, cor: FORMAS_PAGAMENTO_LIGHT[0] },
    { tipo: "Débito", percentual: 0, valor: 0, cor: FORMAS_PAGAMENTO_LIGHT[1] },
    { tipo: "Pix", percentual: 0, valor: 0, cor: FORMAS_PAGAMENTO_LIGHT[2] },
    { tipo: "Dinheiro", percentual: 0, valor: 0, cor: FORMAS_PAGAMENTO_LIGHT[3] },
  ]);

  const chartCardSx = {
    height: "100%",
    borderRadius: 2,
    border: 1,
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: (t) =>
      t.palette.mode === "dark" ? "0 0 0 1px rgba(141, 153, 174, 0.14)" : "none",
  };

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
    const isDarkNow = theme.palette.mode === "dark";
    const CORES_CATEGORIAS = isDarkNow ? CORES_CATEGORIAS_DARK : CORES_CATEGORIAS_LIGHT;
    const CORES_PRODUTOS = isDarkNow ? CORES_PRODUTOS_DARK : CORES_PRODUTOS_LIGHT;
    const FORMAS_COL = isDarkNow ? FORMAS_PAGAMENTO_DARK : FORMAS_PAGAMENTO_LIGHT;
    const fallbackCat = isDarkNow ? "#6F7A8C" : "#6B7280";
    const fallbackProd = isDarkNow ? vexaColors.amareloNeon : "#14B8A6";
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
          cor: CORES_CATEGORIAS[nome] ?? fallbackCat,
        };
      });
      if (catFormat.length === 0) {
        setVendasPorCategoria([
          { categoria: "Roupas", valor: 0, percentual: 0, cor: CORES_CATEGORIAS.Roupas },
          { categoria: "Calçados", valor: 0, percentual: 0, cor: CORES_CATEGORIAS.Calçados },
          { categoria: "Acessórios", valor: 0, percentual: 0, cor: CORES_CATEGORIAS.Acessórios },
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
        cor: CORES_PRODUTOS[i] ?? fallbackProd,
      }));
      setProdutosMaisVendidos(prodsFormat);

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
        { tipo: "Crédito", valor: fpPorTipo.Crédito, percentual: pctFp(fpPorTipo.Crédito), cor: FORMAS_COL[0] },
        { tipo: "Débito", valor: fpPorTipo.Débito, percentual: pctFp(fpPorTipo.Débito), cor: FORMAS_COL[1] },
        { tipo: "Pix", valor: fpPorTipo.Pix, percentual: pctFp(fpPorTipo.Pix), cor: FORMAS_COL[2] },
        { tipo: "Dinheiro", valor: fpPorTipo.Dinheiro, percentual: pctFp(fpPorTipo.Dinheiro), cor: FORMAS_COL[3] },
      ]);

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
      setVendasPorCategoria([
        { categoria: "Roupas", valor: 0, percentual: 0, cor: CORES_CATEGORIAS.Roupas },
        { categoria: "Calçados", valor: 0, percentual: 0, cor: CORES_CATEGORIAS.Calçados },
        { categoria: "Acessórios", valor: 0, percentual: 0, cor: CORES_CATEGORIAS.Acessórios },
      ]);
      setProdutosMaisVendidos([]);
      setFormasPagamento([
        { tipo: "Crédito", percentual: 0, valor: 0, cor: FORMAS_COL[0] },
        { tipo: "Débito", percentual: 0, valor: 0, cor: FORMAS_COL[1] },
        { tipo: "Pix", percentual: 0, valor: 0, cor: FORMAS_COL[2] },
        { tipo: "Dinheiro", percentual: 0, valor: 0, cor: FORMAS_COL[3] },
      ]);
    } finally {
      setCarregando(false);
    }
  }, [anoMes.ano, anoMes.mes, theme.palette.mode]);

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
      trendColor: "#F8F32B",
    },
    {
      title: "Total de Vendas",
      value: String(stats.vendasMes),
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      trendData: gerarTrendData(stats.vendasMes || 1),
      trendColor: "#F8F32B",
    },
    {
      title: "Novos Clientes",
      value: String(stats.novosClientes),
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      trendData: gerarTrendData(stats.novosClientes || 1),
      trendColor: "#F8F32B",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${stats.ticketMedio.toFixed(2)}`,
      subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`,
      trendData: gerarTrendData(stats.ticketMedio || 1),
      trendColor: "#F8F32B",
    },
  ];

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
            <Card variant="outlined" sx={chartCardSx} elevation={0}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
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
                      sx={{
                        "& .MuiAreaElement-root": {
                          opacity: theme.palette.mode === "dark" ? 0.22 : 0.4,
                        },
                        "& .MuiLineElement-root": { strokeWidth: 2 },
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráficos em cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 2 }} alignItems="stretch" sx={{ mt: 0.5 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={chartCardSx} elevation={0}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 18, md: 21 }, mb: 2 }}>
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
                      color:
                        theme.palette.mode === "dark"
                          ? vexaColors.amareloNeon
                          : "#14B8A6",
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={chartCardSx} elevation={0}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 17, md: 21 } }}>
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={chartCardSx} elevation={0}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 17, md: 21 } }}>
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
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            variant="outlined"
            onClick={handleAbrirMetasDialog}
            sx={{
              ...chartCardSx,
              cursor: "pointer",
              transition: "box-shadow 0.2s, background 0.2s",
              "&:hover": { bgcolor: "action.hover" },
            }}
            elevation={0}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
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
                            bgcolor:
                              item.percentual >= 90
                                ? theme.palette.success.main
                                : item.percentual >= 70
                                  ? theme.palette.mode === "dark"
                                    ? vexaColors.cinzaAzulado
                                    : "#14B8A6"
                                  : theme.palette.warning.main,
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
