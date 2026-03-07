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
  SvgIcon,
} from "@mui/material";
import {
  CheckCircle,
  Storefront,
  Receipt,
  Assessment,
  People,
  Support,
  ShoppingCart,
} from "@mui/icons-material";

// Ícone WhatsApp (SVG)
const WhatsAppIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor" />
  </SvgIcon>
);

const WHATSAPP_NUMERO = "5549999709417";

const urlWhatsApp = (plano) => {
  const mensagem = encodeURIComponent(
    `Olá! Tenho interesse no plano *${plano.nome}* do VEXA. Gostaria de mais informações.`
  );
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${mensagem}`;
};

/**
 * Handler para o botão "Contratar agora".
 * Preparado para integração com API do Mercado Livre.
 * Quando a API do ML estiver configurada, substituir o corpo desta função
 * pela chamada ao checkout do ML (ex: redirect para init_point do ML).
 * @param {Object} plano - { id, nome, preco, ... }
 */
const handleContratarAgora = async (plano) => {
  // TODO: Integração Mercado Livre - chamar API do ML com plano.id/plano.preco
  // Exemplo: const { init_point } = await mlApi.createCheckout({ planId: plano.id, price: plano.preco });
  // if (init_point) window.location.href = init_point;
  console.log("[Planos] Contratar agora:", plano.id, plano.nome, plano.preco);
  // Placeholder: abrir WhatsApp como fallback até a API do ML estar pronta
  window.open(urlWhatsApp(plano), "_blank", "noopener,noreferrer");
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
    preco: 139.0,
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
    diffProfessional: 6, // Diferença mínima para conversão
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
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          Planos e preços
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          Escolha o plano ideal para o tamanho e as necessidades da sua empresa.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 4,
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        {PLANOS.map((plano) => (
          <Card
            key={plano.id}
            elevation={plano.destaque ? 12 : 4}
            sx={{
              border: plano.destaque
                ? `3px solid ${theme.palette.primary.main}`
                : "1px solid",
              borderColor: plano.destaque ? "primary.main" : "divider",
              borderRadius: 3,
              position: "relative",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                transform: "translateY(-8px)",
                boxShadow: plano.destaque ? 16 : 8,
              },
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
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: plano.destaque ? "primary.main" : "action.hover",
                  border: plano.destaque ? "none" : "2px dashed",
                  borderColor: "divider",
                }}
              >
                <Typography
                  component="span"
                  variant="h3"
                  fontWeight={900}
                  sx={{
                    color: plano.destaque ? "primary.contrastText" : "text.primary",
                    fontSize: { xs: "1.75rem", sm: plano.destaque ? "2.25rem" : "2rem" },
                    letterSpacing: "-0.02em",
                  }}
                >
                  R$ {plano.preco.toFixed(2).replace(".", ",")}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    ml: 0.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: plano.destaque ? "primary.contrastText" : "text.secondary",
                    opacity: plano.destaque ? 0.9 : 1,
                  }}
                >
                  /mês
                </Typography>
                {plano.diffProfessional && (
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{
                      mt: 1,
                      color: plano.destaque ? "primary.contrastText" : "success.main",
                      fontWeight: 600,
                      opacity: plano.destaque ? 0.95 : 1,
                    }}
                  >
                    Apenas R$ {plano.diffProfessional.toFixed(0)} a mais que o Professional
                  </Typography>
                )}
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<ShoppingCart />}
                    onClick={() => handleContratarAgora(plano)}
                    sx={{
                      py: 1.5,
                      fontSize: "1rem",
                      fontWeight: 700,
                      boxShadow: 3,
                      "&:hover": { boxShadow: 6 },
                    }}
                  >
                    Contratar agora
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="medium"
                    href={urlWhatsApp(plano)}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<WhatsAppIcon />}
                    sx={{
                      borderColor: "#25D366",
                      color: "#25D366",
                      "&:hover": {
                        borderColor: "#20BD5A",
                        bgcolor: "rgba(37, 211, 102, 0.08)",
                      },
                    }}
                  >
                    Chamar no WhatsApp
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

    </Box>
  );
}

export default Planos;
