// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import {
  TrendingUp,
  People,
  ShoppingCart,
  AttachMoney,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const salesData = [
  { date: "Jan", vendas: 40 },
  { date: "Fev", vendas: 55 },
  { date: "Mar", vendas: 70 },
  { date: "Abr", vendas: 85 },
  { date: "Mai", vendas: 120 },
  { date: "Jun", vendas: 95 },
];

function Dashboard() {
  const [stats, setStats] = useState({
    novosTickets: 43,
    fechadosHoje: 17,
    novasRespostas: 7,
    faturamento: 95,
  });

  useEffect(() => {
    // Buscar dados reais da API
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Exemplo: const data = await dashboardService.getStats();
      // setStats(data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  const statCards = [
    {
      title: "Novos Tickets",
      value: stats.novosTickets,
      change: "+6%",
      icon: <ShoppingCart fontSize="large" />,
      color: "primary.main",
    },
    {
      title: "Fechados Hoje",
      value: stats.fechadosHoje,
      change: "-3%",
      icon: <TrendingUp fontSize="large" />,
      color: "secondary.main",
    },
    {
      title: "Novas Respostas",
      value: stats.novasRespostas,
      change: "+9%",
      icon: <People fontSize="large" />,
      color: "success.main",
    },
    {
      title: "Faturamento",
      value: `$${stats.faturamento}`,
      change: "-2%",
      icon: <AttachMoney fontSize="large" />,
      color: "warning.main",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Typography color="textSecondary" variant="subtitle2">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                      {card.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: card.change.includes("+")
                          ? "success.main"
                          : "error.main",
                        fontWeight: 600,
                      }}
                    >
                      {card.change}
                    </Typography>
                  </div>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Atividade de Vendas
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="vendas"
                    stroke="#7C3AED"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Novo Feedback
              </Typography>
              <Box
                sx={{
                  height: 300,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="textSecondary">
                  Adicione seus dados aqui
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
