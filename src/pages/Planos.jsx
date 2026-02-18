// src/pages/Planos.jsx
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  useTheme,
} from "@mui/material";
import {
  CheckCircle,
  Storefront,
  Receipt,
  Assessment,
  People,
  Support,
  SwapHoriz,
} from "@mui/icons-material";

const WHATSAPP_TROCAR_PLANO = {
  numero: "5549999709417",
  nome: "Vitor",
  mensagem:
    "Olá Vitor! Gostaria de mudar meu plano do sistema VEXA.",
};

const urlWhatsApp = () => {
  const text = encodeURIComponent(WHATSAPP_TROCAR_PLANO.mensagem);
  return `https://wa.me/${WHATSAPP_TROCAR_PLANO.numero}?text=${text}`;
};

const PLANOS = [
  {
    id: "essencial",
    nome: "Essencial",
    preco: 83.49,
    descricao: "Controle operacional sem parte fiscal",
    destaque: false,
    funcionalidades: [
      "Gestão de clientes, fornecedores e usuários",
      "Cadastro e controle de produtos e categorias",
      "Controle de estoque e movimentações",
      "Registro de vendas e caixa",
      "Módulo financeiro básico",
      "Dashboard com visão geral",
      "Sem acesso à parte fiscal",
    ],
    limites: "Até 3 usuários • 500 clientes • 1.000 produtos",
    suporte: "E-mail (resposta em até 48h úteis)",
    icone: <Storefront />,
  },
  {
    id: "professional",
    nome: "Professional",
    preco: 130.0,
    descricao: "Controle + parte fiscal e emissão de notas",
    destaque: true,
    funcionalidades: [
      "Tudo do plano Essencial",
      "Acesso à parte fiscal (módulo Fiscal)",
      "Emissão de notas fiscais (NF-e / NFC-e)",
      "Gestão de impostos e regime tributário",
      "Relatórios fiscais básicos",
      "Pipeline de vendas e leads",
      "Relatórios gerenciais",
    ],
    limites: "Até 10 usuários • 2.000 clientes • 5.000 produtos",
    suporte: "E-mail (24h) + chat em horário comercial",
    icone: <Receipt />,
  },
  {
    id: "enterprise",
    nome: "Enterprise",
    preco: 145.0,
    descricao: "Acesso total + relatórios detalhados",
    destaque: false,
    funcionalidades: [
      "Tudo do plano Professional",
      "Relatórios detalhados e customizáveis",
      "Análise de rentabilidade por produto/cliente",
      "Fluxo de caixa e DRE simplificado",
      "Exportação PDF/Excel",
      "Dashboards e KPIs personalizáveis",
      "Suporte prioritário",
    ],
    limites: "Até 25 usuários • 10.000 clientes • 20.000 produtos",
    suporte: "E-mail (12h) + chat + telefone • Atendimento prioritário",
    icone: <Assessment />,
  },
];

function Planos() {
  const theme = useTheme();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Planos e preços
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Escolha o plano ideal para o tamanho e as necessidades da sua empresa.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        {PLANOS.map((plano) => (
          <Card
            key={plano.id}
            elevation={plano.destaque ? 8 : 2}
            sx={{
              border: plano.destaque
                ? `2px solid ${theme.palette.primary.main}`
                : "none",
              borderRadius: 2,
              position: "relative",
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {plano.destaque && (
              <Chip
                label="Mais escolhido"
                color="primary"
                size="small"
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  fontWeight: 600,
                }}
              />
            )}
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Box
                  sx={{
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {plano.icone}
                </Box>
                <Typography variant="h5" fontWeight={700}>
                  {plano.nome}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {plano.descricao}
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography component="span" variant="h4" fontWeight={800}>
                  R$ {plano.preco.toFixed(2).replace(".", ",")}
                </Typography>
                <Typography component="span" color="text.secondary">
                  /mês
                </Typography>
              </Box>

              <List dense disablePadding sx={{ mb: 2, flex: 1 }}>
                {plano.funcionalidades.map((item, idx) => (
                  <ListItem key={idx} disablePadding sx={{ py: 0.25 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle
                        fontSize="small"
                        sx={{ color: "success.main" }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                ))}
              </List>

              <Box
                sx={{
                  mt: "auto",
                  pt: 2,
                  borderTop: 1,
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{ mb: 0.5 }}
                >
                  <People fontSize="small" /> {plano.limites}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  sx={{ mb: 2 }}
                >
                  <Support fontSize="small" /> {plano.suporte}
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  href={urlWhatsApp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<SwapHoriz />}
                  size="medium"
                  sx={{
                    bgcolor: "#25D366",
                    "&:hover": { bgcolor: "#20BD5A" },
                  }}
                >
                  Trocar de plano
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ mt: 4, maxWidth: 800 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Resumo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Essencial:</strong> controle de vendas, estoque, cadastros e
          financeiro básico, sem módulo fiscal.{" "}
          <strong>Professional:</strong> inclui parte fiscal e emissão de
          notas. <strong>Enterprise:</strong> tudo isso mais relatórios
          detalhados, mais usuários e suporte prioritário.
        </Typography>
      </Box>
    </Box>
  );
}

export default Planos;
