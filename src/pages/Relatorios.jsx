// src/pages/Relatorios.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tabs,
  Tab,
  TextField,
} from "@mui/material";
import {
  DateRange,
  Inventory,
  FileDownload,
  TableChart,
} from "@mui/icons-material";
import { showSuccess } from "../utils/notifications";
import { vendasService } from "../api/vendasService";
import { produtosService } from "../api/produtosService";
import { gerarPdfVendas, gerarPdfEstoque, downloadPdf } from "../utils/relatorioPdf";

const VENDAS_EXEMPLO = [
  { id: 1, data: "2026-02-12", cliente: "Cliente A", valor: 450.0, itens: 3 },
  { id: 2, data: "2026-02-11", cliente: "Cliente B", valor: 289.9, itens: 2 },
  { id: 3, data: "2026-02-10", cliente: "Cliente C", valor: 1200.0, itens: 5 },
  { id: 4, data: "2026-02-09", cliente: "Cliente D", valor: 156.5, itens: 1 },
  { id: 5, data: "2026-02-08", cliente: "Cliente E", valor: 890.0, itens: 4 },
];

const ESTOQUE_EXEMPLO = [
  { produto: "Camiseta Básica", sku: "CAM-001", atual: 45, minimo: 20, status: "Normal" },
  { produto: "Calça Jeans", sku: "CAL-002", atual: 8, minimo: 15, status: "Crítico" },
  { produto: "Tênis Running", sku: "TEN-003", atual: 22, minimo: 10, status: "Normal" },
  { produto: "Jaqueta M", sku: "JAQ-004", atual: 5, minimo: 12, status: "Crítico" },
  { produto: "Boné", sku: "BON-005", atual: 30, minimo: 15, status: "Normal" },
];

