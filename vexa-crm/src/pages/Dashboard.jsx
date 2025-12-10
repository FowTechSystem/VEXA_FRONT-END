// src/pages/Dashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import {
  ConfirmationNumber,
  CheckCircle,
  Reply,
  AttachMoney,
} from "@mui/icons-material";

function Dashboard() {
  const [stats] = useState({
    novosTickets: 43,
    fechadosHoje: 17,
    novasRespostas: 7,
    faturamento: 95,
  });

  // FUNÇÃO COM useCallback
  const fetchDashboardData = useCallback(async () => {
    try {
      // Exemplo: const data = await dashboardService.getStats();
      // setStats(data);
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
      title: "Novos Tickets",
      value: stats.novosTickets,
      icon: <ConfirmationNumber sx={{ fontSize: 40 }} />,
      color: "#1976d2",
    },
    {
      title: "Fechados Hoje",
      value: stats.fechadosHoje,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: "#2e7d32",
    },
    {
      title: "Novas Respostas",
      value: stats.novasRespostas,
      icon: <Reply sx={{ fontSize: 40 }} />,
      color: "#ed6c02",
    },
    {
      title: "Faturamento",
      value: `R$ ${stats.faturamento}k`,
      icon: <AttachMoney sx={{ fontSize: 40 }} />,
      color: "#9c27b0",
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderLeft: `4px solid ${stat.color}`,
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Adicione mais conteúdo do dashboard aqui */}
    </Box>
  );
}

export default Dashboard;
