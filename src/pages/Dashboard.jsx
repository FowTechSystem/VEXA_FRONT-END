// src/pages/Dashboard.jsx
// Redesenhado com Recharts — visual moderno VEXA
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
import { Refresh, CalendarMonth, CreditCard, CheckCircle } from "@mui/icons-material";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { dashboardService } from "../api/dashboardService";
import { vendasService } from "../api/vendasService";
import { vexaColors } from "../theme";

const MESES_LABEL = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const STORAGE_METAS = "vexa_dashboard_metas";

// ─── Paleta VEXA ────────────────────────────────────────────────────────────
const NEON   = "#F8F32B";
const TEAL   = "#14B8A6";
const PURPLE = "#8B5CF6";
const SLATE  = "#64748B";
const MINT   = "#10B981";

const PALETTE_LIGHT = [TEAL, PURPLE, NEON, "#F59E0B"];
const PALETTE_DARK  = [NEON, "#8D99AE", "#A8B2C3", "#6F7A8C"];

const CAT_COLORS_LIGHT = { Roupas: TEAL, Calçados: PURPLE, Acessórios: "#F59E0B", Outros: SLATE };
const CAT_COLORS_DARK  = { Roupas: NEON, Calçados: "#8D99AE", Acessórios: "#A8B2C3", Outros: "#6F7A8C" };

