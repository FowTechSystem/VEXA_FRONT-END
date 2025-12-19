// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
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
  MoreHoriz,
} from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

function Dashboard() {
  const [stats] = useState({
    vendasHoje: 127,
    receitaDiaria: 8450,
    pedidosPendentes: 23,
    clientesAtivos: 342,
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
      title: "Total de vendas",
      value: stats.vendasHoje,
      trend: "+16.4%",
      trendUp: true,
      icon: <Description />,
    },
    {
      title: "Receita diária",
      value: `R$ ${stats.receitaDiaria.toLocaleString("pt-BR")}`,
      trend: "-4.8%",
      trendUp: false,
      icon: <TrendingUp />,
    },
    {
      title: "Pedidos pendentes",
      value: stats.pedidosPendentes,
      trend: "+12.8%",
      trendUp: true,
      icon: <LocalShippingOutlined />,
    },
    {
      title: "Clientes ativos",
      value: stats.clientesAtivos,
      trend: "+8.2%",
      trendUp: true,
      icon: <PeopleOutlineRounded />,
    },
  ];

  const quickActions = [
    {
      label: "Novo pedido",
      icon: <Description sx={{ fontSize: 28 }} />,
      color: "#8B7355",
    },
    {
      label: "Enviar nota",
      icon: <Send sx={{ fontSize: 28 }} />,
      color: "#6B9BD1",
    },
    {
      label: "Criar contrato",
      icon: <Assignment sx={{ fontSize: 28 }} />,
      color: "#D4A574",
    },
    {
      label: "Adicionar produto",
      icon: <PostAdd sx={{ fontSize: 28 }} />,
      color: "#B8937A",
    },
    {
      label: "Controle estoque",
      icon: <Inventory2Outlined sx={{ fontSize: 28 }} />,
      color: "#A0826D",
    },
    {
      label: "Relatório vendas",
      icon: <TrendingUp sx={{ fontSize: 28 }} />,
      color: "#8FA998",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Entregue":
        return "success";
      case "Enviado":
        return "info";
      case "Processando":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 64px)",
        bgcolor: "#FAF8F5",
        p: 2.5,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header + Stats Cards in same row */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Header */}
          <Grid item xs={2.5}>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: "#2D2D2D",
                  mb: 0.3,
                }}
              >
                Olá, Rafael
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#8B8B8B", fontSize: 12, fontWeight: 400 }}
              >
                O que você está fazendo hoje?
              </Typography>
            </Box>
          </Grid>

          {/* Stats Cards */}
          {statCards.map((stat, index) => (
            <Grid item xs={2.375} key={index}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  bgcolor: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  transition: "all 0.2s ease",
                  height: "100%",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    transform: "translateY(-2px)",
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
                        width: 38,
                        height: 38,
                        borderRadius: 1.5,
                        bgcolor: "#F5F5F5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {React.cloneElement(stat.icon, {
                        sx: { fontSize: 20, color: "#8B8B8B" },
                      })}
                    </Box>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "#8B8B8B",
                      fontWeight: 500,
                      display: "block",
                      mb: 0.6,
                      fontSize: 11,
                      textTransform: "capitalize",
                    }}
                  >
                    {stat.title}
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 600,
                        color: "#2D2D2D",
                      }}
                    >
                      {stat.value}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: stat.trendUp ? "#34A853" : "#EA4335",
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    >
                      {stat.trend}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <Grid container spacing={2} sx={{ height: "100%" }}>
          {/* Left Column: Main Chart */}
          <Grid item xs={6.5} sx={{ height: "100%" }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 2.5,
                bgcolor: "#FFFFFF",
                border: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
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
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#2D2D2D", fontSize: 16 }}
                  >
                    Faturamento ao longo do tempo
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.7 }}
                    >
                      <Box
                        sx={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          bgcolor: "#93C5FD",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "#8B8B8B", fontSize: 11 }}
                      >
                        Realizável
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.7 }}
                    >
                      <Box
                        sx={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          bgcolor: "#E5E7EB",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "#8B8B8B", fontSize: 11 }}
                      >
                        Não realizável
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                  <LineChart
                    xAxis={[
                      {
                        scaleType: "point",
                        data: vendasMensais.meses,
                        tickLabelStyle: {
                          fontSize: 10,
                          fill: "#8B8B8B",
                        },
                      },
                    ]}
                    yAxis={[
                      {
                        tickLabelStyle: {
                          fontSize: 10,
                          fill: "#8B8B8B",
                        },
                      },
                    ]}
                    series={[
                      {
                        data: vendasMensais.vendas,
                        color: "#93C5FD",
                        showMark: false,
                        curve: "natural",
                        area: true,
                      },
                      {
                        data: vendasMensais.meta,
                        color: "#E5E7EB",
                        showMark: false,
                        curve: "natural",
                        area: true,
                      },
                    ]}
                    height={450}
                    margin={{ left: 45, right: 12, top: 12, bottom: 32 }}
                    sx={{
                      "& .MuiChartsAxis-line": {
                        stroke: "#E5E7EB",
                      },
                      "& .MuiChartsAxis-tick": {
                        stroke: "#E5E7EB",
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Quick Actions + Weekly Chart + Orders */}
          <Grid item xs={5.5} sx={{ height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
              }}
            >
              {/* Quick Actions */}
              <Grid container spacing={1.5}>
                {quickActions.map((action, index) => (
                  <Grid item xs={4} key={index}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 2.5,
                        bgcolor: "#FFFFFF",
                        border: "none",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          p: 1.8,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: 85,
                        }}
                      >
                        <Box
                          sx={{
                            color: action.color,
                            mb: 0.8,
                          }}
                        >
                          {action.icon}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#2D2D2D",
                            fontWeight: 500,
                            textAlign: "center",
                            fontSize: 10.5,
                            lineHeight: 1.3,
                          }}
                        >
                          {action.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Weekly Chart */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  bgcolor: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  flexGrow: 1,
                  minHeight: 0,
                }}
              >
                <CardContent
                  sx={{
                    p: 2.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#2D2D2D",
                      mb: 1.5,
                      fontSize: 14,
                    }}
                  >
                    Vendas Semanais
                  </Typography>
                  <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                    <BarChart
                      xAxis={[
                        {
                          scaleType: "band",
                          data: vendasSemanais.dias,
                          tickLabelStyle: {
                            fontSize: 9,
                            fill: "#8B8B8B",
                          },
                        },
                      ]}
                      yAxis={[
                        {
                          tickLabelStyle: {
                            fontSize: 9,
                            fill: "#8B8B8B",
                          },
                        },
                      ]}
                      series={[
                        {
                          data: vendasSemanais.vendas,
                          color: "#C5B8A5",
                        },
                      ]}
                      height={160}
                      margin={{ left: 35, right: 8, top: 8, bottom: 25 }}
                      sx={{
                        "& .MuiChartsAxis-line": {
                          stroke: "#E5E7EB",
                        },
                        "& .MuiChartsAxis-tick": {
                          stroke: "#E5E7EB",
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2.5,
                  bgcolor: "#FFFFFF",
                  border: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  flexGrow: 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <CardContent
                  sx={{
                    p: 2.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: "#2D2D2D",
                        fontSize: 14,
                      }}
                    >
                      Pedidos Recentes
                    </Typography>
                    <IconButton size="small">
                      <MoreHoriz sx={{ fontSize: 18, color: "#8B8B8B" }} />
                    </IconButton>
                  </Box>

                  <TableContainer sx={{ flexGrow: 1, overflow: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              fontSize: 9,
                              color: "#8B8B8B",
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                              border: "none",
                              pb: 1,
                              px: 0.8,
                            }}
                          >
                            Pedido
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              fontSize: 9,
                              color: "#8B8B8B",
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                              border: "none",
                              pb: 1,
                              px: 0.8,
                            }}
                          >
                            Cliente
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              fontSize: 9,
                              color: "#8B8B8B",
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                              border: "none",
                              pb: 1,
                              px: 0.8,
                            }}
                          >
                            Valor
                          </TableCell>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              fontSize: 9,
                              color: "#8B8B8B",
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                              border: "none",
                              pb: 1,
                              px: 0.8,
                            }}
                          >
                            Status
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ultimosPedidos.map((pedido) => (
                          <TableRow
                            key={pedido.id}
                            sx={{
                              "&:hover": { bgcolor: "#FAFAFA" },
                            }}
                          >
                            <TableCell
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#2D2D2D",
                                border: "none",
                                py: 1.3,
                                px: 0.8,
                              }}
                            >
                              {pedido.id}
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: 11,
                                color: "#8B8B8B",
                                border: "none",
                                py: 1.3,
                                px: 0.8,
                              }}
                            >
                              {pedido.cliente}
                            </TableCell>
                            <TableCell
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#2D2D2D",
                                border: "none",
                                py: 1.3,
                                px: 0.8,
                              }}
                            >
                              R$ {pedido.valor.toFixed(2)}
                            </TableCell>
                            <TableCell
                              sx={{ border: "none", py: 1.3, px: 0.8 }}
                            >
                              <Chip
                                label={pedido.status}
                                color={getStatusColor(pedido.status)}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: 9,
                                  height: 20,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default Dashboard;
