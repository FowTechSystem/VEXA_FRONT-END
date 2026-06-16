// src/pages/Home.jsx
// Tela de Início — agora combina saudação + atalhos + resumo de hoje + análises (gráficos)
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Stack,
  Skeleton,
  useTheme,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip as MTooltip,
} from "@mui/material";
import {
  ShoppingCartRounded,
  PointOfSaleRounded,
  PersonAddRounded,
  Inventory2Rounded,
  AssignmentTurnedInRounded,
  DescriptionRounded,
  Refresh,
  CalendarMonth,
  CreditCard,
  CheckCircle,
  Lock,
  LockOpen,
} from "@mui/icons-material";
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
  Tooltip as RTooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import { getCaixaStatus, CAIXA_CHANGED_EVENT } from "../utils/caixaStatus";
import { caixaService } from "../api/caixaService";
import { vendasService } from "../api/vendasService";
import { produtosService } from "../api/produtosService";
import { condicionalService } from "../api/condicionalService";
import { dashboardService } from "../api/dashboardService";
import { useCompanySettings } from "../contexts/CompanySettingsContext";
import { vexaColors } from "../theme";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES E HELPERS
// ═══════════════════════════════════════════════════════════════════════════
const MESES_LABEL = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const STORAGE_METAS = "vexa_dashboard_metas";

const NEON = "#F8F32B";
const TEAL = "#14B8A6";
const PURPLE = "#8B5CF6";
const SLATE = "#64748B";
const MINT = "#10B981";

const PALETTE_LIGHT = [TEAL, PURPLE, NEON, "#F59E0B"];
const PALETTE_DARK = [NEON, "#8D99AE", "#A8B2C3", "#6F7A8C"];

const CAT_COLORS_LIGHT = { Roupas: TEAL, Calçados: PURPLE, Acessórios: "#F59E0B", Outros: SLATE };
const CAT_COLORS_DARK = { Roupas: NEON, Calçados: "#8D99AE", Acessórios: "#A8B2C3", Outros: "#6F7A8C" };

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseData(v) {
  if (v == null || v === "") return null;
  const t = new Date(v);
  return Number.isNaN(t.getTime()) ? null : t;
}

function isMesmoDiaCalendario(dataRef, ref = new Date()) {
  const t = parseData(dataRef);
  if (!t) return false;
  return t.getFullYear() === ref.getFullYear() && t.getMonth() === ref.getMonth() && t.getDate() === ref.getDate();
}

function extrairListaVendas(res) {
  if (Array.isArray(res)) return res;
  return res?.vendas ?? res?.Vendas ?? res?.items ?? res?.data ?? [];
}

function nomeUsuario(u) {
  const nome = u?.nome ?? u?.Nome ?? "";
  if (nome && String(nome).trim()) return String(nome).trim();
  const email = u?.email ?? u?.Email ?? "";
  if (email && email.includes("@")) return email.split("@")[0];
  return "usuário";
}