// ─── Tooltip customizado ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, isDark, formatter }) => {
  if (!active || !payload?.length) return null;
  const bg    = isDark ? "#1E2330" : "#FFFFFF";
  const border= isDark ? "#2D3548" : "#E2E8F0";
  const text  = isDark ? "#F1F5F9" : "#0F172A";
  const muted = isDark ? "#8D99AE" : "#64748B";
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      minWidth: 120,
    }}>
      {label && (
        <p style={{ color: muted, fontSize: 11, marginBottom: 6, fontWeight: 500 }}>
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || text, fontSize: 13, fontWeight: 600, margin: "2px 0" }}>
          {formatter ? formatter(entry.value, entry.name) : `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
};

// ─── Sparkline mini (nos stat cards) ────────────────────────────────────────
const Sparkline = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={52}>
    <AreaChart data={data.map((v, i) => ({ v, i }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={2}
        fill={`url(#sg-${color.replace("#","")})`}
        dot={false}
        isAnimationActive={true}
      />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── Rótulo central no Pie ───────────────────────────────────────────────────
const PieCenterLabel = ({ cx, cy, total, label, isDark }) => (
  <>
    <text
      x={cx} y={cy - 8}
      textAnchor="middle"
      fill={isDark ? "#F1F5F9" : "#0F172A"}
      fontSize={22}
      fontWeight={700}
    >
      {total}
    </text>
    <text
      x={cx} y={cy + 12}
      textAnchor="middle"
      fill={isDark ? "#8D99AE" : "#64748B"}
      fontSize={11}
      fontWeight={500}
    >
      {label}
    </text>
  </>
);

function Dashboard() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const hoje = new Date();
  const [anoMes, setAnoMes]   = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const [carregando, setCarregando] = useState(true);
  const [stats, setStats]     = useState({
    faturamentoMes: 0, vendasMes: 0, novosClientes: 0, ticketMedio: 0, valorBrutoVendas: 0,
  });

  const [metas, setMetas] = useState({ faturamento: 320000, vendas: 1500, novosClientes: 150 });
  const [openMetasDialog, setOpenMetasDialog] = useState(false);
  const [metasEdit, setMetasEdit] = useState({ faturamento: "", vendas: "", novosClientes: "" });

  const [vendasPorCategoria, setVendasPorCategoria] = useState([
    { categoria: "Roupas",    valor: 0, quantidade: 0, percentual: 0 },
    { categoria: "Calçados",  valor: 0, quantidade: 0, percentual: 0 },
    { categoria: "Acessórios",valor: 0, quantidade: 0, percentual: 0 },
  ]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([
    { tipo: "Crédito", percentual: 25, valor: 0 },
    { tipo: "Débito",  percentual: 25, valor: 0 },
    { tipo: "Pix",     percentual: 25, valor: 0 },
    { tipo: "Dinheiro",percentual: 25, valor: 0 },
  ]);

  // cores dinâmicas
  const CAT_COLORS = isDark ? CAT_COLORS_DARK : CAT_COLORS_LIGHT;
  const PALETTE    = isDark ? PALETTE_DARK    : PALETTE_LIGHT;

  const axisColor  = isDark ? "#4A5568" : "#E2E8F0";
  const tickColor  = isDark ? "#8D99AE" : "#94A3B8";
  const gridColor  = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  const cardSx = {
    height: "100%",
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: isDark ? "0 0 0 1px rgba(141,153,174,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
  };

  // ── Carregar metas salvas ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_METAS);
      if (stored) {
        const p = JSON.parse(stored);
        setMetas({ faturamento: p.faturamento ?? 320000, vendas: p.vendas ?? 1500, novosClientes: p.novosClientes ?? 150 });
      }
    } catch (_) {}
  }, []);

  // ── Fetch principal ──────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setCarregando(true);
    try {
      const mesApi = anoMes.mes + 1;
      const res    = await dashboardService.getResumo(anoMes.ano, mesApi);

      let fatLucro = Number(res.faturamentoMesLucro ?? res.FaturamentoMesLucro) || 0;
      let totalV   = Number(res.totalVendas        ?? res.TotalVendas)          || 0;
      const novosC = Number(res.novosClientes       ?? res.NovosClientes)        || 0;
      let fatBruto = Number(res.faturamentoMesBruto ?? res.FaturamentoMesBruto) || 0;
      let ticket   = Number(res.ticketMedio         ?? res.TicketMedio)          || 0;

      if (fatLucro === 0 || totalV === 0) {
        try {
          const vendasRes  = await vendasService.getAll({ pagina: 1, tamanho: 500 });
          const vendasList = Array.isArray(vendasRes) ? vendasRes : vendasRes?.vendas ?? vendasRes?.Vendas ?? vendasRes?.items ?? vendasRes?.data ?? [];
          const inicio = new Date(anoMes.ano, anoMes.mes, 1).toISOString().split("T")[0];
          const fim    = new Date(anoMes.ano, anoMes.mes + 1, 0).toISOString().split("T")[0];
          const vf = vendasList.filter((v) => {
            if ((v.status ?? v.Status ?? "").toString().toLowerCase() === "cancelada") return false;
            const d = (v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? v.dataCriacao ?? "").toString().split("T")[0];
            return d && d >= inicio && d <= fim;
          });
          let lucroCalc = 0, valorBrutoCalc = 0;
          for (const v of vf) {
            valorBrutoCalc += Number(v.valorTotal ?? v.ValorTotal ?? v.valor ?? 0) || 0;
            const itens = v.itens ?? v.Itens ?? v.items ?? [];
            for (const i of itens) {
              const qty = Number(i.quantidade ?? i.Quantidade) || 0;
              const pv  = Number(i.precoUnitario ?? i.produto?.precoVenda ?? i.precoVenda ?? 0) || 0;
              const pc  = Number(i.produto?.precoCusto ?? i.precoCusto ?? 0) || 0;
              lucroCalc += (pv - pc) * qty;
            }
            if (itens.length === 0) lucroCalc += Number(v.valorTotal ?? v.ValorTotal ?? v.valor ?? 0) || 0;
          }
          if (vf.length > 0) {
            if (fatLucro === 0) fatLucro = Math.round(lucroCalc * 100) / 100;
            if (totalV   === 0) totalV   = vf.length;
            if (fatBruto === 0) fatBruto = Math.round(valorBrutoCalc * 100) / 100;
            ticket = totalV > 0 ? Math.round((fatBruto / totalV) * 100) / 100 : 0;
          }
        } catch (_) {}
      }

      setStats({ faturamentoMes: fatLucro, vendasMes: totalV, novosClientes: novosC, ticketMedio: ticket, valorBrutoVendas: fatBruto });

      // categorias
      const vendasCat = res.vendasPorCategoria ?? res.VendasPorCategoria ?? [];
      const catList   = Array.isArray(vendasCat) ? vendasCat : [];
      const totalQtd  = catList.reduce((a, x) => a + (Number(x.quantidadeVendida ?? x.QuantidadeVendida) || 0), 0);
      const totalVal  = catList.reduce((a, x) => a + (Number(x.valorVendido ?? x.ValorVendido) || 0), 0);
      const catFormat = catList.map((c) => {
        const nome  = c.categoriaNome ?? c.CategoriaNome ?? "Outros";
        const valor = Number(c.valorVendido      ?? c.ValorVendido)      || 0;
        const qtd   = Number(c.quantidadeVendida ?? c.QuantidadeVendida) || 0;
        const pct   = totalQtd ? Math.round((qtd / totalQtd) * 100) : (totalVal ? Math.round((valor / totalVal) * 100) : 0);
        return { categoria: nome, valor, quantidade: qtd, percentual: pct };
      });
      setVendasPorCategoria(catFormat.length > 0 ? catFormat : [
        { categoria: "Roupas",    valor: 0, quantidade: 0, percentual: 0 },
        { categoria: "Calçados",  valor: 0, quantidade: 0, percentual: 0 },
        { categoria: "Acessórios",valor: 0, quantidade: 0, percentual: 0 },
      ]);

      // produtos
      const prodsTop  = res.produtosMaisVendidos ?? res.ProdutosMaisVendidos ?? [];
      const prodsList = Array.isArray(prodsTop) ? prodsTop : [];
      const totQty    = prodsList.reduce((a, p) => a + (Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0), 0);
      setProdutosMaisVendidos(prodsList.slice(0, 4).map((p, i) => ({
        label:      p.produtoNome ?? p.ProdutoNome ?? "Produto",
        quantidade: Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0,
        valor:      Number(p.valorVendido      ?? p.ValorVendido)      || 0,
        percentual: totQty ? Math.round(((Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0) / totQty) * 100) : 0,
        colorIndex: i,
      })));

      // formas de pagamento
      const fpList   = Array.isArray(res.formasPagamento ?? res.FormasPagamento) ? (res.formasPagamento ?? res.FormasPagamento) : [];
      const fpPorTipo = { Crédito: 0, Débito: 0, Pix: 0, Dinheiro: 0 };
      fpList.forEach((f) => {
        const t   = (f.formaPagamento ?? f.FormaPagamento ?? "").toString().toLowerCase();
        const val = Number(f.valor ?? f.Valor) || 0;
        if (t.includes("cred"))  fpPorTipo.Crédito  += val;
        else if (t.includes("deb"))   fpPorTipo.Débito   += val;
        else if (t.includes("pix"))   fpPorTipo.Pix      += val;
        else if (t.includes("dinhe")) fpPorTipo.Dinheiro += val;
        else fpPorTipo.Crédito += val;
      });
      const totalFp = Object.values(fpPorTipo).reduce((a, b) => a + b, 0);
      const pctFp   = (v) => (totalFp ? Math.round((v / totalFp) * 100) : 25);
      setFormasPagamento([
        { tipo: "Crédito",  valor: fpPorTipo.Crédito,  percentual: pctFp(fpPorTipo.Crédito)  },
        { tipo: "Débito",   valor: fpPorTipo.Débito,   percentual: pctFp(fpPorTipo.Débito)   },
        { tipo: "Pix",      valor: fpPorTipo.Pix,      percentual: pctFp(fpPorTipo.Pix)      },
        { tipo: "Dinheiro", valor: fpPorTipo.Dinheiro, percentual: pctFp(fpPorTipo.Dinheiro) },
      ]);

    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      // fallback simples
      try {
        const vendasRes  = await vendasService.getAll({ pagina: 1, tamanho: 500 });
        const vendasList = Array.isArray(vendasRes) ? vendasRes : vendasRes?.vendas ?? vendasRes?.Vendas ?? vendasRes?.items ?? [];
        const inicio = new Date(anoMes.ano, anoMes.mes, 1).toISOString().split("T")[0];
        const fim    = new Date(anoMes.ano, anoMes.mes + 1, 0).toISOString().split("T")[0];
        const vf = vendasList.filter((v) => {
          if ((v.status ?? v.Status ?? "").toString().toLowerCase() === "cancelada") return false;
          const d = (v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? "").toString().split("T")[0];
          return d && d >= inicio && d <= fim;
        });
        let lucro = 0, valorBruto = 0;
        for (const v of vf) {
          valorBruto += Number(v.valorTotal ?? v.ValorTotal) || 0;
          const itens = v.itens ?? v.Itens ?? v.items ?? [];
          for (const i of itens) {
            const qty = Number(i.quantidade) || 0;
            const pv  = Number(i.precoUnitario ?? i.produto?.precoVenda ?? 0) || 0;
            const pc  = Number(i.produto?.precoCusto ?? i.precoCusto ?? 0) || 0;
            lucro += (pv - pc) * qty;
          }
          if (itens.length === 0) lucro += Number(v.valorTotal ?? v.ValorTotal) || 0;
        }
        const ticket = vf.length > 0 ? valorBruto / vf.length : 0;
        setStats({ faturamentoMes: Math.round(lucro*100)/100, vendasMes: vf.length, novosClientes: 0, ticketMedio: Math.round(ticket*100)/100, valorBrutoVendas: Math.round(valorBruto*100)/100 });
      } catch (_) {
        setStats({ faturamentoMes: 0, vendasMes: 0, novosClientes: 0, ticketMedio: 0, valorBrutoVendas: 0 });
      }
    } finally {
      setCarregando(false);
    }
  }, [anoMes.ano, anoMes.mes]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmt = (v) =>
    v >= 1_000_000 ? `R$ ${(v/1_000_000).toFixed(1)}M`
    : v >= 1_000   ? `R$ ${(v/1_000).toFixed(1)}K`
    : `R$ ${v.toFixed(2)}`;

  const gerarTrend = (valor) =>
    Array.from({ length: 12 }, (_, i) =>
      Math.max(0, valor * 0.3 + Math.sin(i * 0.8) * (valor * 0.15) + (i / 12) * valor * 0.5)
    );

  const metasDoMes = [
    { meta: "Faturamento",  atual: stats.valorBrutoVendas, objetivo: metas.faturamento,   percentual: metas.faturamento   > 0 ? Math.min(100, Math.round((stats.valorBrutoVendas / metas.faturamento)   * 100)) : 0 },
    { meta: "Vendas",       atual: stats.vendasMes,        objetivo: metas.vendas,         percentual: metas.vendas         > 0 ? Math.min(100, Math.round((stats.vendasMes        / metas.vendas)         * 100)) : 0 },
    { meta: "Novos Clientes",atual: stats.novosClientes,   objetivo: metas.novosClientes,  percentual: metas.novosClientes  > 0 ? Math.min(100, Math.round((stats.novosClientes    / metas.novosClientes)  * 100)) : 0 },
  ];

  const ehMesAtual = anoMes.ano === hoje.getFullYear() && anoMes.mes === hoje.getMonth();

  const statCards = [
    { title: "Faturamento (Lucro)", value: fmt(stats.faturamentoMes), subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`, trend: gerarTrend(stats.faturamentoMes || 1) },
    { title: "Total de Vendas",     value: String(stats.vendasMes),   subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`, trend: gerarTrend(stats.vendasMes || 1) },
    { title: "Novos Clientes",      value: String(stats.novosClientes),subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`, trend: gerarTrend(stats.novosClientes || 1) },
    { title: "Ticket Médio",        value: `R$ ${stats.ticketMedio.toFixed(2)}`, subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`, trend: gerarTrend(stats.ticketMedio || 1) },
  ];

  // ── Dados para o RadialBar (formas de pagamento) ─────────────────────────
  const radialData = formasPagamento.map((f, i) => ({
    name:       f.tipo,
    value:      f.percentual,
    fill:       PALETTE[i],
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ width: "100%", maxWidth: "100vw", minHeight: "100vh", bgcolor: "background.default", p: { xs: 1.5, sm: 2, md: 2.5 }, boxSizing: "border-box", overflowX: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: 22, sm: 26, md: 30 }, letterSpacing: "-0.03em" }}>
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
            Visão geral da sua loja
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={`${anoMes.mes}-${anoMes.ano}`}
              onChange={(e) => { const [mes, ano] = e.target.value.split("-").map(Number); setAnoMes({ ano, mes }); }}
              sx={{ fontSize: 12, height: 36, borderRadius: 2 }}
            >
              {(() => {
                const opts = [];
                const fim  = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                for (let i = 0; i < 24; i++) {
                  const d = new Date(fim); d.setMonth(d.getMonth() - i);
                  const m = d.getMonth(), a = d.getFullYear();
                  opts.push(<MenuItem key={`${m}-${a}`} value={`${m}-${a}`}>{MESES_LABEL[m]} {a}</MenuItem>);
                }
                return opts;
              })()}
            </Select>
          </FormControl>

          <Box
            onClick={() => setAnoMes({ ano: hoje.getFullYear(), mes: hoje.getMonth() })}
            sx={{ display: "flex", alignItems: "center", gap: 0.8, bgcolor: ehMesAtual ? "primary.main" : "background.paper", color: ehMesAtual ? "primary.contrastText" : "text.primary", px: 2, py: 1, borderRadius: 2, border: "1px solid", borderColor: "divider", cursor: "pointer", "&:hover": { opacity: 0.85 } }}
          >
            <CalendarMonth sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>Este Mês</Typography>
          </Box>

          <IconButton onClick={() => fetchDashboardData()} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, width: 36, height: 36, "&:hover": { bgcolor: "action.hover" } }}>
            <Refresh sx={{ fontSize: 18, color: "text.secondary" }} />
          </IconButton>
        </Box>
      </Box>

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {statCards.map((card, i) => (
          <Grid item xs={6} sm={6} md={3} key={i}>
            <Card variant="outlined" sx={cardSx} elevation={0}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
                <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 600, mb: 1, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {card.title}
                </Typography>
                <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: 22, sm: 26, md: 28 }, letterSpacing: "-0.03em", lineHeight: 1.1, mb: 0.5 }}>
                  {card.value}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 1.5 }}>
                  {card.subtitle}
                </Typography>
                <Sparkline data={card.trend} color={isDark ? NEON : TEAL} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Gráficos ───────────────────────────────────────────────────── */}
      <Grid container spacing={2} alignItems="stretch">

        {/* Vendas por Categoria — BarChart com cantos arredondados */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={cardSx} elevation={0}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 16, md: 18 }, mb: 0.5 }}>
                Vendas por Categoria
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 2.5 }}>
                Quantidade vendida por categoria
              </Typography>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={vendasPorCategoria.map((c) => ({ name: c.categoria, qtd: c.quantidade || c.valor || 0, fill: CAT_COLORS[c.categoria] ?? SLATE }))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  barSize={36}
                >
                  <CartesianGrid vertical={false} stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v/1000}K` : v} />
                  <Tooltip
                    content={<CustomTooltip isDark={isDark} formatter={(v, name) => `${v} unidades`} />}
                    cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 8 }}
                  />
                  <Bar dataKey="qtd" radius={[8, 8, 0, 0]} isAnimationActive>
                    {vendasPorCategoria.map((c, i) => (
                      <Cell key={i} fill={CAT_COLORS[c.categoria] ?? PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legenda */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
                {vendasPorCategoria.map((item, i) => {
                  const cor = CAT_COLORS[item.categoria] ?? PALETTE[i % PALETTE.length];
                  return (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: 2, bgcolor: cor, flexShrink: 0 }} />
                        <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 500 }}>{item.categoria}</Typography>
                      </Box>
                      <Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>
                        {item.quantidade != null
                          ? `${item.quantidade} un. (${item.percentual}%)`
                          : `R$ ${(item.valor/1000).toFixed(0)}K (${item.percentual}%)`}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Produtos Mais Vendidos — PieChart donut moderno */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={cardSx} elevation={0}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 16, md: 18 } }}>
                  Produtos Mais Vendidos
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 500 }}>Este mês</Typography>
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 2 }}>Top 4 por unidades</Typography>

              {produtosMaisVendidos.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={produtosMaisVendidos.map((p, i) => ({ name: p.label, value: p.percentual || 1, fill: PALETTE[i % PALETTE.length] }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        isAnimationActive
                        strokeWidth={0}
                      >
                        {produtosMaisVendidos.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip isDark={isDark} formatter={(v, name) => `${name}: ${v}%`} />}
                      />
                      <PieCenterLabel
                        cx="50%"
                        cy="50%"
                        total={produtosMaisVendidos.reduce((a, p) => a + p.quantidade, 0)}
                        label="unidades"
                        isDark={isDark}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                    {produtosMaisVendidos.map((item, i) => {
                      const cor = PALETTE[i % PALETTE.length];
                      return (
                        <Box key={i}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: 2, bgcolor: cor, flexShrink: 0 }} />
                              <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 500 }}>{item.label}</Typography>
                            </Box>
                            <Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>{item.quantidade} un.</Typography>
                          </Box>
                          <Box sx={{ position: "relative" }}>
                            <Box sx={{ height: 5, borderRadius: 10, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                              <Box sx={{ height: "100%", width: `${Math.min(100, item.percentual * 2.5)}%`, bgcolor: cor, borderRadius: 10, transition: "width 0.8s ease" }} />
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "text.secondary" }}>
                  <Typography variant="body2">Nenhuma venda este mês</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Formas de Pagamento — RadialBarChart */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={cardSx} elevation={0}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 16, md: 18 } }}>
                  Formas de Pagamento
                </Typography>
                <CreditCard sx={{ fontSize: 20, color: "text.secondary" }} />
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 2 }}>Distribuição por tipo</Typography>

              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={90}
                  data={radialData}
                  startAngle={90}
                  endAngle={-270}
                  barSize={12}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={8}
                    background={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", cornerRadius: 8 }}
                    isAnimationActive
                  />
                  <Tooltip
                    content={<CustomTooltip isDark={isDark} formatter={(v, name) => `${name}: ${v}%`} />}
                  />
                </RadialBarChart>
              </ResponsiveContainer>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 0.5 }}>
                {formasPagamento.map((item, i) => (
                  <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: 2, bgcolor: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                      <Typography sx={{ color: "text.secondary", fontSize: 13, fontWeight: 500 }}>{item.tipo}</Typography>
                    </Box>
                    <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 700 }}>
                      {item.percentual}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Metas do Mês — barras horizontais custom */}
        <Grid item xs={12} md={4}>
          <Card
            variant="outlined"
            onClick={() => { setMetasEdit({ faturamento: String(metas.faturamento), vendas: String(metas.vendas), novosClientes: String(metas.novosClientes) }); setOpenMetasDialog(true); }}
            sx={{ ...cardSx, cursor: "pointer", transition: "box-shadow 0.2s", "&:hover": { boxShadow: isDark ? `0 0 0 2px ${NEON}44` : `0 0 0 2px ${TEAL}44` } }}
            elevation={0}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 16, md: 18 } }}>
                  Metas do Mês
                </Typography>
                <CheckCircle sx={{ fontSize: 20, color: MINT }} />
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 3 }}>Clique para editar as metas</Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {metasDoMes.map((item, i) => {
                  const barColor =
                    item.percentual >= 90 ? MINT
                    : item.percentual >= 60 ? (isDark ? NEON : TEAL)
                    : "#F59E0B";
                  return (
                    <Box key={i}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 1 }}>
                        <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 600 }}>{item.meta}</Typography>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                          <Typography sx={{ color: barColor, fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{item.percentual}%</Typography>
                          <Typography sx={{ color: "text.secondary", fontSize: 11 }}>
                            {item.meta === "Faturamento" ? fmt(item.atual) : item.atual}
                          </Typography>
                        </Box>
                      </Box>
                      {/* barra custom com animação */}
                      <Box sx={{ position: "relative", height: 8, borderRadius: 10, bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                        <Box sx={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${item.percentual}%`, bgcolor: barColor, borderRadius: 10, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
                        <Typography sx={{ color: "text.secondary", fontSize: 11 }}>
                          Meta: {item.meta === "Faturamento" ? fmt(item.objetivo) : item.objetivo}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* ── Dialog Metas ───────────────────────────────────────────────── */}
      <Dialog open={openMetasDialog} onClose={() => setOpenMetasDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: "background.paper" } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Configurar Metas do Mês</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
            O progresso é calculado com base no valor bruto das vendas.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Meta Faturamento (R$)"      type="number" value={metasEdit.faturamento}   onChange={(e) => setMetasEdit((p) => ({ ...p, faturamento: e.target.value }))}   fullWidth size="small" />
            <TextField label="Meta Vendas (quantidade)"   type="number" value={metasEdit.vendas}         onChange={(e) => setMetasEdit((p) => ({ ...p, vendas: e.target.value }))}         fullWidth size="small" />
            <TextField label="Meta Novos Clientes"        type="number" value={metasEdit.novosClientes}  onChange={(e) => setMetasEdit((p) => ({ ...p, novosClientes: e.target.value }))}  fullWidth size="small" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenMetasDialog(false)} sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700 }}
            onClick={() => {
              const fat  = parseInt(metasEdit.faturamento, 10)  || 0;
              const vend = parseInt(metasEdit.vendas, 10)        || 0;
              const nov  = parseInt(metasEdit.novosClientes, 10) || 0;
              const novas = { faturamento: fat, vendas: vend, novosClientes: nov };
              setMetas(novas);
              try { localStorage.setItem(STORAGE_METAS, JSON.stringify(novas)); } catch (_) {}
              setOpenMetasDialog(false);
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default Dashboard;