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

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [stats] = useState({
    faturamentoMes: 285000,
    vendasMes: 1247,
    novosClientes: 127,
    ticketMedio: 228,
  });

  const faturamentoMensal = {
    meses: [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ],
    valores: [175, 190, 210, 225, 235, 250, 265, 275, 285, 295, 290, 295],
  };

  const vendasPorCategoria = [
    { categoria: "Roupas", valor: 125000, percentual: 44, cor: "#14B8A6" },
    { categoria: "Calçados", valor: 98000, percentual: 34, cor: "#8B5CF6" },
    { categoria: "Acessórios", valor: 62000, percentual: 22, cor: "#EAB308" },
  ];

  const produtosMaisVendidos = [
    {
      label: "Tênis Esportivo",
      valor: 45000,
      percentual: 28,
      quantidade: 198,
      cor: "#14B8A6",
    },
    {
      label: "Jeans Premium",
      valor: 38000,
      percentual: 24,
      quantidade: 152,
      cor: "#8B5CF6",
    },
    {
      label: "Camiseta Básica",
      valor: 32000,
      percentual: 20,
      quantidade: 267,
      cor: "#3B82F6",
    },
    {
      label: "Bolsa Feminina",
      valor: 28000,
      percentual: 17,
      quantidade: 93,
      cor: "#EAB308",
    },
    {
      label: "Relógio Digital",
      valor: 18000,
      percentual: 11,
      quantidade: 72,
      cor: "#EF4444",
    },
  ];

  const topVendedores = [
    {
      nome: "Ana Paula Santos",
      vendas: "R$ 45.200",
      percentual: 88,
      meta: "R$ 50.000",
      cor: "#10B981",
    },
    {
      nome: "Carlos Oliveira",
      vendas: "R$ 38.500",
      percentual: 77,
      meta: "R$ 50.000",
      cor: "#14B8A6",
    },
    {
      nome: "Marina Costa",
      vendas: "R$ 32.100",
      percentual: 64,
      meta: "R$ 50.000",
      cor: "#F59E0B",
    },
  ];

  const estoqueCritico = [
    {
      produto: "Tênis Running Pro",
      estoque: 12,
      minimo: 50,
      status: "crítico",
    },
    { produto: "Jaqueta Jeans M", estoque: 23, minimo: 40, status: "baixo" },
    { produto: "Mochila Escolar", estoque: 8, minimo: 30, status: "crítico" },
    { produto: "Bota Couro 40", estoque: 15, minimo: 35, status: "baixo" },
  ];

  const formasPagamento = [
    { tipo: "Crédito", percentual: 45, cor: "#14B8A6" },
    { tipo: "Débito", percentual: 25, cor: "#8B5CF6" },
    { tipo: "Pix", percentual: 20, cor: "#3B82F6" },
    { tipo: "Dinheiro", percentual: 10, cor: "#EAB308" },
  ];

  const metasDoMes = [
    { meta: "Faturamento", atual: 285000, objetivo: 320000, percentual: 89 },
    { meta: "Vendas", atual: 1247, objetivo: 1500, percentual: 83 },
    { meta: "Novos Clientes", atual: 127, objetivo: 150, percentual: 85 },
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log("Dados do dashboard carregados");
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = [
    {
      title: "Faturamento do Mês",
      value: `R$ ${(stats.faturamentoMes / 1000).toFixed(3)}`,
      trend: "+15%",
      subtitle: "vs mês anterior",
      icon: <AttachMoney />,
      iconBg: "#FEF3C7",
      iconColor: "#F59E0B",
      borderColor: "#EAB308",
      trendData: [180, 190, 185, 195, 200, 210, 215, 220, 230, 240, 250, 285],
      trendColor: "#EAB308",
    },
    {
      title: "Total de Vendas",
      value: stats.vendasMes,
      trend: "+12%",
      subtitle: "vs mês anterior",
      icon: <ShoppingCart />,
      iconBg: "#CCFBF1",
      iconColor: "#14B8A6",
      borderColor: "#14B8A6",
      trendData: [
        980, 1020, 1050, 1080, 1100, 1130, 1150, 1180, 1200, 1220, 1235, 1247,
      ],
      trendColor: "#14B8A6",
    },
    {
      title: "Novos Clientes",
      value: stats.novosClientes,
      trend: "+23%",
      subtitle: "vs mês anterior",
      icon: <PeopleOutline />,
      iconBg: "#FEE2E2",
      iconColor: "#EF4444",
      borderColor: "#EF4444",
      trendData: [90, 95, 100, 105, 110, 115, 112, 118, 120, 122, 125, 127],
      trendColor: "#EF4444",
    },
    {
      title: "Ticket Médio",
      value: `R$ ${stats.ticketMedio}`,
      trend: "+8%",
      subtitle: "vs mês anterior",
      icon: <LocalOffer />,
      iconBg: "#E0E7FF",
      iconColor: "#6366F1",
      borderColor: "#6366F1",
      trendData: [195, 200, 205, 208, 210, 215, 218, 220, 222, 224, 226, 228],
      trendColor: "#6366F1",
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        bgcolor: "#F8FAFC",
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
              color: "#1E293B",
              mb: 0.5,
              fontSize: { xs: 20, sm: 24, md: 28 },
            }}
          >
            Dashboard
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#94A3B8", fontSize: { xs: 12, sm: 13, md: 14 } }}
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              bgcolor: "#FFFFFF",
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.7, sm: 1 },
              borderRadius: 2,
              border: "1px solid #E2E8F0",
            }}
          >
            <CalendarMonth
              sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: "#64748B" }}
            />
            <Typography
              variant="body2"
              sx={{
                color: "#475569",
                fontWeight: 500,
                fontSize: { xs: 11, sm: 12, md: 13 },
                display: { xs: "none", sm: "block" },
              }}
            >
              Este Mês
            </Typography>
          </Box>

          <IconButton
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              "&:hover": { bgcolor: "#F8FAFC" },
              width: { xs: 32, sm: 36, md: 40 },
              height: { xs: 32, sm: 36, md: 40 },
            }}
          >
            <Refresh
              sx={{ fontSize: { xs: 16, sm: 18, md: 20 }, color: "#64748B" }}
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
                bgcolor: "#FFFFFF",
                border: "1px solid #E2E8F0",
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
                    color: "#94A3B8",
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
                    color: "#1E293B",
                    mb: { xs: 0.8, md: 1.2 },
                    fontSize: { xs: 18, sm: 24, md: 28 },
                  }}
                >
                  {stat.value}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.4,
                    mb: { xs: 1, md: 1.5 },
                  }}
                >
                  <TrendingUp
                    sx={{
                      fontSize: { xs: 12, sm: 14, md: 16 },
                      color: "#10B981",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#10B981",
                      fontWeight: 600,
                      fontSize: { xs: 10, sm: 11, md: 13 },
                    }}
                  >
                    {stat.trend}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#94A3B8",
                      fontSize: { xs: 9, sm: 10, md: 12 },
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    {stat.subtitle}
                  </Typography>
                </Box>

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
                          (_, i) => i
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
            sx={{
              borderRadius: { xs: 2, md: 3 },
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
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
                    color: "#1E293B",
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
                          color: "#1E293B",
                          fontSize: { xs: 11, md: 12 },
                          fontWeight: 600,
                        }}
                      >
                        {item.meta}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748B",
                          fontSize: { xs: 9, md: 10 },
                        }}
                      >
                        {typeof item.atual === "number" && item.atual > 1000
                          ? `${(item.atual / 1000).toFixed(0)}K`
                          : `${item.atual}`}
                      </Typography>
                    </Box>

                    <Box sx={{ position: "relative" }}>
                      <LinearProgress
                        variant="determinate"
                        value={item.percentual}
                        sx={{
                          height: { xs: 10, md: 12 },
                          borderRadius: 1.5,
                          bgcolor: "#F1F5F9",
                          "& .MuiLinearProgress-bar": {
                            bgcolor:
                              item.percentual >= 90
                                ? "#10B981"
                                : item.percentual >= 70
                                ? "#14B8A6"
                                : "#F59E0B",
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
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
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
                    color: "#1E293B",
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
                      color: "#64748B",
                      fontSize: { xs: 10, md: 11 },
                      fontWeight: 500,
                    }}
                  >
                    2024
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
                        fill: "#94A3B8",
                        fontWeight: 500,
                      },
                    },
                  ]}
                  yAxis={[
                    {
                      min: 0,
                      max: 300,
                      tickLabelStyle: {
                        fontSize: isMobile ? 9 : 10,
                        fill: "#94A3B8",
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
                    "& .MuiChartsAxis-line": { stroke: "#E2E8F0" },
                    "& .MuiChartsAxis-tick": { stroke: "#E2E8F0" },
                    "& .MuiChartsGrid-line": { stroke: "#F1F5F9" },
                    "& .MuiLineElement-root": {
                      strokeWidth: isMobile ? 2 : 2.5,
                    },
                    "& .MuiMarkElement-root": {
                      scale: "0.6",
                      fill: "#FFFFFF",
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
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
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
                  color: "#1E293B",
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
                        fill: "#94A3B8",
                        fontWeight: 500,
                      },
                    },
                  ]}
                  yAxis={[
                    {
                      tickLabelStyle: {
                        fontSize: isMobile ? 9 : 10,
                        fill: "#94A3B8",
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
                    "& .MuiChartsAxis-line": { stroke: "#E2E8F0" },
                    "& .MuiChartsAxis-tick": { stroke: "#E2E8F0" },
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
                          color: "#64748B",
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
                        color: "#1E293B",
                        fontSize: { xs: 11, md: 13 },
                        fontWeight: 700,
                      }}
                    >
                      R$ {(item.valor / 1000).toFixed(0)}K ({item.percentual}%)
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
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
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
                    color: "#1E293B",
                    fontSize: { xs: 14, sm: 15, md: 16 },
                  }}
                >
                  Produtos Mais Vendidos
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#94A3B8", fontSize: { xs: 10, md: 11 } }}
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
                  <PieChart
                    series={[
                      {
                        data: produtosMaisVendidos.map((item) => ({
                          value: item.percentual,
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
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1.5, md: 2 },
                }}
              >
                {produtosMaisVendidos.map((item, index) => (
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
                            color: "#475569",
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
                          color: "#1E293B",
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
                          bgcolor: "#F1F5F9",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: item.cor,
                            borderRadius: 1,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748B",
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
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
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
                    color: "#1E293B",
                    fontSize: { xs: 14, sm: 15, md: 16 },
                  }}
                >
                  Estoque Crítico
                </Typography>
                <Chip
                  icon={<Inventory sx={{ fontSize: { xs: 12, md: 14 } }} />}
                  label={estoqueCritico.length}
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
                          color: "#1E293B",
                          fontSize: { xs: 12, md: 13 },
                          fontWeight: 600,
                        }}
                      >
                        {item.produto}
                      </Typography>
                      <Chip
                        label={item.status === "crítico" ? "CRÍTICO" : "BAIXO"}
                        size="small"
                        sx={{
                          bgcolor:
                            item.status === "crítico" ? "#FEE2E2" : "#FEF3C7",
                          color:
                            item.status === "crítico" ? "#DC2626" : "#D97706",
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
                        sx={{ color: "#64748B", fontSize: { xs: 10, md: 11 } }}
                      >
                        Atual: {item.estoque} un.
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#94A3B8", fontSize: { xs: 10, md: 11 } }}
                      >
                        Mín: {item.minimo} un.
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={(item.estoque / item.minimo) * 100}
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
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
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
                    color: "#1E293B",
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
                            color: "#1E293B",
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
                            color: "#94A3B8",
                            fontSize: { xs: 10, md: 11 },
                          }}
                        >
                          Meta: {item.meta}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#1E293B",
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
                          bgcolor: "#F1F5F9",
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
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
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
                    color: "#1E293B",
                    fontSize: { xs: 14, sm: 15, md: 16 },
                  }}
                >
                  Formas de Pagamento
                </Typography>
                <CreditCard
                  sx={{ fontSize: { xs: 16, md: 18 }, color: "#64748B" }}
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
                          color: "#475569",
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
                        color: "#1E293B",
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
    </Box>
  );
}

export default Dashboard;
