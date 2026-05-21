// src/pages/Dashboard.jsx
// Redesigned dashboard — ApexCharts (open-source)
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Grid,
  Typography,
  Box,
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
  Chip,
  Stack,
  alpha,
} from "@mui/material";
import {
  Refresh,
  CalendarMonth,
  CreditCard,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Inventory2,
} from "@mui/icons-material";
import Chart from "react-apexcharts";
import { dashboardService } from "../api/dashboardService";
import { vendasService } from "../api/vendasService";
import { vexaColors } from "../theme";

const MESES_LABEL = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const STORAGE_METAS = "vexa_dashboard_metas";

// ─── Paleta ─────────────────────────────────────────────────────────────────
const PALETTE_LIGHT = ["#14B8A6", "#8B5CF6", "#F59E0B", "#EF4444"];
const PALETTE_DARK  = [vexaColors.amareloNeon, "#8D99AE", "#A8B2C3", "#FAF45A"];

const CAT_COLORS_LIGHT = { Roupas: "#14B8A6", Calçados: "#8B5CF6", Acessórios: "#F59E0B", Outros: "#64748B" };
const CAT_COLORS_DARK  = { Roupas: vexaColors.amareloNeon, Calçados: "#8D99AE", Acessórios: "#A8B2C3", Outros: "#6F7A8C" };

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtBRL = (v) =>
  v >= 1_000_000 ? `R$ ${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `R$ ${(v / 1_000).toFixed(1)}K`
  : `R$ ${Number(v ?? 0).toFixed(2)}`;

const fmtNum = (v) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000   ? `${(v / 1_000).toFixed(1)}K`
  : String(Math.round(v ?? 0));

const dia = (d) => String(d.getDate()).padStart(2, "0");

// ─── Componente ─────────────────────────────────────────────────────────────
function Dashboard() {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const hoje = new Date();
  const [anoMes, setAnoMes] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const [carregando, setCarregando] = useState(true);
  const [stats, setStats] = useState({
    faturamentoMes: 0, vendasMes: 0, novosClientes: 0, ticketMedio: 0, valorBrutoVendas: 0,
    deltaFat: 0, deltaVendas: 0, deltaClientes: 0, deltaTicket: 0,
  });

  const [metas, setMetas] = useState({ faturamento: 320000, vendas: 1500, novosClientes: 150 });
  const [openMetasDialog, setOpenMetasDialog] = useState(false);
  const [metasEdit, setMetasEdit] = useState({ faturamento: "", vendas: "", novosClientes: "" });

  const [vendasPorCategoria, setVendasPorCategoria] = useState([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([
    { tipo: "Crédito", percentual: 0, valor: 0 },
    { tipo: "Débito",  percentual: 0, valor: 0 },
    { tipo: "Pix",     percentual: 0, valor: 0 },
    { tipo: "Dinheiro",percentual: 0, valor: 0 },
  ]);

  // Série diária do mês (computada do vendasService)
  const [serieDiaria, setSerieDiaria] = useState({
    dias: [],
    bruto: [],
    lucro: [],
    sparkFat: [],
    sparkVendas: [],
    sparkClientes: [],
    sparkTicket: [],
  });

  const PALETTE     = isDark ? PALETTE_DARK : PALETTE_LIGHT;
  const CAT_COLORS  = isDark ? CAT_COLORS_DARK : CAT_COLORS_LIGHT;

  // ── localStorage metas ──────────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_METAS);
      if (stored) {
        const p = JSON.parse(stored);
        setMetas({
          faturamento: p.faturamento ?? 320000,
          vendas: p.vendas ?? 1500,
          novosClientes: p.novosClientes ?? 150,
        });
      }
    } catch (_) {}
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setCarregando(true);
    try {
      const mesApi = anoMes.mes + 1;
      let res = {};
      try {
        res = await dashboardService.getResumo(anoMes.ano, mesApi);
      } catch (_) { res = {}; }

      let fatLucro = Number(res.faturamentoMesLucro ?? res.FaturamentoMesLucro) || 0;
      let totalV   = Number(res.totalVendas        ?? res.TotalVendas)          || 0;
      const novosC = Number(res.novosClientes       ?? res.NovosClientes)        || 0;
      let fatBruto = Number(res.faturamentoMesBruto ?? res.FaturamentoMesBruto) || 0;
      let ticket   = Number(res.ticketMedio         ?? res.TicketMedio)          || 0;

      // Sempre busca vendas para construir série diária + fallbacks
      let vendasList = [];
      try {
        const vendasRes = await vendasService.getAll({ pagina: 1, tamanho: 1000 });
        vendasList = Array.isArray(vendasRes)
          ? vendasRes
          : vendasRes?.vendas ?? vendasRes?.Vendas ?? vendasRes?.items ?? vendasRes?.data ?? [];
      } catch (_) { vendasList = []; }

      const inicio = new Date(anoMes.ano, anoMes.mes, 1);
      const fim    = new Date(anoMes.ano, anoMes.mes + 1, 0);
      const iniStr = inicio.toISOString().split("T")[0];
      const fimStr = fim.toISOString().split("T")[0];

      const vf = vendasList.filter((v) => {
        if ((v.status ?? v.Status ?? "").toString().toLowerCase() === "cancelada") return false;
        const d = (v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? v.dataCriacao ?? "").toString().split("T")[0];
        return d && d >= iniStr && d <= fimStr;
      });

      // Série diária
      const totalDias = fim.getDate();
      const brutoPorDia = new Array(totalDias).fill(0);
      const lucroPorDia = new Array(totalDias).fill(0);

      let lucroCalc = 0, valorBrutoCalc = 0;
      for (const v of vf) {
        const dataStr = (v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? v.dataCriacao ?? "").toString().split("T")[0];
        const d = new Date(dataStr);
        const idx = d.getDate() - 1;

        const vbruto = Number(v.valorTotal ?? v.ValorTotal ?? v.valor ?? 0) || 0;
        valorBrutoCalc += vbruto;
        if (idx >= 0 && idx < totalDias) brutoPorDia[idx] += vbruto;

        const itens = v.itens ?? v.Itens ?? v.items ?? [];
        let lucroVenda = 0;
        for (const i of itens) {
          const qty = Number(i.quantidade ?? i.Quantidade) || 0;
          const pv  = Number(i.precoUnitario ?? i.produto?.precoVenda ?? i.precoVenda ?? 0) || 0;
          const pc  = Number(i.produto?.precoCusto ?? i.precoCusto ?? 0) || 0;
          lucroVenda += (pv - pc) * qty;
        }
        if (itens.length === 0) lucroVenda = vbruto;
        lucroCalc += lucroVenda;
        if (idx >= 0 && idx < totalDias) lucroPorDia[idx] += lucroVenda;
      }

      if (fatLucro === 0 && vf.length > 0) fatLucro = Math.round(lucroCalc * 100) / 100;
      if (totalV   === 0 && vf.length > 0) totalV   = vf.length;
      if (fatBruto === 0 && vf.length > 0) fatBruto = Math.round(valorBrutoCalc * 100) / 100;
      if (ticket   === 0 && totalV > 0)    ticket   = Math.round((fatBruto / totalV) * 100) / 100;

      // Deltas (% relativo à média diária esperada)
      const diasDecorridos = Math.max(1, Math.min(totalDias, hoje.getMonth() === anoMes.mes && hoje.getFullYear() === anoMes.ano ? hoje.getDate() : totalDias));
      const variacao = (acumulado, esperado) => esperado > 0 ? Math.round(((acumulado - esperado) / esperado) * 100) : 0;
      const expFat = (metas.faturamento / totalDias) * diasDecorridos;
      const expVendas = (metas.vendas / totalDias) * diasDecorridos;
      const expClientes = (metas.novosClientes / totalDias) * diasDecorridos;

      setStats({
        faturamentoMes: fatLucro,
        vendasMes: totalV,
        novosClientes: novosC,
        ticketMedio: ticket,
        valorBrutoVendas: fatBruto,
        deltaFat: variacao(fatBruto, expFat),
        deltaVendas: variacao(totalV, expVendas),
        deltaClientes: variacao(novosC, expClientes),
        deltaTicket: 0,
      });

      // sparkline construções
      const dias = Array.from({ length: totalDias }, (_, i) => `${dia(new Date(anoMes.ano, anoMes.mes, i + 1))}`);
      // sparks: usa série diária real, fallback sintético se vazio
      const sparkFromBruto    = brutoPorDia.slice();
      const sparkFromLucro    = lucroPorDia.slice();
      const sparkVendasArr    = new Array(totalDias).fill(0);
      vf.forEach((v) => {
        const dataStr = (v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? "").toString().split("T")[0];
        const d = new Date(dataStr);
        const idx = d.getDate() - 1;
        if (idx >= 0 && idx < totalDias) sparkVendasArr[idx] += 1;
      });
      const sparkTicketArr = sparkVendasArr.map((q, i) => q > 0 ? sparkFromBruto[i] / q : 0);

      setSerieDiaria({
        dias,
        bruto: brutoPorDia,
        lucro: lucroPorDia,
        sparkFat: sparkFromBruto.length ? sparkFromBruto : [0,0,0,0,0,0,0],
        sparkVendas: sparkVendasArr.length ? sparkVendasArr : [0,0,0,0,0,0,0],
        sparkClientes: sparkVendasArr.map((q) => Math.max(0, Math.round(q * 0.2))),
        sparkTicket: sparkTicketArr.length ? sparkTicketArr : [0,0,0,0,0,0,0],
      });

      // ── Categorias ────────────────────────────────────────────────────────
      const vendasCat = res.vendasPorCategoria ?? res.VendasPorCategoria ?? [];
      const catList   = Array.isArray(vendasCat) ? vendasCat : [];
      const totalQtd  = catList.reduce((a, x) => a + (Number(x.quantidadeVendida ?? x.QuantidadeVendida) || 0), 0);
      const totalVal  = catList.reduce((a, x) => a + (Number(x.valorVendido ?? x.ValorVendido) || 0), 0);
      const catFmt    = catList.map((c) => {
        const nome  = c.categoriaNome ?? c.CategoriaNome ?? "Outros";
        const valor = Number(c.valorVendido      ?? c.ValorVendido)      || 0;
        const qtd   = Number(c.quantidadeVendida ?? c.QuantidadeVendida) || 0;
        const pct   = totalQtd ? Math.round((qtd / totalQtd) * 100) : (totalVal ? Math.round((valor / totalVal) * 100) : 0);
        return { categoria: nome, valor, quantidade: qtd, percentual: pct };
      });
      setVendasPorCategoria(catFmt.length > 0 ? catFmt : [
        { categoria: "Roupas",    valor: 0, quantidade: 0, percentual: 0 },
        { categoria: "Calçados",  valor: 0, quantidade: 0, percentual: 0 },
        { categoria: "Acessórios",valor: 0, quantidade: 0, percentual: 0 },
      ]);

      // ── Produtos ──────────────────────────────────────────────────────────
      const prodsTop  = res.produtosMaisVendidos ?? res.ProdutosMaisVendidos ?? [];
      const prodsList = Array.isArray(prodsTop) ? prodsTop : [];
      const totQty    = prodsList.reduce((a, p) => a + (Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0), 0);
      setProdutosMaisVendidos(prodsList.slice(0, 5).map((p) => ({
        label:      p.produtoNome ?? p.ProdutoNome ?? "Produto",
        quantidade: Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0,
        valor:      Number(p.valorVendido      ?? p.ValorVendido)      || 0,
        percentual: totQty ? Math.round(((Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0) / totQty) * 100) : 0,
      })));

      // ── Pagamentos ────────────────────────────────────────────────────────
      const fpList = Array.isArray(res.formasPagamento ?? res.FormasPagamento) ? (res.formasPagamento ?? res.FormasPagamento) : [];
      const fpPorTipo = { Crédito: 0, Débito: 0, Pix: 0, Dinheiro: 0 };
      fpList.forEach((f) => {
        const t   = (f.formaPagamento ?? f.FormaPagamento ?? "").toString().toLowerCase();
        const val = Number(f.valor ?? f.Valor) || 0;
        if (t.includes("cred"))       fpPorTipo.Crédito  += val;
        else if (t.includes("deb"))   fpPorTipo.Débito   += val;
        else if (t.includes("pix"))   fpPorTipo.Pix      += val;
        else if (t.includes("dinhe")) fpPorTipo.Dinheiro += val;
        else fpPorTipo.Crédito += val;
      });
      const totalFp = Object.values(fpPorTipo).reduce((a, b) => a + b, 0);
      const pctFp   = (v) => (totalFp ? Math.round((v / totalFp) * 100) : 0);
      setFormasPagamento([
        { tipo: "Crédito",  valor: fpPorTipo.Crédito,  percentual: pctFp(fpPorTipo.Crédito)  },
        { tipo: "Débito",   valor: fpPorTipo.Débito,   percentual: pctFp(fpPorTipo.Débito)   },
        { tipo: "Pix",      valor: fpPorTipo.Pix,      percentual: pctFp(fpPorTipo.Pix)      },
        { tipo: "Dinheiro", valor: fpPorTipo.Dinheiro, percentual: pctFp(fpPorTipo.Dinheiro) },
      ]);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      setStats({ faturamentoMes: 0, vendasMes: 0, novosClientes: 0, ticketMedio: 0, valorBrutoVendas: 0, deltaFat: 0, deltaVendas: 0, deltaClientes: 0, deltaTicket: 0 });
      setSerieDiaria({ dias: [], bruto: [], lucro: [], sparkFat: [], sparkVendas: [], sparkClientes: [], sparkTicket: [] });
    } finally {
      setCarregando(false);
    }
  }, [anoMes.ano, anoMes.mes, metas.faturamento, metas.vendas, metas.novosClientes]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // ── Metas computadas ─────────────────────────────────────────────────────
  const metasDoMes = useMemo(() => [
    { meta: "Faturamento",   atual: stats.valorBrutoVendas, objetivo: metas.faturamento,   percentual: metas.faturamento   > 0 ? Math.min(100, Math.round((stats.valorBrutoVendas / metas.faturamento)   * 100)) : 0 },
    { meta: "Vendas",        atual: stats.vendasMes,        objetivo: metas.vendas,         percentual: metas.vendas         > 0 ? Math.min(100, Math.round((stats.vendasMes        / metas.vendas)         * 100)) : 0 },
    { meta: "Novos Clientes",atual: stats.novosClientes,    objetivo: metas.novosClientes,  percentual: metas.novosClientes  > 0 ? Math.min(100, Math.round((stats.novosClientes    / metas.novosClientes)  * 100)) : 0 },
  ], [stats, metas]);

  const ehMesAtual = anoMes.ano === hoje.getFullYear() && anoMes.mes === hoje.getMonth();

  // ─── ApexCharts: base options dinâmicas ──────────────────────────────────
  const apexBase = useMemo(() => ({
    theme: { mode: isDark ? "dark" : "light" },
    chart: {
      background: "transparent",
      foreColor: isDark ? "#A8B2C3" : "#475569",
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: '"Inter", "Roboto", sans-serif',
      dropShadow: { enabled: false },
      animations: { enabled: true, easing: "easeinout", speed: 700, animateGradually: { enabled: true, delay: 60 } },
    },
    grid: {
      borderColor: isDark ? alpha(vexaColors.cinzaAzulado, 0.18) : "rgba(15, 23, 42, 0.06)",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 0, bottom: 0, left: 8 },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      style: { fontSize: "12px", fontFamily: '"Inter", sans-serif' },
    },
  }), [isDark]);

  // ─── KPI sparkline ───────────────────────────────────────────────────────
  const sparkOptions = (color) => ({
    chart: {
      type: "area",
      sparkline: { enabled: true },
      animations: { enabled: true, speed: 600 },
    },
    stroke: { curve: "smooth", width: 2.2 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0, stops: [0, 100] },
    },
    colors: [color],
    tooltip: { enabled: false },
  });

  // ─── Hero area chart ─────────────────────────────────────────────────────
  const heroOptions = useMemo(() => ({
    ...apexBase,
    chart: {
      ...apexBase.chart,
      type: "area",
      height: 360,
      stacked: false,
      toolbar: { show: false },
    },
    colors: [PALETTE[0], PALETTE[1]],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: [3, 2.5], dashArray: [0, 5] },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        type: "vertical",
        opacityFrom: isDark ? 0.55 : 0.4,
        opacityTo: 0.02,
        stops: [0, 95],
      },
    },
    markers: {
      size: 0,
      strokeWidth: 2,
      hover: { size: 6 },
      colors: ["#fff"],
      strokeColors: [PALETTE[0], PALETTE[1]],
    },
    xaxis: {
      categories: serieDiaria.dias,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px" }, rotate: 0, hideOverlappingLabels: true },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px" },
        formatter: (v) => fmtBRL(v),
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontSize: "12px",
      fontWeight: 600,
      markers: { width: 10, height: 10, radius: 10 },
      itemMargin: { horizontal: 12, vertical: 0 },
      offsetY: -4,
    },
    tooltip: {
      ...apexBase.tooltip,
      shared: true,
      intersect: false,
      x: { formatter: (val, opts) => `Dia ${serieDiaria.dias[opts.dataPointIndex] ?? val}` },
      y: { formatter: (val) => fmtBRL(val) },
    },
  }), [apexBase, PALETTE, isDark, serieDiaria.dias]);

  const heroSeries = useMemo(() => [
    { name: "Faturamento Bruto", data: serieDiaria.bruto },
    { name: "Lucro",             data: serieDiaria.lucro },
  ], [serieDiaria.bruto, serieDiaria.lucro]);

  // ─── Radial multi (metas) ────────────────────────────────────────────────
  const radialMetasOptions = useMemo(() => ({
    chart: { type: "radialBar", height: 290, sparkline: { enabled: false }, background: "transparent", fontFamily: '"Inter", sans-serif' },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: { margin: 8, size: "30%", background: "transparent" },
        track: {
          show: true,
          background: isDark ? "rgba(141,153,174,0.15)" : "rgba(15,23,42,0.06)",
          strokeWidth: "100%",
          margin: 6,
        },
        dataLabels: {
          name: { show: true, fontSize: "12px", fontWeight: 500, color: isDark ? "#A8B2C3" : "#64748B" },
          value: { show: true, fontSize: "22px", fontWeight: 800, color: isDark ? "#F1F5F9" : "#0F172A", formatter: (v) => `${v}%` },
          total: {
            show: true,
            label: "Média",
            fontSize: "11px",
            fontWeight: 600,
            color: isDark ? "#8D99AE" : "#64748B",
            formatter: () => {
              const avg = Math.round(metasDoMes.reduce((a, m) => a + m.percentual, 0) / Math.max(1, metasDoMes.length));
              return `${avg}%`;
            },
          },
        },
      },
    },
    colors: [isDark ? vexaColors.amareloNeon : "#10B981", isDark ? "#8D99AE" : "#14B8A6", isDark ? "#FAF45A" : "#F59E0B"],
    stroke: { lineCap: "round" },
    labels: metasDoMes.map((m) => m.meta),
    legend: {
      show: true,
      floating: false,
      position: "bottom",
      fontSize: "11px",
      fontWeight: 600,
      markers: { width: 10, height: 10, radius: 10 },
      itemMargin: { horizontal: 8, vertical: 4 },
      labels: { colors: isDark ? "#A8B2C3" : "#475569" },
    },
  }), [isDark, metasDoMes]);

  const radialMetasSeries = useMemo(() => metasDoMes.map((m) => m.percentual), [metasDoMes]);

  // ─── Donut pagamentos ────────────────────────────────────────────────────
  const donutOptions = useMemo(() => ({
    chart: { type: "donut", background: "transparent", fontFamily: '"Inter", sans-serif' },
    colors: PALETTE,
    labels: formasPagamento.map((f) => f.tipo),
    stroke: { width: 4, colors: [isDark ? vexaColors.azulEscuro : "#FFFFFF"] },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: "bottom",
      fontSize: "11px",
      fontWeight: 600,
      markers: { width: 10, height: 10, radius: 10 },
      itemMargin: { horizontal: 8, vertical: 4 },
      labels: { colors: isDark ? "#A8B2C3" : "#475569" },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            name: { show: true, fontSize: "12px", color: isDark ? "#A8B2C3" : "#64748B", offsetY: -4 },
            value: { show: true, fontSize: "20px", fontWeight: 800, color: isDark ? "#F1F5F9" : "#0F172A", offsetY: 6, formatter: (v) => `${v}%` },
            total: {
              show: true,
              label: "Total",
              fontSize: "11px",
              fontWeight: 600,
              color: isDark ? "#8D99AE" : "#64748B",
              formatter: (w) => fmtBRL(formasPagamento.reduce((a, f) => a + f.valor, 0)),
            },
          },
        },
      },
    },
    tooltip: {
      theme: isDark ? "dark" : "light",
      y: { formatter: (v) => `${v}%` },
    },
  }), [PALETTE, isDark, formasPagamento]);

  const donutSeries = useMemo(() => formasPagamento.map((f) => f.percentual), [formasPagamento]);

  // ─── Bar horizontal top produtos ─────────────────────────────────────────
  const produtosOptions = useMemo(() => ({
    ...apexBase,
    chart: { ...apexBase.chart, type: "bar", height: 290, toolbar: { show: false } },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 8,
        borderRadiusApplication: "end",
        barHeight: "60%",
        distributed: true,
        dataLabels: { position: "top" },
      },
    },
    colors: PALETTE,
    fill: {
      type: "gradient",
      gradient: {
        shade: isDark ? "dark" : "light",
        type: "horizontal",
        shadeIntensity: 0.35,
        gradientToColors: PALETTE.map(() => isDark ? "#FAF45A" : "#8B5CF6"),
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.85,
        stops: [0, 100],
      },
    },
    dataLabels: {
      enabled: true,
      textAnchor: "end",
      offsetX: -8,
      style: { fontSize: "11px", fontWeight: 700, colors: [isDark ? "#0F172A" : "#0F172A"] },
      formatter: (val) => `${val} un.`,
    },
    legend: { show: false },
    xaxis: {
      categories: produtosMaisVendidos.map((p) => p.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "11px" } },
    },
    yaxis: {
      labels: { style: { fontSize: "12px", fontWeight: 600 }, maxWidth: 140 },
    },
    grid: { ...apexBase.grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    tooltip: {
      ...apexBase.tooltip,
      y: { formatter: (val, opts) => `${val} unidades — ${fmtBRL(produtosMaisVendidos[opts.dataPointIndex]?.valor || 0)}` },
    },
  }), [apexBase, PALETTE, isDark, produtosMaisVendidos]);

  const produtosSeries = useMemo(() => [{
    name: "Quantidade",
    data: produtosMaisVendidos.map((p) => p.quantidade),
  }], [produtosMaisVendidos]);

  // ─── Column chart categorias ─────────────────────────────────────────────
  const categoriasOptions = useMemo(() => ({
    ...apexBase,
    chart: { ...apexBase.chart, type: "bar", height: 320, toolbar: { show: false } },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "42%",
        borderRadius: 10,
        borderRadiusApplication: "end",
        distributed: true,
      },
    },
    colors: vendasPorCategoria.map((c) => CAT_COLORS[c.categoria] ?? PALETTE[0]),
    fill: {
      type: "gradient",
      gradient: {
        shade: isDark ? "dark" : "light",
        type: "vertical",
        shadeIntensity: 0.25,
        gradientToColors: vendasPorCategoria.map(() => isDark ? "#FAF45A" : "#0F172A"),
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 0.75,
        stops: [0, 100],
      },
    },
    dataLabels: {
      enabled: true,
      offsetY: -24,
      style: { fontSize: "11px", fontWeight: 700, colors: [isDark ? "#F1F5F9" : "#0F172A"] },
      formatter: (val) => `${val}`,
    },
    legend: { show: false },
    xaxis: {
      categories: vendasPorCategoria.map((c) => c.categoria),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { fontSize: "12px", fontWeight: 600 } },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px" },
        formatter: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v,
      },
    },
    tooltip: {
      ...apexBase.tooltip,
      y: { formatter: (val, opts) => {
        const it = vendasPorCategoria[opts.dataPointIndex];
        return `${val} un. · ${fmtBRL(it?.valor || 0)} · ${it?.percentual || 0}%`;
      } },
    },
  }), [apexBase, CAT_COLORS, PALETTE, isDark, vendasPorCategoria]);

  const categoriasSeries = useMemo(() => [{
    name: "Vendas",
    data: vendasPorCategoria.map((c) => c.quantidade || c.valor || 0),
  }], [vendasPorCategoria]);

  // ─── Stat cards ──────────────────────────────────────────────────────────
  const statCards = [
    {
      title: "Faturamento (Lucro)",
      value: fmtBRL(stats.faturamentoMes),
      delta: stats.deltaFat,
      spark: serieDiaria.sparkFat,
      color: isDark ? vexaColors.amareloNeon : "#14B8A6",
    },
    {
      title: "Total de Vendas",
      value: fmtNum(stats.vendasMes),
      delta: stats.deltaVendas,
      spark: serieDiaria.sparkVendas,
      color: isDark ? "#A8B2C3" : "#8B5CF6",
    },
    {
      title: "Novos Clientes",
      value: fmtNum(stats.novosClientes),
      delta: stats.deltaClientes,
      spark: serieDiaria.sparkClientes,
      color: isDark ? "#FAF45A" : "#F59E0B",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${Number(stats.ticketMedio).toFixed(2)}`,
      delta: stats.deltaTicket,
      spark: serieDiaria.sparkTicket,
      color: isDark ? "#8D99AE" : "#EF4444",
    },
  ];

  const cardSx = {
    height: "100%",
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: isDark ? "0 0 0 1px rgba(141,153,174,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
    transition: "transform .25s ease, box-shadow .25s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: isDark ? "0 8px 28px rgba(0,0,0,0.35)" : "0 8px 24px rgba(15,23,42,0.10)",
    },
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Box sx={{
      width: "100%", maxWidth: "100vw", minHeight: "100vh",
      bgcolor: "background.default",
      p: { xs: 1.5, sm: 2, md: 2.5 },
      boxSizing: "border-box", overflowX: "hidden",
    }}>

      {/* Header */}
      <Box sx={{
        display: "flex", flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" },
        gap: 2, mb: 3,
      }}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: 22, sm: 26, md: 30 }, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Dashboard
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
            {MESES_LABEL[anoMes.mes]} {anoMes.ano} · Visão consolidada
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={`${anoMes.mes}-${anoMes.ano}`}
              onChange={(e) => { const [mes, ano] = e.target.value.split("-").map(Number); setAnoMes({ ano, mes }); }}
              sx={{ fontSize: 12, height: 36, borderRadius: 2 }}
            >
              {(() => {
                const opts = []; const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
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
            sx={{
              display: "flex", alignItems: "center", gap: 0.8,
              bgcolor: ehMesAtual ? "primary.main" : "background.paper",
              color: ehMesAtual ? "primary.contrastText" : "text.primary",
              px: 2, py: 1, borderRadius: 2,
              border: "1px solid", borderColor: "divider",
              cursor: "pointer", fontWeight: 600,
              "&:hover": { opacity: 0.85 },
            }}
          >
            <CalendarMonth sx={{ fontSize: 16 }} />
            <Typography sx={{ fontWeight: 600, fontSize: 12 }}>Este Mês</Typography>
          </Box>
          <IconButton
            onClick={() => fetchDashboardData()}
            sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, width: 36, height: 36 }}
          >
            <Refresh sx={{ fontSize: 18, color: "text.secondary", animation: carregando ? "spin 1s linear infinite" : "none", "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } } }} />
          </IconButton>
        </Box>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {statCards.map((c, i) => {
          const up = c.delta >= 0;
          return (
            <Grid item xs={6} sm={6} md={3} key={i}>
              <Card variant="outlined" sx={cardSx} elevation={0}>
                <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 1 }}>
                    <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {c.title}
                    </Typography>
                    {c.delta !== 0 && (
                      <Chip
                        size="small"
                        icon={up ? <TrendingUp sx={{ fontSize: 13 }} /> : <TrendingDown sx={{ fontSize: 13 }} />}
                        label={`${up ? "+" : ""}${c.delta}%`}
                        sx={{
                          height: 22,
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor: up ? alpha(isDark ? "#34D399" : "#10B981", 0.16) : alpha("#EF4444", 0.16),
                          color:   up ? (isDark ? "#34D399" : "#059669") : "#DC2626",
                          "& .MuiChip-icon": { color: "inherit", ml: 0.5 },
                        }}
                      />
                    )}
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: 22, sm: 26, md: 28 }, letterSpacing: "-0.03em", lineHeight: 1.1, mb: 0.5 }}>
                    {c.value}
                  </Typography>
                  <Box sx={{ height: 58, mx: -1, mb: -1 }}>
                    {c.spark?.length > 0 && (
                      <Chart options={sparkOptions(c.color)} series={[{ data: c.spark }]} type="area" height={58} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* HERO Area Chart — Faturamento diário */}
      <Card variant="outlined" sx={{ ...cardSx, mb: 2.5 }} elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: 18, md: 22 }, letterSpacing: "-0.02em" }}>
                Faturamento Diário
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.5 }}>
                Bruto vs. Lucro · {MESES_LABEL[anoMes.mes]} {anoMes.ano}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} divider={<Box sx={{ borderLeft: "1px solid", borderColor: "divider", height: 32 }} />}>
              <Box>
                <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 600 }}>Total Bruto</Typography>
                <Typography sx={{ color: "text.primary", fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{fmtBRL(stats.valorBrutoVendas)}</Typography>
              </Box>
              <Box>
                <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 600 }}>Total Lucro</Typography>
                <Typography sx={{ color: "text.primary", fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>{fmtBRL(stats.faturamentoMes)}</Typography>
              </Box>
            </Stack>
          </Box>
          <Box sx={{ mt: 1, mx: -1 }}>
            <Chart options={heroOptions} series={heroSeries} type="area" height={isMobile ? 260 : 360} />
          </Box>
        </CardContent>
      </Card>

      {/* Row: Radial metas + Donut pagamentos + Bar top produtos */}
      <Grid container spacing={2} alignItems="stretch" sx={{ mb: 2.5 }}>
        {/* Radial Metas */}
        <Grid item xs={12} md={4}>
          <Card
            variant="outlined"
            onClick={() => { setMetasEdit({ faturamento: String(metas.faturamento), vendas: String(metas.vendas), novosClientes: String(metas.novosClientes) }); setOpenMetasDialog(true); }}
            sx={{ ...cardSx, cursor: "pointer" }}
            elevation={0}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 16, md: 18 } }}>
                  Metas do Mês
                </Typography>
                <CheckCircle sx={{ fontSize: 20, color: theme.palette.success.main }} />
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 1 }}>
                Clique para editar
              </Typography>
              <Chart options={radialMetasOptions} series={radialMetasSeries} type="radialBar" height={290} />
              <Stack spacing={0.7} sx={{ mt: 0.5 }}>
                {metasDoMes.map((m, i) => (
                  <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 500 }}>
                      {m.meta}
                    </Typography>
                    <Typography sx={{ color: "text.primary", fontSize: 11, fontWeight: 700 }}>
                      {m.meta === "Faturamento" ? fmtBRL(m.atual) : m.atual} / {m.meta === "Faturamento" ? fmtBRL(m.objetivo) : m.objetivo}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Donut Pagamentos */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={cardSx} elevation={0}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 16, md: 18 } }}>
                  Formas de Pagamento
                </Typography>
                <CreditCard sx={{ fontSize: 20, color: "text.secondary" }} />
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 1 }}>Distribuição por tipo</Typography>
              <Chart options={donutOptions} series={donutSeries} type="donut" height={310} />
            </CardContent>
          </Card>
        </Grid>

        {/* Bar Top Produtos */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={cardSx} elevation={0}>
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: 2 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: { xs: 16, md: 18 } }}>
                  Produtos Mais Vendidos
                </Typography>
                <Inventory2 sx={{ fontSize: 20, color: "text.secondary" }} />
              </Box>
              <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 1 }}>Top 5 por unidades</Typography>
              {produtosMaisVendidos.length > 0 ? (
                <Chart options={produtosOptions} series={produtosSeries} type="bar" height={310} />
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 310, color: "text.secondary" }}>
                  <Typography variant="body2">Nenhuma venda este mês</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Column Chart Categorias */}
      <Card variant="outlined" sx={cardSx} elevation={0}>
        <CardContent sx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: 2 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: 18, md: 20 } }}>
                Vendas por Categoria
              </Typography>
              <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.25 }}>
                Quantidade e valor por categoria
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
              {vendasPorCategoria.map((c, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 2, bgcolor: CAT_COLORS[c.categoria] ?? PALETTE[i % PALETTE.length] }} />
                  <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 600 }}>{c.categoria}</Typography>
                  <Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 800 }}>
                    {c.quantidade ?? 0} un.
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
          <Box sx={{ mx: -1 }}>
            <Chart options={categoriasOptions} series={categoriasSeries} type="bar" height={isMobile ? 260 : 320} />
          </Box>
        </CardContent>
      </Card>

      {/* Dialog metas */}
      <Dialog open={openMetasDialog} onClose={() => setOpenMetasDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: "background.paper" } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Configurar Metas do Mês</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
            O progresso é calculado com base no valor bruto das vendas.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Meta Faturamento (R$)"    type="number" value={metasEdit.faturamento}  onChange={(e) => setMetasEdit((p) => ({ ...p, faturamento: e.target.value }))}  fullWidth size="small" />
            <TextField label="Meta Vendas (quantidade)" type="number" value={metasEdit.vendas}        onChange={(e) => setMetasEdit((p) => ({ ...p, vendas: e.target.value }))}        fullWidth size="small" />
            <TextField label="Meta Novos Clientes"      type="number" value={metasEdit.novosClientes} onChange={(e) => setMetasEdit((p) => ({ ...p, novosClientes: e.target.value }))} fullWidth size="small" />
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