function saudacaoPorHora(h) {
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function formatarMoeda(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const fmtCompact = (v) =>
  v >= 1_000_000 ? `R$ ${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000 ? `R$ ${(v / 1_000).toFixed(1)}K`
  : `R$ ${v.toFixed(2)}`;

// ─── Tooltip customizado dos gráficos ───────────────────────────────────────
const CustomTooltip = ({ active, payload, label, isDark, formatter }) => {
  if (!active || !payload?.length) return null;
  const bg = isDark ? "#1E2330" : "#FFFFFF";
  const border = isDark ? "#2D3548" : "#E2E8F0";
  const text = isDark ? "#F1F5F9" : "#0F172A";
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
      {label && <p style={{ color: muted, fontSize: 11, marginBottom: 6, fontWeight: 500 }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || text, fontSize: 13, fontWeight: 600, margin: "2px 0" }}>
          {formatter ? formatter(entry.value, entry.name) : `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
};

// ─── Sparkline mini para stat cards ─────────────────────────────────────────
const Sparkline = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={52}>
    <AreaChart data={data.map((v, i) => ({ v, i }))} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sg-${color.replace("#", "")})`} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── Rótulo central no Pie ───────────────────────────────────────────────────
const PieCenterLabel = ({ cx, cy, total, label, isDark }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" fill={isDark ? "#F1F5F9" : "#0F172A"} fontSize={22} fontWeight={700}>
      {total}
    </text>
    <text x={cx} y={cy + 12} textAnchor="middle" fill={isDark ? "#8D99AE" : "#64748B"} fontSize={11} fontWeight={500}>
      {label}
    </text>
  </>
);

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ═══════════════════════════════════════════════════════════════════════════
export default function Home() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { isModuleEnabled } = useCompanySettings();
  const [agora, setAgora] = useState(() => new Date());

  // ─── Dados do Resumo de Hoje ──────────────────────────────────────────────
  const [carregandoHoje, setCarregandoHoje] = useState(true);
  const [caixaResumo, setCaixaResumo] = useState(null);
  const [caixaStatusLocal, setCaixaStatusLocal] = useState(() => getCaixaStatus());
  const [vendasLista, setVendasLista] = useState([]);

  const usuario = useMemo(() => authService.getUsuario() ?? {}, []);

  // ─── Dados do Dashboard (mês) ─────────────────────────────────────────────
  const hoje = new Date();
  const [anoMes, setAnoMes] = useState({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  const [carregandoDash, setCarregandoDash] = useState(true);
  const [stats, setStats] = useState({
    faturamentoMes: 0,
    vendasMes: 0,
    novosClientes: 0,
    ticketMedio: 0,
    valorBrutoVendas: 0,
  });
  const [metas, setMetas] = useState({ faturamento: 320000, vendas: 1500, novosClientes: 150 });
  const [openMetasDialog, setOpenMetasDialog] = useState(false);
  const [metasEdit, setMetasEdit] = useState({ faturamento: "", vendas: "", novosClientes: "" });

  const [vendasPorCategoria, setVendasPorCategoria] = useState([
    { categoria: "Roupas", valor: 0, quantidade: 0, percentual: 0 },
    { categoria: "Calçados", valor: 0, quantidade: 0, percentual: 0 },
    { categoria: "Acessórios", valor: 0, quantidade: 0, percentual: 0 },
  ]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([]);
  const [formasPagamento, setFormasPagamento] = useState([
    { tipo: "Crédito", percentual: 25, valor: 0 },
    { tipo: "Débito", percentual: 25, valor: 0 },
    { tipo: "Pix", percentual: 25, valor: 0 },
    { tipo: "Dinheiro", percentual: 25, valor: 0 },
  ]);

  const CAT_COLORS = isDark ? CAT_COLORS_DARK : CAT_COLORS_LIGHT;
  const PALETTE = isDark ? PALETTE_DARK : PALETTE_LIGHT;
  const tickColor = isDark ? "#8D99AE" : "#94A3B8";
  const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";

  const cardSx = useMemo(() => ({
    height: "100%",
    borderRadius: 3,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow: isDark ? "0 0 0 1px rgba(141,153,174,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
  }), [isDark]);

  // ─── Atualiza relógio ────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ─── Carrega metas salvas ────────────────────────────────────────────────
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

  useEffect(() => {
    const syncCaixa = () => setCaixaStatusLocal(getCaixaStatus());
    window.addEventListener(CAIXA_CHANGED_EVENT, syncCaixa);
    window.addEventListener("storage", syncCaixa);
    return () => {
      window.removeEventListener(CAIXA_CHANGED_EVENT, syncCaixa);
      window.removeEventListener("storage", syncCaixa);
    };
  }, []);

  // ─── Carrega Resumo de Hoje ──────────────────────────────────────────────
  const carregarDadosHoje = useCallback(async () => {
    setCarregandoHoje(true);
    const hojeStr = hojeISO();
    try {
      const [rCaixa, rVendas] = await Promise.allSettled([
        caixaService.getResumo(hojeStr, hojeStr),
        vendasService.getAll({ pagina: 1, tamanho: 200 }),
      ]);
      if (rCaixa.status === "fulfilled") {
        setCaixaResumo(rCaixa.value ?? {});
      } else {
        setCaixaResumo({});
      }
      if (rVendas.status === "fulfilled") {
        setVendasLista(extrairListaVendas(rVendas.value));
      } else {
        setVendasLista([]);
      }
    } catch {
      setCaixaResumo({});
      setVendasLista([]);
    } finally {
      setCarregandoHoje(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosHoje();
  }, [carregarDadosHoje]);

  // ─── Carrega dashboard (mês) ─────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setCarregandoDash(true);
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
          const vendasListR = Array.isArray(vendasRes) ? vendasRes : vendasRes?.vendas ?? vendasRes?.Vendas ?? vendasRes?.items ?? vendasRes?.data ?? [];
          const inicio = new Date(anoMes.ano, anoMes.mes, 1).toISOString().split("T")[0];
          const fim = new Date(anoMes.ano, anoMes.mes + 1, 0).toISOString().split("T")[0];
          const vf = vendasListR.filter((v) => {
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
              const pv = Number(i.precoUnitario ?? i.produto?.precoVenda ?? i.precoVenda ?? 0) || 0;
              const pc = Number(i.produto?.precoCusto ?? i.precoCusto ?? 0) || 0;
              lucroCalc += (pv - pc) * qty;
            }
            if (itens.length === 0) lucroCalc += Number(v.valorTotal ?? v.ValorTotal ?? v.valor ?? 0) || 0;
          }
          if (vf.length > 0) {
            if (fatLucro === 0) fatLucro = Math.round(lucroCalc * 100) / 100;
            if (totalV === 0) totalV = vf.length;
            if (fatBruto === 0) fatBruto = Math.round(valorBrutoCalc * 100) / 100;
            ticket = totalV > 0 ? Math.round((fatBruto / totalV) * 100) / 100 : 0;
          }
        } catch (_) {}
      }

      setStats({ faturamentoMes: fatLucro, vendasMes: totalV, novosClientes: novosC, ticketMedio: ticket, valorBrutoVendas: fatBruto });

      // categorias
      const vendasCat = res.vendasPorCategoria ?? res.VendasPorCategoria ?? [];
      const catList = Array.isArray(vendasCat) ? vendasCat : [];
      const totalQtd = catList.reduce((a, x) => a + (Number(x.quantidadeVendida ?? x.QuantidadeVendida) || 0), 0);
      const totalVal = catList.reduce((a, x) => a + (Number(x.valorVendido ?? x.ValorVendido) || 0), 0);
      const catFormat = catList.map((c) => {
        const nome = c.categoriaNome ?? c.CategoriaNome ?? "Outros";
        const valor = Number(c.valorVendido ?? c.ValorVendido) || 0;
        const qtd = Number(c.quantidadeVendida ?? c.QuantidadeVendida) || 0;
        const pct = totalQtd ? Math.round((qtd / totalQtd) * 100) : (totalVal ? Math.round((valor / totalVal) * 100) : 0);
        return { categoria: nome, valor, quantidade: qtd, percentual: pct };
      });
      setVendasPorCategoria(catFormat.length > 0 ? catFormat : [
        { categoria: "Roupas", valor: 0, quantidade: 0, percentual: 0 },
        { categoria: "Calçados", valor: 0, quantidade: 0, percentual: 0 },
        { categoria: "Acessórios", valor: 0, quantidade: 0, percentual: 0 },
      ]);

      // produtos top
      const prodsTop = res.produtosMaisVendidos ?? res.ProdutosMaisVendidos ?? [];
      const prodsList = Array.isArray(prodsTop) ? prodsTop : [];
      const totQty = prodsList.reduce((a, p) => a + (Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0), 0);
      setProdutosMaisVendidos(prodsList.slice(0, 4).map((p, i) => ({
        label: p.produtoNome ?? p.ProdutoNome ?? "Produto",
        quantidade: Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0,
        valor: Number(p.valorVendido ?? p.ValorVendido) || 0,
        percentual: totQty ? Math.round(((Number(p.quantidadeVendida ?? p.QuantidadeVendida) || 0) / totQty) * 100) : 0,
        colorIndex: i,
      })));

      // formas de pagamento
      const fpList = Array.isArray(res.formasPagamento ?? res.FormasPagamento) ? (res.formasPagamento ?? res.FormasPagamento) : [];
      const fpPorTipo = { Crédito: 0, Débito: 0, Pix: 0, Dinheiro: 0 };
      fpList.forEach((f) => {
        const t = (f.formaPagamento ?? f.FormaPagamento ?? "").toString().toLowerCase();
        const val = Number(f.valor ?? f.Valor) || 0;
        if (t.includes("cred")) fpPorTipo.Crédito += val;
        else if (t.includes("deb")) fpPorTipo.Débito += val;
        else if (t.includes("pix")) fpPorTipo.Pix += val;
        else if (t.includes("dinhe")) fpPorTipo.Dinheiro += val;
        else fpPorTipo.Crédito += val;
      });
      const totalFp = Object.values(fpPorTipo).reduce((a, b) => a + b, 0);
      const pctFp = (v) => (totalFp ? Math.round((v / totalFp) * 100) : 25);
      setFormasPagamento([
        { tipo: "Crédito", valor: fpPorTipo.Crédito, percentual: pctFp(fpPorTipo.Crédito) },
        { tipo: "Débito", valor: fpPorTipo.Débito, percentual: pctFp(fpPorTipo.Débito) },
        { tipo: "Pix", valor: fpPorTipo.Pix, percentual: pctFp(fpPorTipo.Pix) },
        { tipo: "Dinheiro", valor: fpPorTipo.Dinheiro, percentual: pctFp(fpPorTipo.Dinheiro) },
      ]);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
      setStats({ faturamentoMes: 0, vendasMes: 0, novosClientes: 0, ticketMedio: 0, valorBrutoVendas: 0 });
    } finally {
      setCarregandoDash(false);
    }
  }, [anoMes.ano, anoMes.mes]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ─── Derivados ────────────────────────────────────────────────────────────
  const vendasHoje = useMemo(
    () =>
      vendasLista.filter((v) => {
        const dv = v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt;
        return isMesmoDiaCalendario(dv, agora);
      }),
    [vendasLista, agora],
  );

  const caixaAberto = caixaStatusLocal.aberto;

  const faturamentoHoje = useMemo(
    () => vendasHoje.reduce((acc, v) => acc + (Number(v.valorTotal ?? v.ValorTotal ?? 0) || 0), 0),
    [vendasHoje],
  );

  const entradasCaixaHoje = useMemo(() => {
    if (!caixaResumo) return 0;
    return Number(caixaResumo.totalEntradas ?? caixaResumo.TotalEntradas ?? 0) || 0;
  }, [caixaResumo]);

  const gerarTrend = (valor) =>
    Array.from({ length: 12 }, (_, i) =>
      Math.max(0, valor * 0.3 + Math.sin(i * 0.8) * (valor * 0.15) + (i / 12) * valor * 0.5),
    );

  const metasDoMes = [
    { meta: "Faturamento", atual: stats.valorBrutoVendas, objetivo: metas.faturamento, percentual: metas.faturamento > 0 ? Math.min(100, Math.round((stats.valorBrutoVendas / metas.faturamento) * 100)) : 0 },
    { meta: "Vendas", atual: stats.vendasMes, objetivo: metas.vendas, percentual: metas.vendas > 0 ? Math.min(100, Math.round((stats.vendasMes / metas.vendas) * 100)) : 0 },
    { meta: "Novos Clientes", atual: stats.novosClientes, objetivo: metas.novosClientes, percentual: metas.novosClientes > 0 ? Math.min(100, Math.round((stats.novosClientes / metas.novosClientes) * 100)) : 0 },
  ];

  const ehMesAtual = anoMes.ano === hoje.getFullYear() && anoMes.mes === hoje.getMonth();

  const statCards = [
    { title: "Faturamento (Lucro)", value: fmtCompact(stats.faturamentoMes), subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`, trend: gerarTrend(stats.faturamentoMes || 1) },
    { title: "Total de Vendas", value: String(stats.vendasMes), subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`, trend: gerarTrend(stats.vendasMes || 1) },
    { title: "Novos Clientes", value: String(stats.novosClientes), subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`, trend: gerarTrend(stats.novosClientes || 1) },
    { title: "Ticket Médio", value: `R$ ${stats.ticketMedio.toFixed(2)}`, subtitle: `${MESES_LABEL[anoMes.mes]} ${anoMes.ano}`, trend: gerarTrend(stats.ticketMedio || 1) },
  ];

  const radialData = formasPagamento.map((f, i) => ({
    name: f.tipo,
    value: f.percentual,
    fill: PALETTE[i],
  }));

  // ─── Saudação ────────────────────────────────────────────────────────────
  const horaStr = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  const dataExtenso = agora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const saudacao = saudacaoPorHora(agora.getHours());
  const nome = nomeUsuario(usuario);

  // ─── Atalhos ──────────────────────────────────────────────────────────────
  const atalhos = [
    { titulo: "Nova Venda", subtitulo: "Abrir o ponto de venda", icone: <ShoppingCartRounded sx={{ fontSize: 38 }} />, corCirculo: isDark ? theme.palette.primary.main : "#14B8A6", corIcone: isDark ? theme.palette.primary.contrastText : "#fff", rota: "/vendas", moduleKey: "vendas" },
    { titulo: "Movimentação Caixa", subtitulo: "Registrar entrada ou saída", icone: <PointOfSaleRounded sx={{ fontSize: 38 }} />, corCirculo: "#8B5CF6", corIcone: "#fff", rota: "/caixa?novaMov=1", moduleKey: "caixa" },
    { titulo: "Novo Cliente", subtitulo: "Cadastro rápido", icone: <PersonAddRounded sx={{ fontSize: 38 }} />, corCirculo: "#F59E0B", corIcone: "#fff", rota: "/clientes", moduleKey: "clientes" },
    { titulo: "Estoque", subtitulo: "Consultar quantidades", icone: <Inventory2Rounded sx={{ fontSize: 38 }} />, corCirculo: "#3B82F6", corIcone: "#fff", rota: "/estoque", moduleKey: "estoque" },
    { titulo: "Condicional", subtitulo: "Reservas e devoluções", icone: <AssignmentTurnedInRounded sx={{ fontSize: 38 }} />, corCirculo: "#EC4899", corIcone: "#fff", rota: "/condicional", moduleKey: "condicional" },
    { titulo: "Relatórios", subtitulo: "Análises e exportações", icone: <DescriptionRounded sx={{ fontSize: 38 }} />, corCirculo: "#10B981", corIcone: "#fff", rota: "/relatorios", moduleKey: "relatorios" },
  ];

  const heroGradient = isDark
    ? "linear-gradient(135deg, rgba(248,243,43,0.08) 0%, transparent 60%)"
    : "linear-gradient(135deg, rgba(20,184,166,0.08) 0%, transparent 60%)";

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: "background.default", minHeight: "100%" }}>
      <Stack spacing={2}>
        {/* ════════════════ Seção 1 — Hero ════════════════ */}
        <Card variant="outlined" elevation={0} sx={{ ...cardSx, overflow: "hidden" }}>
          <Box
            sx={{
              background: heroGradient,
              px: { xs: 2, md: 3 },
              py: { xs: 2, md: 2.5 },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: "1.4rem", md: "1.8rem" }, fontWeight: 800, letterSpacing: "-0.03em", color: "text.primary", lineHeight: 1.15 }}>
                {saudacao}, {nome}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, textTransform: "capitalize" }}>
                {dataExtenso} · {horaStr}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Chip
                icon={caixaAberto ? <LockOpen sx={{ fontSize: "16px !important" }} /> : <Lock sx={{ fontSize: "16px !important" }} />}
                label={caixaAberto ? "Caixa Aberto" : "Caixa Fechado"}
                color={caixaAberto ? "success" : "default"}
                clickable
                onClick={() => navigate("/caixa")}
                sx={{
                  fontWeight: 700,
                  ...(!caixaAberto && {
                    bgcolor: "warning.main",
                    color: "warning.contrastText",
                    "& .MuiChip-icon": { color: "warning.contrastText" },
                  }),
                }}
              />

              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select
                  value={`${anoMes.mes}-${anoMes.ano}`}
                  onChange={(e) => {
                    const [mes, ano] = e.target.value.split("-").map(Number);
                    setAnoMes({ ano, mes });
                  }}
                  sx={{ fontSize: 12, height: 32, borderRadius: 2 }}
                >
                  {(() => {
                    const opts = [];
                    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    for (let i = 0; i < 24; i++) {
                      const d = new Date(fim);
                      d.setMonth(d.getMonth() - i);
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
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                  bgcolor: ehMesAtual ? "primary.main" : "background.paper",
                  color: ehMesAtual ? "primary.contrastText" : "text.primary",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  cursor: "pointer",
                  height: 32,
                  "&:hover": { opacity: 0.85 },
                }}
              >
                <CalendarMonth sx={{ fontSize: 14 }} />
                <Typography sx={{ fontWeight: 700, fontSize: 11 }}>Este Mês</Typography>
              </Box>

              <IconButton
                onClick={() => { fetchDashboardData(); carregarDadosHoje(); }}
                sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2, width: 32, height: 32 }}
              >
                <Refresh sx={{ fontSize: 16, color: "text.secondary" }} />
              </IconButton>
            </Box>
          </Box>
        </Card>

        {/* ════════════════ Seção 2 — Atalhos ════════════════ */}
        <Grid container spacing={1.5}>
          {atalhos.map((a) => {
            // Atalho fica desabilitado quando o módulo não está ativo para a empresa.
            const ativo = !a.moduleKey || isModuleEnabled(a.moduleKey);
            return (
              <Grid key={a.rota} size={{ xs: 6, sm: 4, md: 2 }}>
                <MTooltip
                  title={ativo ? "" : "Módulo não disponível para sua empresa"}
                  arrow
                  disableHoverListener={ativo}
                >
                  <Card
                    variant="outlined"
                    elevation={0}
                    onClick={ativo ? () => navigate(a.rota) : undefined}
                    aria-disabled={!ativo}
                    sx={{
                      ...cardSx,
                      cursor: ativo ? "pointer" : "not-allowed",
                      height: "100%",
                      opacity: ativo ? 1 : 0.45,
                      filter: ativo ? "none" : "grayscale(0.7)",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      "&:hover": ativo
                        ? {
                            transform: "translateY(-3px)",
                            boxShadow: isDark ? "0 12px 28px rgba(0,0,0,0.35)" : "0 12px 28px rgba(0,0,0,0.12)",
                          }
                        : {},
                    }}
                  >
                    <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: a.corCirculo, color: a.corIcone, display: "flex", alignItems: "center", justifyContent: "center", mb: 1 }}>
                        {a.icone}
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "text.primary" }}>{a.titulo}</Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25, fontSize: "0.68rem" }}>
                        {a.subtitulo}
                      </Typography>
                    </CardContent>
                  </Card>
                </MTooltip>
              </Grid>
            );
          })}
        </Grid>

        {/* ════════════════ Seção 3 — Resumo de Hoje (compacto, 3 colunas) ════════════════ */}
        <Grid container spacing={1.5}>
          {[
            { label: "Vendas Hoje", value: carregandoHoje ? "…" : String(vendasHoje.length) },
            { label: "Faturamento Hoje", value: carregandoHoje ? "…" : formatarMoeda(faturamentoHoje) },
            { label: "Entradas no Caixa", value: carregandoHoje ? "…" : formatarMoeda(entradasCaixaHoje) },
          ].map((c, i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Card variant="outlined" elevation={0} sx={cardSx}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", mb: 0.5 }}>
                    {c.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: 22, color: "text.primary", lineHeight: 1.1 }}>
                    {c.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ════════════════ Seção 4 — Stat Cards (mês) ════════════════ */}
        <Grid container spacing={1.5}>
          {statCards.map((card, i) => (
            <Grid item xs={6} sm={6} md={3} key={i} size={{ xs: 6, md: 3 }}>
              <Card variant="outlined" sx={cardSx} elevation={0}>
                <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: 1.5 } }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 700, mb: 0.75, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {card.title}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: "text.primary", fontSize: { xs: 20, sm: 24, md: 26 }, letterSpacing: "-0.03em", lineHeight: 1.1, mb: 0.5 }}>
                    {card.value}
                  </Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 11, mb: 1 }}>
                    {card.subtitle}
                  </Typography>
                  <Sparkline data={card.trend} color={isDark ? NEON : TEAL} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ════════════════ Seção 5 — Gráficos ════════════════ */}
        <Grid container spacing={1.5} alignItems="stretch">
          {/* Vendas por Categoria */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Card variant="outlined" sx={cardSx} elevation={0}>
              <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: 1.5 } }}>
                <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: 15, mb: 0.25 }}>
                  Vendas por Categoria
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 11, mb: 2 }}>
                  Quantidade vendida por categoria
                </Typography>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={vendasPorCategoria.map((c) => ({ name: c.categoria, qtd: c.quantidade || c.valor || 0, fill: CAT_COLORS[c.categoria] ?? SLATE }))}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    barSize={32}
                  >
                    <CartesianGrid vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: tickColor, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
                    <RTooltip content={<CustomTooltip isDark={isDark} formatter={(v) => `${v} unidades`} />} cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 8 }} />
                    <Bar dataKey="qtd" radius={[8, 8, 0, 0]}>
                      {vendasPorCategoria.map((c, i) => (
                        <Cell key={i} fill={CAT_COLORS[c.categoria] ?? PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1.5 }}>
                  {vendasPorCategoria.map((item, i) => {
                    const cor = CAT_COLORS[item.categoria] ?? PALETTE[i % PALETTE.length];
                    return (
                      <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: 2, bgcolor: cor }} />
                          <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 500 }}>{item.categoria}</Typography>
                        </Box>
                        <Typography sx={{ color: "text.primary", fontSize: 11, fontWeight: 700 }}>
                          {item.quantidade} un. ({item.percentual}%)
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Produtos Mais Vendidos */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Card variant="outlined" sx={cardSx} elevation={0}>
              <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: 15 }}>
                    Produtos Mais Vendidos
                  </Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 10, fontWeight: 500 }}>Este mês</Typography>
                </Box>
                <Typography sx={{ color: "text.secondary", fontSize: 11, mb: 1.5 }}>Top 4 por unidades</Typography>

                {produtosMaisVendidos.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={produtosMaisVendidos.map((p, i) => ({ name: p.label, value: p.percentual || 1, fill: PALETTE[i % PALETTE.length] }))}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {produtosMaisVendidos.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Pie>
                        <RTooltip content={<CustomTooltip isDark={isDark} formatter={(v, name) => `${name}: ${v}%`} />} />
                        <PieCenterLabel cx="50%" cy="50%" total={produtosMaisVendidos.reduce((a, p) => a + p.quantidade, 0)} label="unidades" isDark={isDark} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 0.5 }}>
                      {produtosMaisVendidos.map((item, i) => {
                        const cor = PALETTE[i % PALETTE.length];
                        return (
                          <Box key={i}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: 2, bgcolor: cor, flexShrink: 0 }} />
                                <Typography sx={{ color: "text.secondary", fontSize: 11, fontWeight: 500 }} noWrap>{item.label}</Typography>
                              </Box>
                              <Typography sx={{ color: "text.primary", fontSize: 11, fontWeight: 700 }}>{item.quantidade}</Typography>
                            </Box>
                            <Box sx={{ height: 4, borderRadius: 10, bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                              <Box sx={{ height: "100%", width: `${Math.min(100, item.percentual * 2.5)}%`, bgcolor: cor, borderRadius: 10 }} />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: "text.secondary" }}>
                    <Typography variant="body2">Nenhuma venda este mês</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Formas de Pagamento */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Card variant="outlined" sx={cardSx} elevation={0}>
              <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: 15 }}>
                    Formas de Pagamento
                  </Typography>
                  <CreditCard sx={{ fontSize: 18, color: "text.secondary" }} />
                </Box>
                <Typography sx={{ color: "text.secondary", fontSize: 11, mb: 1.5 }}>Distribuição por tipo</Typography>
                <ResponsiveContainer width="100%" height={180}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius={25} outerRadius={80} data={radialData} startAngle={90} endAngle={-270} barSize={11}>
                    <RadialBar dataKey="value" cornerRadius={8} background={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", cornerRadius: 8 }} />
                    <RTooltip content={<CustomTooltip isDark={isDark} formatter={(v, name) => `${name}: ${v}%`} />} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 0.5 }}>
                  {formasPagamento.map((item, i) => (
                    <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: 2, bgcolor: PALETTE[i % PALETTE.length] }} />
                        <Typography sx={{ color: "text.secondary", fontSize: 12, fontWeight: 500 }}>{item.tipo}</Typography>
                      </Box>
                      <Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 700 }}>
                        {item.percentual}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Metas do Mês */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Card
              variant="outlined"
              onClick={() => {
                setMetasEdit({ faturamento: String(metas.faturamento), vendas: String(metas.vendas), novosClientes: String(metas.novosClientes) });
                setOpenMetasDialog(true);
              }}
              sx={{ ...cardSx, cursor: "pointer", transition: "box-shadow 0.2s", "&:hover": { boxShadow: isDark ? `0 0 0 2px ${NEON}44` : `0 0 0 2px ${TEAL}44` } }}
              elevation={0}
            >
              <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 700, color: "text.primary", fontSize: 15 }}>
                    Metas do Mês
                  </Typography>
                  <CheckCircle sx={{ fontSize: 18, color: MINT }} />
                </Box>
                <Typography sx={{ color: "text.secondary", fontSize: 11, mb: 2 }}>Clique para editar as metas</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {metasDoMes.map((item, i) => {
                    const barColor = item.percentual >= 90 ? MINT : item.percentual >= 60 ? (isDark ? NEON : TEAL) : "#F59E0B";
                    return (
                      <Box key={i}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.5 }}>
                          <Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 600 }}>{item.meta}</Typography>
                          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                            <Typography sx={{ color: barColor, fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{item.percentual}%</Typography>
                            <Typography sx={{ color: "text.secondary", fontSize: 10 }}>
                              {item.meta === "Faturamento" ? fmtCompact(item.atual) : item.atual}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ position: "relative", height: 7, borderRadius: 10, bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                          <Box sx={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${item.percentual}%`, bgcolor: barColor, borderRadius: 10, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.25 }}>
                          <Typography sx={{ color: "text.secondary", fontSize: 10 }}>
                            Meta: {item.meta === "Faturamento" ? fmtCompact(item.objetivo) : item.objetivo}
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
      </Stack>

      {/* ── Dialog Metas ─────────────────────────────────────────────────── */}
      <Dialog open={openMetasDialog} onClose={() => setOpenMetasDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Configurar Metas do Mês</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
            O progresso é calculado com base no valor bruto das vendas.
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField label="Meta Faturamento (R$)" type="number" value={metasEdit.faturamento} onChange={(e) => setMetasEdit((p) => ({ ...p, faturamento: e.target.value }))} fullWidth size="small" />
            <TextField label="Meta Vendas (quantidade)" type="number" value={metasEdit.vendas} onChange={(e) => setMetasEdit((p) => ({ ...p, vendas: e.target.value }))} fullWidth size="small" />
            <TextField label="Meta Novos Clientes" type="number" value={metasEdit.novosClientes} onChange={(e) => setMetasEdit((p) => ({ ...p, novosClientes: e.target.value }))} fullWidth size="small" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenMetasDialog(false)} sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button
            variant="contained"
            sx={{ borderRadius: 2, fontWeight: 700 }}
            onClick={() => {
              const fat = parseInt(metasEdit.faturamento, 10) || 0;
              const vend = parseInt(metasEdit.vendas, 10) || 0;
              const nov = parseInt(metasEdit.novosClientes, 10) || 0;
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
