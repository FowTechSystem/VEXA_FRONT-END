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
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  ShoppingCart,
  TrendingUp,
  Inventory,
  AttachMoney,
  LocalShipping,
  TrendingDown,
} from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";

function Dashboard() {
  const [stats] = useState({
    vendasHoje: 127,
    receitaDiaria: 8450,
    pedidosPendentes: 23,
    estoqueTotal: 1847,
  });

  const vendasMensais = {
    meses: ["Jul", "Ago", "Set", "Out", "Nov", "Dez"],
    vendas: [245, 312, 289, 367, 423, 398],
    meta: [300, 300, 300, 350, 400, 400],
  };

  const vendasPorCategoria = [
    { id: 0, value: 35, label: "Camisetas", color: "#4285F4" },
    { id: 1, value: 25, label: "Calças", color: "#EA4335" },
    { id: 2, value: 20, label: "Vestidos", color: "#FBBC04" },
    { id: 3, value: 12, label: "Acessórios", color: "#34A853" },
    { id: 4, value: 8, label: "Calçados", color: "#9C27B0" },
  ];

  const [produtosMaisVendidos] = useState([
    {
      nome: "Camiseta Básica Branca",
      vendas: 156,
      estoque: 89,
      variacao: "+12%",
    },
    { nome: "Calça Jeans Skinny", vendas: 134, estoque: 45, variacao: "+8%" },
    { nome: "Vestido Floral Verão", vendas: 98, estoque: 23, variacao: "+25%" },
  ]);

  const vendasSemanais = {
    dias: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    vendas: [45, 52, 48, 67, 89, 134, 98],
  };

  const [ultimosPedidos] = useState([
    {
      id: "#12845",
      cliente: "Maria Silva",
      produto: "Vestido Floral",
      valor: "R$ 189,90",
      status: "Enviado",
    },
    {
      id: "#12844",
      cliente: "João Santos",
      produto: "Calça Jeans",
      valor: "R$ 159,90",
      status: "Processando",
    },
    {
      id: "#12843",
      cliente: "Ana Costa",
      produto: "Camiseta + Calça",
      valor: "R$ 249,80",
      status: "Entregue",
    },
  ]);

  const [alertasEstoque] = useState([
    {
      produto: "Vestido Floral Verão",
      estoque: 23,
      minimo: 50,
      fracao: "23/50",
    },
    { produto: "Jaqueta Jeans", estoque: 12, minimo: 30, fracao: "12/30" },
    { produto: "Calça Jeans Skinny", estoque: 45, minimo: 60, fracao: "45/60" },
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
      title: "Vendas Hoje",
      value: stats.vendasHoje,
      icon: <ShoppingCart sx={{ fontSize: 36 }} />,
      color: "#4285F4",
      trend: "+12.5%",
      trendUp: true,
      subtitle: "vs. ontem",
    },
    {
      title: "Receita do Dia",
      value: `R$ ${stats.receitaDiaria.toLocaleString("pt-BR")}`,
      icon: <AttachMoney sx={{ fontSize: 36 }} />,
      color: "#34A853",
      trend: "+8.7%",
      trendUp: true,
      subtitle: "vs. ontem",
    },
    {
      title: "Pedidos Pendentes",
      value: stats.pedidosPendentes,
      icon: <LocalShipping sx={{ fontSize: 36 }} />,
      color: "#FBBC04",
      trend: "-5.2%",
      trendUp: false,
      subtitle: "vs. semana passada",
    },
    {
      title: "Estoque Total",
      value: stats.estoqueTotal,
      icon: <Inventory sx={{ fontSize: 36 }} />,
      color: "#EA4335",
      trend: "-3.1%",
      trendUp: false,
      subtitle: "itens disponíveis",
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
      case "Pendente":
        return "error";
      default:
        return "default";
    }
  };

  const getEstoqueProgress = (atual, minimo) => (atual / minimo) * 100;

  return (
    <Box
      sx={{
        width: "100%",
        height: "calc(100vh - 64px)",
        overflow: "hidden",
        p: 2,
        bgcolor: "#f5f5f5",
      }}
    >
      {/* Cabeçalho */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Dashboard - Loja de Roupas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          quinta-feira, 18 de dezembro
        </Typography>
      </Box>

      {/* LINHA 1: Cards de Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={3} key={index}>
            <Card sx={{ borderLeft: `4px solid ${stat.color}`, height: 110 }}>
              <CardContent sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {stat.trendUp ? (
                        <TrendingUp sx={{ fontSize: 16, color: "#34A853" }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 16, color: "#EA4335" }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: stat.trendUp ? "#34A853" : "#EA4335",
                          fontWeight: 600,
                        }}
                      >
                        {stat.trend}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stat.subtitle}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: `${stat.color}15`,
                      borderRadius: 2,
                      p: 1,
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* LINHA 2: Vendas Mensais + Vendas por Categoria + Top Produtos */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={5}>
          <Card sx={{ height: 280 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                Vendas Mensais (Últimos 6 Meses)
              </Typography>
              <LineChart
                xAxis={[{ scaleType: "point", data: vendasMensais.meses }]}
                series={[
                  {
                    data: vendasMensais.vendas,
                    label: "Vendas",
                    color: "#4285F4",
                  },
                  { data: vendasMensais.meta, label: "Meta", color: "#34A853" },
                ]}
                height={220}
                margin={{ left: 45, right: 10, top: 10, bottom: 30 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={3.5}>
          <Card sx={{ height: 280 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                Vendas por Categoria
              </Typography>
              <PieChart
                series={[
                  {
                    data: vendasPorCategoria,
                    innerRadius: 50,
                    outerRadius: 85,
                  },
                ]}
                height={220}
                margin={{ top: 0, bottom: 0, left: 10, right: 100 }}
                slotProps={{
                  legend: {
                    direction: "column",
                    position: { vertical: "middle", horizontal: "right" },
                    itemMarkWidth: 10,
                    itemMarkHeight: 10,
                    markGap: 5,
                    itemGap: 6,
                    labelStyle: { fontSize: 12 },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={3.5}>
          <Card sx={{ height: 280 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                Top 5 Produtos Mais Vendidos
              </Typography>
              {produtosMaisVendidos.map((produto, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                    pb: 2,
                    borderBottom: index < 2 ? "1px solid #e0e0e0" : "none",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      sx={{
                        bgcolor: "#4285F4",
                        width: 32,
                        height: 32,
                        fontSize: 14,
                        mr: 1.5,
                      }}
                    >
                      {index + 1}º
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {produto.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Estoque: {produto.estoque} unidades
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" fontWeight={700}>
                      {produto.vendas}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: produto.variacao.startsWith("+")
                          ? "#34A853"
                          : "#EA4335",
                      }}
                    >
                      {produto.variacao}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* LINHA 3: Vendas Semanais + Estoque Baixo + Últimos Pedidos */}
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Card sx={{ height: 260 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                Vendas por Dia da Semana
              </Typography>
              <BarChart
                xAxis={[{ scaleType: "band", data: vendasSemanais.dias }]}
                series={[
                  {
                    data: vendasSemanais.vendas,
                    label: "Vendas",
                    color: "#FBBC04",
                  },
                ]}
                height={200}
                margin={{ left: 40, right: 10, top: 10, bottom: 30 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={2.5}>
          <Card sx={{ height: 260, bgcolor: "#FFF3E0" }}>
            <CardContent sx={{ p: 2 }}>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ mb: 1.5, color: "#E65100" }}
              >
                ⚠️ Estoque Baixo
              </Typography>
              {alertasEstoque.map((item, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {item.produto}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="error"
                      fontWeight={600}
                    >
                      {item.fracao}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getEstoqueProgress(item.estoque, item.minimo)}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      bgcolor: "#FFE0B2",
                      "& .MuiLinearProgress-bar": {
                        bgcolor:
                          item.estoque < item.minimo * 0.5
                            ? "#EA4335"
                            : "#FBBC04",
                      },
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={5.5}>
          <Card sx={{ height: 260 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
                Últimos Pedidos
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                        PEDIDO
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                        CLIENTE
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                        PRODUTO
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                        VALOR
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>
                        STATUS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ultimosPedidos.map((pedido) => (
                      <TableRow key={pedido.id} hover>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>
                          {pedido.id}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>
                          {pedido.cliente}
                        </TableCell>
                        <TableCell sx={{ fontSize: 13 }}>
                          {pedido.produto}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#34A853",
                          }}
                        >
                          {pedido.valor}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={pedido.status}
                            color={getStatusColor(pedido.status)}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
