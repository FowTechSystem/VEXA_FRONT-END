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
  Avatar,
  Skeleton,
  useTheme,
} from "@mui/material";
import {
  ShoppingCartRounded,
  PointOfSaleRounded,
  PersonAddRounded,
  Inventory2Rounded,
  AssignmentTurnedInRounded,
  DescriptionRounded,
  CheckCircleRounded,
  WarningRounded,
  ErrorRounded,
  InfoOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/authService";
import { caixaService } from "../api/caixaService";
import { vendasService } from "../api/vendasService";
import { produtosService } from "../api/produtosService";
import { condicionalService } from "../api/condicionalService";
import { vexaColors } from "../theme";

function hojeISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseData(v) {
  if (v == null || v === "") return null;
  const t = new Date(v);
  return Number.isNaN(t.getTime()) ? null : t;
}

function isMesmoDiaCalendario(dataRef, ref = new Date()) {
  const t = parseData(dataRef);
  if (!t) return false;
  return (
    t.getFullYear() === ref.getFullYear() &&
    t.getMonth() === ref.getMonth() &&
    t.getDate() === ref.getDate()
  );
}

function extrairListaVendas(res) {
  if (Array.isArray(res)) return res;
  return res?.vendas ?? res?.Vendas ?? res?.items ?? res?.data ?? [];
}

function extrairListaProdutos(arr) {
  return Array.isArray(arr) ? arr : [];
}

function extrairListaCondicionais(data) {
  const list =
    data?.condicionais ??
    data?.Condicionais ??
    data?.items ??
    (Array.isArray(data) ? data : []);
  return Array.isArray(list) ? list : [];
}

function estoqueNum(p) {
  const v =
    p.estoque ??
    p.quantidadeEstoque ??
    p.estoqueAtual ??
    p.Estoque ??
    p.QuantidadeEstoque ??
    p.estoqueDisponivel;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dataDevolucaoCondicional(c) {
  return (
    c.dataDevolucao ??
    c.DataDevolucao ??
    c.dataPrevistaDevolucao ??
    c.DataPrevistaDevolucao ??
    c.prazoDevolucao ??
    c.PrazoDevolucao ??
    c.dataFim ??
    c.DataFim ??
    null
  );
}

function inicioDoDia(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fimDoDiaMais(d, dias) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  x.setDate(x.getDate() + dias);
  return x;
}

function condicionalAindaRelevante(c) {
  const st = String(c.status ?? c.Status ?? "").toLowerCase();
  if (st.includes("devolv") || st.includes("conclu") || st.includes("finaliz")) return false;
  const dev = c.devolvido ?? c.Devolvido;
  if (dev === true) return false;
  return true;
}

function condicionalVenceEmAte3Dias(c) {
  const raw = dataDevolucaoCondicional(c);
  const dt = parseData(raw);
  if (!dt) return false;
  const hojeIni = inicioDoDia(new Date());
  const limite = fimDoDiaMais(new Date(), 3);
  return dt >= hojeIni && dt <= limite;
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

function tempoRelativo(iso) {
  const d = parseData(iso);
  if (!d) return "";
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.floor(h / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function labelStatusVenda(s) {
  const x = String(s ?? "").toLowerCase();
  if (!x) return "—";
  if (x.includes("pend")) return "Pendente";
  if (x.includes("aguardando")) return "Aguardando";
  if (x.includes("cancel")) return "Cancelada";
  if (x.includes("final")) return "Finalizada";
  return s;
}

export default function Home() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const [agora, setAgora] = useState(() => new Date());
  const [carregando, setCarregando] = useState(true);

  const [caixaResumo, setCaixaResumo] = useState(null);
  const [caixaErro, setCaixaErro] = useState(false);
  const [vendasLista, setVendasLista] = useState([]);
  const [produtosLista, setProdutosLista] = useState([]);
  const [condicionaisLista, setCondicionaisLista] = useState([]);

  const usuario = useMemo(() => authService.getUsuario() ?? {}, []);

  const cardSx = useMemo(
    () => ({
      height: "100%",
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      boxShadow: isDark ? "0 0 0 1px rgba(141,153,174,0.10)" : "0 1px 3px rgba(0,0,0,0.04)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.28)" : "0 8px 24px rgba(0,0,0,0.08)",
      },
    }),
    [isDark],
  );

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setCaixaErro(false);
    const hoje = hojeISO();

    try {
      const [rCaixa, rVendas, rProdutos, rCond] = await Promise.allSettled([
        caixaService.getResumo(hoje, hoje),
        vendasService.getAll({ pagina: 1, tamanho: 200 }),
        produtosService.getAll({ pagina: 1, tamanho: 500 }),
        condicionalService.listar({ pagina: 1, tamanho: 200 }),
      ]);

      try {
        if (rCaixa.status === "fulfilled") {
          setCaixaResumo(rCaixa.value ?? {});
          setCaixaErro(false);
        } else {
          setCaixaResumo({});
          setCaixaErro(true);
        }
      } catch {
        setCaixaResumo({});
        setCaixaErro(true);
      }

      try {
        if (rVendas.status === "fulfilled") {
          setVendasLista(extrairListaVendas(rVendas.value));
        } else {
          setVendasLista([]);
        }
      } catch {
        setVendasLista([]);
      }

      try {
        if (rProdutos.status === "fulfilled") {
          setProdutosLista(extrairListaProdutos(rProdutos.value));
        } else {
          setProdutosLista([]);
        }
      } catch {
        setProdutosLista([]);
      }

      try {
        if (rCond.status === "fulfilled") {
          setCondicionaisLista(extrairListaCondicionais(rCond.value));
        } else {
          setCondicionaisLista([]);
        }
      } catch {
        setCondicionaisLista([]);
      }
    } catch {
      setCaixaResumo({});
      setCaixaErro(true);
      setVendasLista([]);
      setProdutosLista([]);
      setCondicionaisLista([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const vendasHoje = useMemo(() => {
    return vendasLista.filter((v) => {
      const dv = v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt;
      return isMesmoDiaCalendario(dv, agora);
    });
  }, [vendasLista, agora]);

  const vendasPendentesHoje = useMemo(() => {
    return vendasHoje.filter((v) => {
      const st = String(v.status ?? v.Status ?? "").toLowerCase();
      return st === "pendente" || st === "aguardando_pagamento";
    });
  }, [vendasHoje]);

  const produtosEstoqueBaixo = useMemo(
    () => produtosLista.filter((p) => estoqueNum(p) < 5),
    [produtosLista],
  );

  const condicionaisVencendo = useMemo(
    () =>
      condicionaisLista.filter(
        (c) => condicionalAindaRelevante(c) && condicionalVenceEmAte3Dias(c),
      ),
    [condicionaisLista],
  );

  const caixaAberto = useMemo(() => {
    if (caixaErro || caixaResumo == null) return null;
    const ent = Number(caixaResumo.totalEntradas ?? caixaResumo.TotalEntradas ?? 0) || 0;
    const mov = caixaResumo.movimentacoes ?? caixaResumo.Movimentacoes ?? [];
    const arr = Array.isArray(mov) ? mov : [];
    return ent > 0 || arr.length > 0;
  }, [caixaResumo, caixaErro]);

  const faturamentoHoje = useMemo(() => {
    return vendasHoje.reduce((acc, v) => acc + (Number(v.valorTotal ?? v.ValorTotal ?? 0) || 0), 0);
  }, [vendasHoje]);

  const entradasCaixaHoje = useMemo(() => {
    if (!caixaResumo) return 0;
    return Number(caixaResumo.totalEntradas ?? caixaResumo.TotalEntradas ?? 0) || 0;
  }, [caixaResumo]);

  const atividadeRecente = useMemo(() => {
    const sorted = [...vendasHoje].sort((a, b) => {
      const da = parseData(a.dataVenda ?? a.DataVenda ?? a.data) ?? 0;
      const db = parseData(b.dataVenda ?? b.DataVenda ?? b.data) ?? 0;
      return db - da;
    });
    return sorted.slice(0, 5);
  }, [vendasHoje]);

  const pendencias = useMemo(() => {
    const itens = [];
    if (!carregando && !caixaErro && caixaAberto === false) {
      itens.push({
        key: "caixa",
        severity: "warning",
        titulo: "Caixa fechado para hoje",
        descricao: "Não há movimentações registradas hoje. Registre uma movimentação se necessário.",
        rota: "/caixa/nova-movimentacao",
        icone: <WarningRounded color="warning" />,
      });
    }
    if (!carregando && vendasPendentesHoje.length > 0) {
      itens.push({
        key: "vendas-pend",
        severity: "error",
        titulo: `${vendasPendentesHoje.length} venda(s) pendente(s) de pagamento`,
        descricao: "Existem vendas de hoje aguardando conclusão do pagamento.",
        rota: "/vendas",
        icone: <ErrorRounded color="error" />,
      });
    }
    if (!carregando && produtosEstoqueBaixo.length > 0) {
      itens.push({
        key: "estoque",
        severity: "warning",
        titulo: `${produtosEstoqueBaixo.length} produto(s) com estoque baixo`,
        descricao: "Produtos com quantidade abaixo de 5 unidades.",
        rota: "/estoque",
        icone: <InfoOutlined color="warning" />,
      });
    }
    if (!carregando && condicionaisVencendo.length > 0) {
      itens.push({
        key: "cond",
        severity: "warning",
        titulo: `${condicionaisVencendo.length} condicional(is) vencendo em até 3 dias`,
        descricao: "Prazos de devolução próximos. Revise na tela de Condicional.",
        rota: "/condicional",
        icone: <AssignmentTurnedInRounded color="secondary" />,
      });
    }
    return itens;
  }, [
    carregando,
    caixaErro,
    caixaAberto,
    vendasPendentesHoje,
    produtosEstoqueBaixo,
    condicionaisVencendo,
  ]);

  const horaStr = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
  const dataExtenso = agora.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const saudacao = saudacaoPorHora(agora.getHours());
  const nome = nomeUsuario(usuario);

  const atalhos = [
    {
      titulo: "Nova Venda",
      subtitulo: "Abrir o ponto de venda",
      icone: <ShoppingCartRounded sx={{ fontSize: 44 }} />,
      corCirculo: isDark ? vexaColors.amareloNeon : "#14B8A6",
      corIcone: isDark ? vexaColors.preto : "#fff",
      rota: "/vendas",
    },
    {
      titulo: "Movimentação Caixa",
      subtitulo: "Registrar entrada ou saída",
      icone: <PointOfSaleRounded sx={{ fontSize: 44 }} />,
      corCirculo: "#8B5CF6",
      corIcone: "#fff",
      rota: "/caixa/nova-movimentacao",
    },
    {
      titulo: "Novo Cliente",
      subtitulo: "Cadastro rápido",
      icone: <PersonAddRounded sx={{ fontSize: 44 }} />,
      corCirculo: "#F59E0B",
      corIcone: "#fff",
      rota: "/clientes",
    },
    {
      titulo: "Estoque",
      subtitulo: "Consultar quantidades",
      icone: <Inventory2Rounded sx={{ fontSize: 44 }} />,
      corCirculo: "#3B82F6",
      corIcone: "#fff",
      rota: "/estoque",
    },
    {
      titulo: "Condicional",
      subtitulo: "Reservas e devoluções",
      icone: <AssignmentTurnedInRounded sx={{ fontSize: 44 }} />,
      corCirculo: "#EC4899",
      corIcone: "#fff",
      rota: "/condicional",
    },
    {
      titulo: "Relatórios",
      subtitulo: "Análises e exportações",
      icone: <DescriptionRounded sx={{ fontSize: 44 }} />,
      corCirculo: "#10B981",
      corIcone: "#fff",
      rota: "/relatorios",
    },
  ];

  const heroGradient = isDark
    ? "linear-gradient(135deg, rgba(248,243,43,0.08) 0%, transparent 60%)"
    : "linear-gradient(135deg, rgba(20,184,166,0.08) 0%, transparent 60%)";

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "background.default", minHeight: "100%" }}>
      <Stack spacing={3}>
        {/* Seção 1 — Hero */}
        <Card
          variant="outlined"
          elevation={0}
          sx={{
            ...cardSx,
            overflow: "hidden",
            "&:hover": {
              transform: "none",
              boxShadow: cardSx.boxShadow,
            },
          }}
        >
          <Box
            sx={{
              background: heroGradient,
              px: { xs: 2, md: 3 },
              py: { xs: 2.5, md: 3 },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: { xs: "1.5rem", md: "2rem" },
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "text.primary",
                  lineHeight: 1.15,
                }}
              >
                {saudacao}, {nome}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 1, textTransform: "capitalize" }}>
                {dataExtenso}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary", mt: 1.5 }}>
                {horaStr}
              </Typography>
            </Box>
            <Box sx={{ alignSelf: { xs: "stretch", sm: "center" } }}>
              {carregando ? (
                <Skeleton variant="rounded" width={160} height={32} sx={{ borderRadius: 999 }} />
              ) : caixaErro ? (
                <Chip label="Status indisponível" color="default" variant="outlined" sx={{ fontWeight: 600 }} />
              ) : caixaAberto ? (
                <Chip label="Caixa Aberto" color="success" sx={{ fontWeight: 700 }} />
              ) : (
                <Chip label="Caixa Fechado" sx={{ fontWeight: 700, bgcolor: "warning.main", color: "warning.contrastText" }} />
              )}
            </Box>
          </Box>
        </Card>

        {/* Seção 2 — Atalhos */}
        <Grid container spacing={2}>
          {atalhos.map((a) => (
            <Grid key={a.rota} size={{ xs: 6, sm: 4, md: 2 }}>
              <Card
                variant="outlined"
                elevation={0}
                onClick={() => navigate(a.rota)}
                sx={{
                  ...cardSx,
                  cursor: "pointer",
                  height: "100%",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: isDark ? "0 12px 28px rgba(0,0,0,0.35)" : "0 12px 28px rgba(0,0,0,0.12)",
                  },
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      bgcolor: a.corCirculo,
                      color: a.corIcone,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    {a.icone}
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary" }}>{a.titulo}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5, fontSize: "0.7rem" }}>
                    {a.subtitulo}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Seção 3 — Pendências + Resumo */}
        <Grid container spacing={2} alignItems="stretch">
          <Grid size={{ xs: 12, md: 8 }}>
            <Card variant="outlined" elevation={0} sx={{ ...cardSx, height: "100%" }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "text.primary" }}>
                  Pendências
                </Typography>
                {carregando ? (
                  <Stack spacing={1.5}>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} variant="rounded" height={72} sx={{ borderRadius: 2 }} />
                    ))}
                  </Stack>
                ) : pendencias.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 5 }}>
                    <CheckCircleRounded sx={{ fontSize: 64, color: "success.main", mb: 1 }} />
                    <Typography sx={{ fontWeight: 600, color: "text.primary" }}>Tudo em dia! 🎉</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {pendencias.map((p) => (
                      <Card
                        key={p.key}
                        variant="outlined"
                        elevation={0}
                        sx={{
                          borderRadius: 2,
                          borderColor: "divider",
                          bgcolor: "action.hover",
                        }}
                      >
                        <CardContent
                          sx={{
                            py: 1.5,
                            px: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            "&:last-child": { pb: 1.5 },
                          }}
                        >
                          <Box sx={{ flexShrink: 0 }}>{p.icone}</Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "text.primary" }}>
                              {p.titulo}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>
                              {p.descricao}
                            </Typography>
                          </Box>
                          <Button size="small" variant="contained" onClick={() => navigate(p.rota)} sx={{ flexShrink: 0, textTransform: "none" }}>
                            Ver
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" elevation={0} sx={{ ...cardSx, height: "100%" }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "text.primary" }}>
                  Resumo de Hoje
                </Typography>
                {carregando ? (
                  <Stack spacing={2}>
                    {[1, 2, 3].map((i) => (
                      <Box key={i}>
                        <Skeleton width="40%" height={14} />
                        <Skeleton width="70%" height={28} sx={{ mt: 0.5 }} />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Vendas Hoje
                      </Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 22, color: "text.primary", mt: 0.5 }}>
                        {vendasHoje.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Faturamento Hoje
                      </Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 22, color: "text.primary", mt: 0.5 }}>
                        {formatarMoeda(faturamentoHoje)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Entradas no Caixa
                      </Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 22, color: "text.primary", mt: 0.5 }}>
                        {formatarMoeda(entradasCaixaHoje)}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Seção 4 — Atividade */}
        <Card variant="outlined" elevation={0} sx={cardSx}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: "text.primary" }}>
              Atividade Recente
            </Typography>
            {carregando ? (
              <Stack spacing={1.5}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 2 }} />
                ))}
              </Stack>
            ) : atividadeRecente.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nenhuma venda registrada hoje.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {atividadeRecente.map((v) => {
                  const id = v.id ?? v.Id;
                  const nomeCliente =
                    v.cliente?.nomeCompleto ??
                    v.cliente?.nome ??
                    v.clienteNome ??
                    v.ClienteNome ??
                    v.nomeCliente ??
                    null;
                  const labelCliente = nomeCliente && String(nomeCliente).trim() ? nomeCliente : "Cliente avulso";
                  const inicial = (labelCliente.charAt(0) || "?").toUpperCase();
                  const valor = Number(v.valorTotal ?? v.ValorTotal ?? 0) || 0;
                  const dataRef = v.dataVenda ?? v.DataVenda ?? v.data;
                  const st = v.status ?? v.Status ?? "";
                  return (
                    <Box
                      key={id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 1,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        "&:last-of-type": { borderBottom: "none" },
                      }}
                    >
                      <Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700 }}>
                        {inicial}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 600, color: "text.primary" }} noWrap>
                          {labelCliente}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {formatarMoeda(valor)} • {tempoRelativo(dataRef)}
                        </Typography>
                      </Box>
                      <Chip size="small" label={labelStatusVenda(st)} variant="outlined" sx={{ flexShrink: 0 }} />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
