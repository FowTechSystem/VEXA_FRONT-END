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
} from "@mui/material";
import {
  TrendingUp,
  PeopleOutline,
  CalendarToday,
  AttachMoney,
  Refresh,
  CalendarMonth,
} from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";

function Dashboard() {
  const [stats] = useState({
    faturamentoMes: 285000,
    taxaConversao: 42,
    novosPacientes: 127,
    ocupacaoAgenda: 85,
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

  const funilConversao = [
    { label: "Leads", valor: 450, cor: "#14B8A6", percentual: 82 },
    { label: "Qualificados", valor: 280, cor: "#10B981", percentual: 68 },
    { label: "Agendados", valor: 189, cor: "#3B82F6", percentual: 83 },
    { label: "Atendidos", valor: 156, cor: "#8B5CF6", percentual: 63 },
    { label: "Fidelizados", valor: 98, cor: "#EAB308", percentual: 63 },
  ];

  const topProcedimentos = [
    { label: "Botox", valor: 45000, percentual: 28, cor: "#14B8A6" },
    { label: "Preenchimento", valor: 38000, percentual: 22, cor: "#8B5CF6" },
    { label: "Harmonização", valor: 55000, percentual: 31, cor: "#EAB308" },
    { label: "Limpeza de Pele", valor: 22000, percentual: 13, cor: "#3B82F6" },
    { label: "Peeling", valor: 15000, percentual: 9, cor: "#EF4444" },
  ];

  const ocupacaoAgenda = [
    {
      nome: "Dra. Ana Silva",
      slots: "8/10 slots",
      percentual: 80,
      cor: "#8B5CF6",
    },
    {
      nome: "Dr. Carlos Oliveira",
      slots: "7/8 slots",
      percentual: 88,
      cor: "#8B5CF6",
    },
    {
      nome: "Dra. Marina Costa",
      slots: "6/10 slots",
      percentual: 60,
      cor: "#F59E0B",
    },
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
      title: "Taxa de Conversão",
      value: `${stats.taxaConversao}%`,
      trend: "+5%",
      subtitle: "vs mês anterior",
      icon: <TrendingUp />,
      iconBg: "#CCFBF1",
      iconColor: "#14B8A6",
      borderColor: "#14B8A6",
      trendData: [35, 37, 36, 38, 39, 40, 38, 39, 41, 40, 41, 42],
      trendColor: "#14B8A6",
    },
    {
      title: "Novos Pacientes",
      value: stats.novosPacientes,
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
      title: "Ocupação da Agenda",
      value: `${stats.ocupacaoAgenda}%`,
      trend: "+8%",
      subtitle: "vs mês anterior",
      icon: <CalendarToday />,
      iconBg: "#D1FAE5",
      iconColor: "#10B981",
      borderColor: "#10B981",
      trendData: [70, 72, 75, 76, 78, 80, 79, 81, 82, 83, 84, 85],
      trendColor: "#10B981",
    },
  ];

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100vw",
        minHeight: "100vh",
        bgcolor: "#F8FAFC",
        py: 2.5,
        px: 2.5,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#1E293B", mb: 0.5 }}
          >
            Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#94A3B8", fontSize: 14 }}>
            Visão geral do seu negócio
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              bgcolor: "#FFFFFF",
              px: 2,
              py: 1,
              borderRadius: 2,
              border: "1px solid #E2E8F0",
            }}
          >
            <CalendarMonth sx={{ fontSize: 20, color: "#64748B" }} />
            <Typography
              variant="body2"
              sx={{ color: "#475569", fontWeight: 500 }}
            >
              Este Mês
            </Typography>
          </Box>

          <IconButton
            sx={{
              bgcolor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              "&:hover": { bgcolor: "#F8FAFC" },
            }}
          >
            <Refresh sx={{ fontSize: 20, color: "#64748B" }} />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                bgcolor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderTop: `4px solid ${stat.borderColor}`,
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: stat.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {React.cloneElement(stat.icon, {
                      sx: { fontSize: 24, color: stat.iconColor },
                    })}
                  </Box>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: "#94A3B8",
                    fontWeight: 500,
                    display: "block",
                    mb: 1,
                    fontSize: 13,
                  }}
                >
                  {stat.title}
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#1E293B",
                    mb: 1.5,
                    fontSize: 32,
                  }}
                >
                  {stat.value}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mb: 2,
                  }}
                >
                  <TrendingUp sx={{ fontSize: 16, color: "#10B981" }} />
                  <Typography
                    variant="caption"
                    sx={{ color: "#10B981", fontWeight: 600, fontSize: 13 }}
                  >
                    {stat.trend}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "#94A3B8", fontSize: 13 }}
                  >
                    {stat.subtitle}
                  </Typography>
                </Box>

                <Box sx={{ width: "100%", height: 40, mt: 1 }}>
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
                    height={40}
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
      </Grid>

      {/* Conteúdo principal: 2 colunas (50/50) com 2 cards empilhados */}
      <Grid container spacing={2}>
        {/* Coluna esquerda */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            {/* Faturamento Mensal */}
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "#1E293B", fontSize: 18 }}
                    >
                      Faturamento Mensal
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: "#14B8A6",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748B", fontSize: 13, fontWeight: 500 }}
                      >
                        2024
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ width: "100%", height: 350 }}>
                    <LineChart
                      xAxis={[
                        {
                          scaleType: "point",
                          data: faturamentoMensal.meses,
                          tickLabelStyle: {
                            fontSize: 12,
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
                            fontSize: 12,
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
                          showMark: true,
                          curve: "catmullRom",
                          label: "Faturamento",
                        },
                      ]}
                      height={350}
                      margin={{ left: 60, right: 30, top: 20, bottom: 40 }}
                      grid={{ horizontal: true }}
                      sx={{
                        "& .MuiChartsAxis-line": { stroke: "#E2E8F0" },
                        "& .MuiChartsAxis-tick": { stroke: "#E2E8F0" },
                        "& .MuiChartsGrid-line": { stroke: "#F1F5F9" },
                        "& .MuiLineElement-root": { strokeWidth: 3 },
                        "& .MuiMarkElement-root": {
                          scale: "0.8",
                          fill: "#FFFFFF",
                          strokeWidth: 2,
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Funil de Conversão */}
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "#1E293B", fontSize: 18 }}
                    >
                      Funil de Conversão
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: "#D1FAE5",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#059669", fontWeight: 700, fontSize: 12 }}
                      >
                        Taxa: 22%
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
                  >
                    {funilConversao.map((item, index) => (
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
                              color: "#64748B",
                              fontSize: 13,
                              fontWeight: 500,
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#1E293B",
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {item.valor}
                          </Typography>
                        </Box>

                        <Box sx={{ position: "relative" }}>
                          <LinearProgress
                            variant="determinate"
                            value={item.percentual}
                            sx={{
                              height: 32,
                              borderRadius: 1.5,
                              bgcolor: "#F1F5F9",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: item.cor,
                                borderRadius: 1.5,
                              },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              position: "absolute",
                              right: 12,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#FFFFFF",
                              fontWeight: 700,
                              fontSize: 11,
                            }}
                          >
                            +{item.percentual}%
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Coluna direita */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2}>
            {/* Top Procedimentos */}
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "#1E293B", fontSize: 18 }}
                    >
                      Top Procedimentos
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#94A3B8", fontSize: 13 }}
                    >
                      Este mês
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {/* Donut Chart (SEM LEGENDA - evita duplicar) */}
                    <Box sx={{ width: 220, height: 220, flexShrink: 0 }}>
                      <PieChart
                        series={[
                          {
                            data: topProcedimentos.map((item) => ({
                              value: item.percentual,
                              label: item.label,
                              color: item.cor,
                            })),
                            innerRadius: 70,
                            outerRadius: 105,
                          },
                        ]}
                        height={220}
                        width={220}
                        slotProps={{
                          legend: { hidden: true },
                        }}
                        sx={{
                          "& .MuiChartsLegend-root": { display: "none" },
                        }}
                      />
                    </Box>

                    {/* Lista customizada */}
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                      }}
                    >
                      {topProcedimentos.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                bgcolor: item.cor,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#475569",
                                fontSize: 14,
                                fontWeight: 500,
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#1E293B",
                                fontSize: 15,
                                fontWeight: 700,
                              }}
                            >
                              R$ {(item.valor / 1000).toFixed(3)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "#94A3B8", fontSize: 13 }}
                            >
                              {item.percentual}%
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Ocupação da Agenda */}
            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "#1E293B", fontSize: 18 }}
                    >
                      Ocupação da Agenda
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#14B8A6",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Hoje
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      py: 2,
                    }}
                  >
                    {ocupacaoAgenda.map((item, index) => (
                      <Box key={index}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#1E293B",
                              fontSize: 15,
                              fontWeight: 600,
                            }}
                          >
                            {item.nome}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#94A3B8", fontSize: 13 }}
                          >
                            {item.slots}
                          </Typography>
                        </Box>

                        <Box sx={{ position: "relative" }}>
                          <LinearProgress
                            variant="determinate"
                            value={item.percentual}
                            sx={{
                              height: 14,
                              borderRadius: 2.5,
                              bgcolor: "#F1F5F9",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: item.cor,
                                borderRadius: 2.5,
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
                              fontSize: 11,
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
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