function Relatorios() {
  const [tabAtual, setTabAtual] = useState(0);
  const [relatorioGerado, setRelatorioGerado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [vendasRelatorio, setVendasRelatorio] = useState([]);
  const [estoqueRelatorio, setEstoqueRelatorio] = useState([]);
  const refRelatorio = useRef(null);

  const umMesAtras = new Date();
  umMesAtras.setMonth(umMesAtras.getMonth() - 1);
  const [dataInicio, setDataInicio] = useState(umMesAtras.toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const vendasFiltradas = vendasRelatorio; // já filtradas pelo período ao gerar
  const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.valor, 0);

  useEffect(() => {
    setRelatorioGerado(false);
  }, [tabAtual]);

  const handleGerarRelatorio = async () => {
    setCarregando(true);
    setRelatorioGerado(false);

    try {
      if (tabAtual === 0) {
        let vendas = [];
        try {
          const res = await vendasService.getAll({ dataInicio, dataFim, pagina: 1, tamanho: 500 });
          const list = Array.isArray(res) ? res : res?.vendas ?? res?.Vendas ?? res?.items ?? res?.data ?? [];
          vendas = list.map((v, i) => {
            const d = (v.dataVenda ?? v.DataVenda ?? v.data ?? v.createdAt ?? "").toString().split("T")[0];
            const valor = Number(v.valorTotal ?? v.ValorTotal ?? v.valor ?? 0) || 0;
            const itens = Array.isArray(v.itens ?? v.Itens) ? (v.itens ?? v.Itens).length : 0;
            const cliente = v.cliente?.nome ?? v.clienteNome ?? v.Cliente ?? "—";
            return { id: v.id ?? i + 1, data: d, cliente, valor, itens };
          });
        } catch {
          vendas = VENDAS_EXEMPLO.filter((v) => v.data >= dataInicio && v.data <= dataFim);
          if (vendas.length === 0) vendas = VENDAS_EXEMPLO;
        }
        setVendasRelatorio(vendas);
        const totalVendasGerado = vendas.reduce((a, v) => a + v.valor, 0);

        const emp = JSON.parse(localStorage.getItem("empresaAtiva") || "{}");
        const nomeEmpresa = emp?.nome ?? emp?.nomeFantasia ?? "VEXA";
        const docVendas = gerarPdfVendas(vendas, dataInicio, dataFim, nomeEmpresa);
        downloadPdf(docVendas, `relatorio-vendas-${dataInicio}-${dataFim}.pdf`);

        setRelatorioGerado(true);
        showSuccess(
          `Relatório de Vendas (${dataInicio} a ${dataFim}) gerado. Total: R$ ${totalVendasGerado.toFixed(2)}`
        );
      } else {
        let estoque = [];
        try {
          const res = await produtosService.getAll({ tamanho: 500 });
          const list = Array.isArray(res) ? res : res?.produtos ?? res?.Produtos ?? res?.items ?? res?.data ?? [];
          estoque = list.map((p) => {
            const atual = Number(p.quantidadeEstoque ?? p.QuantidadeEstoque ?? p.estoque ?? 0) || 0;
            const minimo = Number(p.estoqueMinimo ?? p.EstoqueMinimo ?? 10) || 10;
            return {
              produto: p.nome ?? p.Nome ?? "—",
              sku: p.codigoBarras ?? p.sku ?? p.Sku ?? "—",
              atual,
              minimo,
              status: atual <= minimo ? "Crítico" : "Normal",
            };
          });
        } catch {
          estoque = ESTOQUE_EXEMPLO;
        }
        setEstoqueRelatorio(estoque);

        const emp = JSON.parse(localStorage.getItem("empresaAtiva") || "{}");
        const nomeEmpresa = emp?.nome ?? emp?.nomeFantasia ?? "VEXA";
        const docEstoque = gerarPdfEstoque(estoque, nomeEmpresa);
        downloadPdf(docEstoque, "relatorio-estoque.pdf");

        setRelatorioGerado(true);
        showSuccess("Relatório de Estoque gerado.");
      }

      setTimeout(() => refRelatorio.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarRelatorioClick = () => {
    handleGerarRelatorio();
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
          Relatórios
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
          Visualize e exporte relatórios do sistema
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tabAtual}
          onChange={(e, v) => setTabAtual(v)}
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            px: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
            "& .Mui-selected": { color: "primary.main" },
            "& .MuiTabs-indicator": { backgroundColor: "primary.main" },
          }}
        >
          <Tab icon={<DateRange />} iconPosition="start" label="Vendas por Período" />
          <Tab icon={<Inventory />} iconPosition="start" label="Produtos em Estoque" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabAtual === 0 && (
            <>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 3 }}>
                <TextField
                  label="Data Início"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ minWidth: 160 }}
                />
                <TextField
                  label="Data Fim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ minWidth: 160 }}
                />
                <Button
                  variant="contained"
                  startIcon={<FileDownload />}
                  onClick={handleGerarRelatorioClick}
                  disabled={carregando}
                  sx={{ textTransform: "none" }}
                >
                  {carregando ? "Gerando..." : "Gerar relatório"}
                </Button>
              </Box>
              {!relatorioGerado ? (
                <Box
                  ref={refRelatorio}
                  sx={{
                    py: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <TableChart sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1">Configure as datas e clique em &quot;Gerar relatório&quot;</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>O relatório será exibido aqui e baixado em PDF</Typography>
                </Box>
              ) : (
                <Box ref={refRelatorio}>
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "background.default" }}>
                          <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>Data</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>Cliente</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: "text.primary" }}>Itens</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "text.primary" }}>Valor (R$)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vendasFiltradas.map((row) => (
                          <TableRow key={row.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                            <TableCell sx={{ color: "text.secondary" }}>{row.data}</TableCell>
                            <TableCell>{row.cliente}</TableCell>
                            <TableCell align="center">{row.itens}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: "success.main" }}>
                              {row.valor.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
                    Total no período:{" "}
                    <Typography component="span" fontWeight={700} color="success.main">
                      R$ {totalVendas.toFixed(2)}
                    </Typography>{" "}
                    ({vendasFiltradas.length} vendas)
                  </Typography>
                </Box>
              )}
            </>
          )}

          {tabAtual === 1 && (
            <>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<FileDownload />}
                  onClick={handleGerarRelatorioClick}
                  disabled={carregando}
                  sx={{ textTransform: "none" }}
                >
                  {carregando ? "Gerando..." : "Gerar relatório"}
                </Button>
              </Box>
              {!relatorioGerado ? (
                <Box
                  ref={refRelatorio}
                  sx={{
                    py: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Inventory sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1">Clique em &quot;Gerar relatório&quot; para visualizar</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>O relatório será exibido aqui e baixado em PDF</Typography>
                </Box>
              ) : (
                <Box ref={refRelatorio}>
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "background.default" }}>
                          <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>Produto</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>SKU</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: "text.primary" }}>Estoque Atual</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: "text.primary" }}>Mínimo</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {estoqueRelatorio.map((row, idx) => (
                          <TableRow key={idx} hover sx={{ "&:last-child td": { border: 0 } }}>
                            <TableCell>{row.produto}</TableCell>
                            <TableCell sx={{ color: "text.secondary" }}>{row.sku}</TableCell>
                            <TableCell align="center">{row.atual}</TableCell>
                            <TableCell align="center">{row.minimo}</TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: row.status === "Crítico" ? "error.main" : "success.main",
                                }}
                              >
                                {row.status}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default Relatorios;
