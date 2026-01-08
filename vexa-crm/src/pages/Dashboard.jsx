// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Button,
} from "@mui/material";
import {
  Description,
  Send,
  Assignment,
  PostAdd,
  Inventory2Outlined,
  TrendingUp,
  LocalShippingOutlined,
  PeopleOutlineRounded,
  MoreVert,
  ArrowUpward,
  Storefront,
  AttachMoney,
  CheckCircle,
} from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

function Dashboard() {
  const [stats] = useState({
    vendasHoje: 127,
    receitaDiaria: 8450,
    pedidosPendentes: 23,
    clientesAtivos: 342,
    pedidosEntregues: 89,
    estoqueBaixo: 12,
  });

  const vendasMensais = {
    meses: ["Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    vendas: [245, 312, 289, 367, 423, 398],
    meta: [280, 280, 300, 340, 380, 380],
  };

  const vendasSemanais = {
    dias: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    vendas: [45, 52, 48, 67, 89, 134, 98],
  };

  const [ultimosPedidos] = useState([
    {
      id: "#12845",
      cliente: "Maria Silva",
      produto: "Vestido Floral",
      valor: 189.9,
      status: "Enviado",
    },
    {
      id: "#12844",
      cliente: "João Santos",
      produto: "Calça Jeans",
      valor: 159.9,
      status: "Processando",
    },
    {
      id: "#12843",
      cliente: "Ana Costa",
      produto: "Camiseta + Calça",
      valor: 249.8,
      status: "Entregue",
    },
  ]);

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
      title: "Total de Vendas",
      value: stats.vendasHoje,
      trend: "+16.4%",
      trendUp: true,
      icon: <Storefront />,
      color: "#6366F1",
      bgColor: "#EEF2FF",
    },
    {
      title: "Receita Diária",
      value: `R$ ${stats.receitaDiaria.toLocaleString("pt-BR")}`,
      trend: "+4.8%",
      trendUp: true,
      icon: <AttachMoney />,
      color: "#10B981",
      bgColor: "#ECFDF5",
    },
    {
      title: "Pedidos Pendentes",
      value: stats.pedidosPendentes,
      trend: "+12.8%",
      trendUp: true,
      icon: <LocalShippingOutlined />,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
    {
      title: "Clientes Ativos",
      value: stats.clientesAtivos,
      trend: "+8.2%",
      trendUp: true,
      icon: <PeopleOutlineRounded />,
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
    },
    {
      title: "Pedidos Entregues",
      value: stats.pedidosEntregues,
      trend: "+15.3%",
      trendUp: true,
      icon: <CheckCircle />,
      color: "#06B6D4",
      bgColor: "#ECFEFF",
    },
    {
      title: "Estoque Baixo",
      value: stats.estoqueBaixo,
      trend: "-3.1%",
      trendUp: false,
      icon: <Inventory2Outlined />,
      color: "#EF4444",
      bgColor: "#FEF2F2",
    },
  ];

  const quickActions = [
    {
      label: "Novo Pedido",
      icon: <Description />,
      color: "#6366F1",
      bgColor: "#EEF2FF",
    },
    {
      label: "Enviar Nota",
      icon: <Send />,
      color: "#06B6D4",
      bgColor: "#ECFEFF",
    },
    {
      label: "Criar Contrato",
      icon: <Assignment />,
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
    },
    {
      label: "Adicionar Produto",
      icon: <PostAdd />,
      color: "#10B981",
      bgColor: "#ECFDF5",
    },
    {
      label: "Controle Estoque",
      icon: <Inventory2Outlined />,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
    {
      label: "Relatório Vendas",
      icon: <TrendingUp />,
      color: "#EF4444",
      bgColor: "#FEF2F2",
    },
  ];

  const getStatusConfig = (status) => {
    switch (status) {
      case "Entregue":
        return { color: "#10B981", bg: "#ECFDF5", text: "#065F46" };
      case "Enviado":
        return { color: "#3B82F6", bg: "#EFF6FF", text: "#1E40AF" };
      case "Processando":
        return { color: "#F59E0B", bg: "#FEF3C7", text: "#92400E" };
      default:
        return { color: "#6B7280", bg: "#F3F4F6", text: "#374151" };
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 64px)", // Desconta a altura do navbar
        bgcolor: "#F8FAFC",
        p: 2.5,
        pb: 3, // Padding bottom maior para não cortar
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 1.8, flexShrink: 0 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#0F172A",
            mb: 0.3,
            letterSpacing: "-0.02em",
          }}
        >
          Olá, Rafael 👋
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#64748B",
            fontSize: 13,
            fontWeight: 400,
          }}
        >
          Aqui está um resumo das suas vendas hoje
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 2, flexShrink: 0 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={2} key={index}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2.5,
                bgcolor: "#FFFFFF",
                border: "1px solid #F1F5F9",
                transition: "all 0.3s ease",
                height: "100%",
                "&:hover": {
                  boxShadow: "0 8px 20px -4px rgba(0,0,0,0.1)",
                  transform: "translateY(-2px)",
                  borderColor: stat.color,
                },
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      bgcolor: stat.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {React.cloneElement(stat.icon, {
                      sx: { fontSize: 22, color: stat.color },
                    })}
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.4,
                      bgcolor: stat.trendUp ? "#ECFDF5" : "#FEF2F2",
                      px: 0.9,
                      py: 0.3,
                      borderRadius: 1.5,
                    }}
                  >
                    <ArrowUpward
                      sx={{
                        fontSize: 11,
                        color: stat.trendUp ? "#10B981" : "#EF4444",
                        transform: stat.trendUp ? "none" : "rotate(180deg)",
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: stat.trendUp ? "#10B981" : "#EF4444",
                        fontWeight: 700,
                        fontSize: 10,
                      }}
                    >
                      {stat.trend}
                    </Typography>
                  </Box>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748B",
                    fontWeight: 600,
                    display: "block",
                    mb: 0.8,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {stat.title}
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "#0F172A",
                    letterSpacing: "-0.02em",
                    fontSize: 22,
                  }}
                >
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "hidden" }}>
        <Grid container spacing={2} sx={{ height: "100%" }}>
          {/* Left Column - Chart */}
          <Grid item xs={5} sx={{ height: "100%", minHeight: 0 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2.5,
                bgcolor: "#FFFFFF",
                border: "1px solid #F1F5F9",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent
                sx={{
                  p: 2.5,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    flexShrink: 0,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#0F172A",
                        fontSize: 16,
                        mb: 0.3,
                      }}
                    >
                      Faturamento Mensal
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748B", fontSize: 12 }}
                    >
                      Últimos 6 meses de performance
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.7 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: "#6366F1",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748B",
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        Realizado
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.7 }}
                    >
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: "#E2E8F0",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#64748B",
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        Meta
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}>
                  <LineChart
                    xAxis={[
                      {
                        scaleType: "point",
                        data: vendasMensais.meses,
                        tickLabelStyle: {
                          fontSize: 11,
                          fill: "#64748B",
                          fontWeight: 500,
                        },
                      },
                    ]}
                    yAxis={[
                      {
                        tickLabelStyle: {
                          fontSize: 11,
                          fill: "#64748B",
                          fontWeight: 500,
                        },
                      },
                    ]}
                    series={[
                      {
                        data: vendasMensais.vendas,
                        color: "#6366F1",
                        showMark: true,
                        curve: "catmullRom",
                        area: true,
                      },
                      {
                        data: vendasMensais.meta,
                        color: "#E2E8F0",
                        showMark: false,
                        curve: "catmullRom",
                        area: false,
                      },
                    ]}
                    height={340}
                    margin={{ left: 50, right: 20, top: 10, bottom: 35 }}
                    sx={{
                      "& .MuiChartsAxis-line": {
                        stroke: "#E2E8F0",
                      },
                      "& .MuiChartsAxis-tick": {
                        stroke: "#E2E8F0",
                      },
                      "& .MuiLineElement-root": {
                        strokeWidth: 2.5,
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Middle Column - Actions + Weekly Chart */}
          <Grid item xs={3.5} sx={{ height: "100%", minHeight: 0 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
              }}
            >
              {/* Quick Actions */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #F1F5F9",
                  flexShrink: 0,
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "#0F172A",
                      fontSize: 15,
                      mb: 2,
                    }}
                  >
                    Ações Rápidas
                  </Typography>

                  <Grid container spacing={1.5}>
                    {quickActions.map((action, index) => (
                      <Grid item xs={6} key={index}>
                        <Button
                          fullWidth
                          sx={{
                            borderRadius: 2,
                            bgcolor: "#FFFFFF",
                            border: "1.5px solid #F1F5F9",
                            p: 1.8,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                            textTransform: "none",
                            transition: "all 0.2s ease",
                            minHeight: 90,
                            "&:hover": {
                              bgcolor: action.bgColor,
                              borderColor: action.color,
                              transform: "translateY(-2px)",
                              boxShadow: "0 6px 12px -2px rgba(0,0,0,0.1)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1.8,
                              bgcolor: action.bgColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {React.cloneElement(action.icon, {
                              sx: { fontSize: 20, color: action.color },
                            })}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#0F172A",
                              fontWeight: 600,
                              textAlign: "center",
                              fontSize: 11,
                              lineHeight: 1.3,
                            }}
                          >
                            {action.label}
                          </Typography>
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* Weekly Sales Chart */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  bgcolor: "#FFFFFF",
                  border: "1px solid #F1F5F9",
                  flexGrow: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent
                  sx={{
                    p: 2,
                    flexGrow: 1,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                  }}
                >
                  <Box sx={{ mb: 1.5, flexShrink: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#0F172A",
                        fontSize: 15,
                        mb: 0.3,
                      }}
                    >
                      Vendas Semanais
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748B", fontSize: 11 }}
                    >
                      Performance da última semana
                    </Typography>
                  </Box>

                  <Box sx={{ flexGrow: 1, minHeight: 0, width: "100%" }}>
                    <BarChart
                      xAxis={[
                        {
                          scaleType: "band",
                          data: vendasSemanais.dias,
                          tickLabelStyle: {
                            fontSize: 10,
                            fill: "#64748B",
                            fontWeight: 500,
                          },
                        },
                      ]}
                      yAxis={[
                        {
                          tickLabelStyle: {
                            fontSize: 10,
                            fill: "#64748B",
                            fontWeight: 500,
                          },
                        },
                      ]}
                      series={[
                        {
                          data: vendasSemanais.vendas,
                          color: "#10B981",
                        },
                      ]}
                      height={180}
                      margin={{ left: 40, right: 15, top: 10, bottom: 30 }}
                      sx={{
                        "& .MuiChartsAxis-line": {
                          stroke: "#E2E8F0",
                        },
                        "& .MuiChartsAxis-tick": {
                          stroke: "#E2E8F0",
                        },
                        "& .MuiBarElement-root": {
                          rx: 5,
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Right Column - Recent Orders */}
          <Grid item xs={3.5} sx={{ height: "100%", minHeight: 0 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2.5,
                bgcolor: "#FFFFFF",
                border: "1px solid #F1F5F9",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent
                sx={{
                  p: 2.5,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2.5,
                    flexShrink: 0,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#0F172A",
                        fontSize: 16,
                        mb: 0.3,
                      }}
                    >
                      Pedidos Recentes
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "#64748B", fontSize: 12 }}
                    >
                      {ultimosPedidos.length} pedidos hoje
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "#F8FAFC",
                      "&:hover": { bgcolor: "#F1F5F9" },
                    }}
                  >
                    <MoreVert sx={{ fontSize: 18, color: "#64748B" }} />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    flexGrow: 1,
                    overflow: "auto",
                    minHeight: 0,
                    pr: 0.5,
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      bgcolor: "#F8FAFC",
                      borderRadius: "10px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      bgcolor: "#CBD5E1",
                      borderRadius: "10px",
                      "&:hover": {
                        bgcolor: "#94A3B8",
                      },
                    },
                  }}
                >
                  {ultimosPedidos.map((pedido) => {
                    const statusConfig = getStatusConfig(pedido.status);
                    return (
                      <Box
                        key={pedido.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "#F8FAFC",
                          border: "1px solid #F1F5F9",
                          transition: "all 0.2s ease",
                          flexShrink: 0,
                          "&:hover": {
                            bgcolor: "#FFFFFF",
                            boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)",
                            transform: "translateX(4px)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 1.5,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: "#0F172A",
                                fontSize: 13,
                                mb: 0.3,
                              }}
                            >
                              {pedido.id}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#64748B",
                                fontSize: 12,
                              }}
                            >
                              {pedido.cliente}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1.5,
                              bgcolor: statusConfig.bg,
                              border: `1px solid ${statusConfig.color}20`,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: statusConfig.text,
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            >
                              {pedido.status}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#64748B",
                              fontSize: 12,
                            }}
                          >
                            {pedido.produto}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: "#10B981",
                              fontSize: 14,
                            }}
                          >
                            R$ {pedido.valor.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    borderColor: "#E2E8F0",
                    color: "#64748B",
                    textTransform: "none",
                    fontWeight: 600,
                    py: 1,
                    flexShrink: 0,
                    "&:hover": {
                      borderColor: "#6366F1",
                      color: "#6366F1",
                      bgcolor: "#EEF2FF",
                    },
                  }}
                >
                  Ver Todos os Pedidos
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;
