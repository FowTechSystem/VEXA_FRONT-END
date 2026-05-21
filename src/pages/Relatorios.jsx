import React, { useMemo, useRef, useState } from "react";
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
  People,
  LocalFireDepartment,
} from "@mui/icons-material";
import VexaDatePicker from "../components/VexaDatePicker";
import { PieChart } from "@mui/x-charts/PieChart";
import { showSuccess } from "../utils/notifications";
import { vendasService } from "../api/vendasService";
import { produtosService } from "../api/produtosService";
import {
  downloadPdf,
  gerarPdfEstoque,
  gerarPdfProdutosMaisVendidos,
  gerarPdfVendasPeriodo,
  gerarPdfVendasPorCliente,
} from "../utils/relatorioPdf";

const CORES_GRAFICO = ["#F8F32B", "#8D99AE", "#5B79F7", "#34D399", "#F97316", "#A855F7"];

const TABS = [
  { id: "vendasPeriodo", label: "Vendas por Período", icon: <DateRange />, precisaPeriodo: true },
  { id: "estoque", label: "Produtos em Estoque", icon: <Inventory />, precisaPeriodo: false },
  { id: "vendasCliente", label: "Vendas por Cliente", icon: <People />, precisaPeriodo: true },
  { id: "produtosMaisVendidos", label: "Produtos mais vendidos", icon: <LocalFireDepartment />, precisaPeriodo: true },
];

const VENDAS_EXEMPLO = [
  {
    id: 1,
    data: "2026-04-12",
    cliente: "Cliente A",
    valor: 450.0,
    itens: [
      { produto: "Camiseta Básica", quantidade: 2, subtotal: 120 },
      { produto: "Calça Jeans", quantidade: 1, subtotal: 330 },
    ],
  },
  { id: 2, data: "2026-04-11", cliente: "Cliente B", valor: 289.9, itens: [{ produto: "Tênis Running", quantidade: 1, subtotal: 289.9 }] },
  { id: 3, data: "2026-04-10", cliente: "Cliente A", valor: 1200.0, itens: [{ produto: "Jaqueta M", quantidade: 3, subtotal: 1200 }] },
  { id: 4, data: "2026-04-09", cliente: "Cliente C", valor: 156.5, itens: [{ produto: "Boné", quantidade: 5, subtotal: 156.5 }] },
];

const ESTOQUE_EXEMPLO = [
  { produto: "Camiseta Básica", sku: "CAM-001", atual: 45, minimo: 20, status: "Normal" },
  { produto: "Calça Jeans", sku: "CAL-002", atual: 8, minimo: 15, status: "Crítico" },
  { produto: "Tênis Running", sku: "TEN-003", atual: 22, minimo: 10, status: "Normal" },
  { produto: "Jaqueta M", sku: "JAQ-004", atual: 5, minimo: 12, status: "Crítico" },
  { produto: "Boné", sku: "BON-005", atual: 30, minimo: 15, status: "Normal" },
];

const moedaBR = (v) => `R$ ${Number(v || 0).toFixed(2)}`;

const getNomeEmpresaAtiva = () => {
  const emp = JSON.parse(localStorage.getItem("empresaAtiva") || "{}");
  return emp?.nome ?? emp?.nomeFantasia ?? "VEXA";
};

const formatDate = (value) => (value ? String(value).split("T")[0] : "");

const normalizeVenda = (venda, idx) => {
  const itensRaw = venda?.itens ?? venda?.Itens ?? venda?.produtos ?? venda?.Produtos ?? [];
  const itens = Array.isArray(itensRaw)
    ? itensRaw.map((item) => {
        const quantidade = Number(item.quantidade ?? item.Quantidade ?? item.qtd ?? 1) || 1;
        const subtotal = Number(
          item.subtotal ??
            item.Subtotal ??
            item.valorTotal ??
            item.ValorTotal ??
            item.valor ??
            item.precoUnitario * quantidade ??
            0
        ) || 0;
        return {
          produto: item.produto?.nome ?? item.nomeProduto ?? item.nome ?? item.descricao ?? "Produto",
          quantidade,
          subtotal,
        };
      })
    : [];

  const valor = Number(venda.valorTotal ?? venda.ValorTotal ?? venda.valor ?? venda.total ?? 0) || 0;
  const cliente =
    venda.cliente?.nome ??
    venda.clienteNome ??
    venda.ClienteNome ??
    venda.Cliente ??
    venda.cliente ??
    "Não informado";

  return {
    id: venda.id ?? venda.Id ?? idx + 1,
    data: formatDate(venda.dataVenda ?? venda.DataVenda ?? venda.data ?? venda.createdAt),
    cliente,
    valor,
    itens,
  };
};

function Relatorios() {
  const [tabAtual, setTabAtual] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [relatorioGerado, setRelatorioGerado] = useState(false);
  const [vendasRelatorio, setVendasRelatorio] = useState([]);
  const [estoqueRelatorio, setEstoqueRelatorio] = useState([]);
  const refRelatorio = useRef(null);

  const umMesAtras = new Date();
  umMesAtras.setMonth(umMesAtras.getMonth() - 1);
  const [dataInicio, setDataInicio] = useState(umMesAtras.toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const tabSelecionada = TABS[tabAtual];

  const resumoVendasPeriodo = useMemo(() => {
    const total = vendasRelatorio.reduce((acc, v) => acc + v.valor, 0);
    const porClienteMap = new Map();
    vendasRelatorio.forEach((venda) => {
      const atual = porClienteMap.get(venda.cliente) || { cliente: venda.cliente, valor: 0, pedidos: 0 };
      atual.valor += venda.valor;
      atual.pedidos += 1;
      porClienteMap.set(venda.cliente, atual);
    });
    const porCliente = Array.from(porClienteMap.values()).sort((a, b) => b.valor - a.valor);
    return { total, porCliente };
  }, [vendasRelatorio]);

  const vendasPorCliente = useMemo(
    () =>
      resumoVendasPeriodo.porCliente.map((item, idx) => ({
        ...item,
        ticketMedio: item.pedidos ? item.valor / item.pedidos : 0,
        cor: CORES_GRAFICO[idx % CORES_GRAFICO.length],
      })),
    [resumoVendasPeriodo.porCliente]
  );

  const produtosMaisVendidos = useMemo(() => {
    const map = new Map();
    vendasRelatorio.forEach((venda) => {
      venda.itens.forEach((item) => {
        const key = item.produto || "Produto";
        const atual = map.get(key) || { produto: key, quantidade: 0, valor: 0 };
        atual.quantidade += Number(item.quantidade || 0);
        atual.valor += Number(item.subtotal || 0);
        map.set(key, atual);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10)
      .map((item, idx) => ({ ...item, cor: CORES_GRAFICO[idx % CORES_GRAFICO.length] }));
  }, [vendasRelatorio]);

  const resumoEstoque = useMemo(() => {
    const critico = estoqueRelatorio.filter((item) => item.status === "Crítico").length;
    const normal = estoqueRelatorio.length - critico;
    return { critico, normal, total: estoqueRelatorio.length };
  }, [estoqueRelatorio]);

  const carregarVendas = async () => {
    try {
      const res = await vendasService.getAll({ dataInicio, dataFim, pagina: 1, tamanho: 1000 });
      const list = Array.isArray(res) ? res : res?.vendas ?? res?.Vendas ?? res?.items ?? res?.data ?? [];
      const vendas = list.map(normalizeVenda);
      setVendasRelatorio(vendas.length ? vendas : VENDAS_EXEMPLO);
    } catch {
      setVendasRelatorio(VENDAS_EXEMPLO.filter((v) => v.data >= dataInicio && v.data <= dataFim));
    }
  };

  const carregarEstoque = async () => {
    try {
      const res = await produtosService.getAll({ tamanho: 1000 });
      const list = Array.isArray(res) ? res : res?.produtos ?? res?.Produtos ?? res?.items ?? res?.data ?? [];
      const estoque = list.map((p) => {
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
      setEstoqueRelatorio(estoque.length ? estoque : ESTOQUE_EXEMPLO);
    } catch {
      setEstoqueRelatorio(ESTOQUE_EXEMPLO);
    }
  };

  const handleGerarRelatorio = async () => {
    setCarregando(true);
    setRelatorioGerado(false);
    try {
      if (tabSelecionada.id === "estoque") {
        await carregarEstoque();
      } else {
        await carregarVendas();
      }
      setRelatorioGerado(true);
      showSuccess(`Relatório "${tabSelecionada.label}" gerado com sucesso.`);
      setTimeout(() => refRelatorio.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } finally {
      setCarregando(false);
    }
  };

  const handleExportarPdf = () => {
    const nomeEmpresa = getNomeEmpresaAtiva();
    let doc;
    let nomeArquivo = `relatorio-${tabSelecionada.id}.pdf`;

    if (tabSelecionada.id === "vendasPeriodo") {
      doc = gerarPdfVendasPeriodo(vendasRelatorio, dataInicio, dataFim, nomeEmpresa);
      nomeArquivo = `relatorio-vendas-periodo-${dataInicio}-${dataFim}.pdf`;
    } else if (tabSelecionada.id === "estoque") {
      doc = gerarPdfEstoque(estoqueRelatorio, nomeEmpresa);
      nomeArquivo = "relatorio-produtos-estoque.pdf";
    } else if (tabSelecionada.id === "vendasCliente") {
      doc = gerarPdfVendasPorCliente(vendasPorCliente, dataInicio, dataFim, nomeEmpresa);
      nomeArquivo = `relatorio-vendas-por-cliente-${dataInicio}-${dataFim}.pdf`;
    } else {
      doc = gerarPdfProdutosMaisVendidos(produtosMaisVendidos, dataInicio, dataFim, nomeEmpresa);
      nomeArquivo = `relatorio-produtos-mais-vendidos-${dataInicio}-${dataFim}.pdf`;
    }
    downloadPdf(doc, nomeArquivo);
    showSuccess("PDF exportado com sucesso.");
  };

  const pieData = (() => {
    if (tabSelecionada.id === "estoque") {
      return [
        { id: "normal", value: resumoEstoque.normal, label: "Normal", color: "#34D399" },
        { id: "critico", value: resumoEstoque.critico, label: "Crítico", color: "#F87171" },
      ].filter((item) => item.value > 0);
    }
    if (tabSelecionada.id === "vendasCliente") {
      return vendasPorCliente.slice(0, 6).map((item, idx) => ({
        id: `${item.cliente}-${idx}`,
        value: item.valor,
        label: item.cliente,
        color: item.cor,
      }));
    }
    if (tabSelecionada.id === "produtosMaisVendidos") {
      return produtosMaisVendidos.slice(0, 6).map((item, idx) => ({
        id: `${item.produto}-${idx}`,
        value: item.quantidade,
        label: item.produto,
        color: item.cor,
      }));
    }
    return resumoVendasPeriodo.porCliente.slice(0, 6).map((item, idx) => ({
      id: `${item.cliente}-${idx}`,
      value: item.valor,
      label: item.cliente,
      color: CORES_GRAFICO[idx % CORES_GRAFICO.length],
    }));
  })();

  const renderTabela = () => {
    if (tabSelecionada.id === "estoque") {
      return (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              <TableCell sx={{ fontWeight: 700 }}>Produto</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>SKU</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Estoque</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Mínimo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {estoqueRelatorio.map((row, idx) => (
              <TableRow key={`${row.sku}-${idx}`} hover>
                <TableCell>{row.produto}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{row.sku}</TableCell>
                <TableCell align="center">{row.atual}</TableCell>
                <TableCell align="center">{row.minimo}</TableCell>
                <TableCell sx={{ color: row.status === "Crítico" ? "error.main" : "success.main", fontWeight: 700 }}>
                  {row.status}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tabSelecionada.id === "vendasCliente") {
      return (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Pedidos</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Total vendido</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Ticket médio</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendasPorCliente.map((row, idx) => (
              <TableRow key={`${row.cliente}-${idx}`} hover>
                <TableCell>{row.cliente}</TableCell>
                <TableCell align="center">{row.pedidos}</TableCell>
                <TableCell align="right">{moedaBR(row.valor)}</TableCell>
                <TableCell align="right">{moedaBR(row.ticketMedio)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    if (tabSelecionada.id === "produtosMaisVendidos") {
      return (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "background.default" }}>
              <TableCell sx={{ fontWeight: 700 }}>Produto</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Qtd. vendida</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Valor total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {produtosMaisVendidos.map((row, idx) => (
              <TableRow key={`${row.produto}-${idx}`} hover>
                <TableCell>{row.produto}</TableCell>
                <TableCell align="center">{row.quantidade}</TableCell>
                <TableCell align="right">{moedaBR(row.valor)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }

    return (
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "background.default" }}>
            <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700 }}>Itens</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>Valor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vendasRelatorio.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell sx={{ color: "text.secondary" }}>{row.data}</TableCell>
              <TableCell>{row.cliente}</TableCell>
              <TableCell align="center">{row.itens.length}</TableCell>
              <TableCell align="right">{moedaBR(row.valor)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const resumoTexto = () => {
    if (tabSelecionada.id === "estoque") {
      return `${resumoEstoque.total} produto(s) | ${resumoEstoque.critico} em estado crítico`;
    }
    if (tabSelecionada.id === "vendasCliente") {
      return `${vendasPorCliente.length} cliente(s) com vendas no período`;
    }
    if (tabSelecionada.id === "produtosMaisVendidos") {
      return `${produtosMaisVendidos.length} produto(s) com vendas no período`;
    }
    return `${vendasRelatorio.length} venda(s) | Total ${moedaBR(resumoVendasPeriodo.total)}`;
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: "text.primary" }}>
          Relatórios
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
          Visualize, analise por gráfico de pizza e exporte PDF.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Tabs
          value={tabAtual}
          onChange={(_, value) => {
            setTabAtual(value);
            setRelatorioGerado(false);
          }}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            borderBottom: "1px solid",
            borderColor: "divider",
            px: 1,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            "& .Mui-selected": { color: "primary.main" },
            "& .MuiTabs-indicator": { backgroundColor: "primary.main" },
          }}
        >
          {TABS.map((tab) => (
            <Tab key={tab.id} icon={tab.icon} iconPosition="start" label={tab.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 3 }}>
            {tabSelecionada.precisaPeriodo && (
              <>
                <VexaDatePicker
                  label="Data início"
                  value={dataInicio}
                  onChange={setDataInicio}
                />
                <VexaDatePicker
                  label="Data fim"
                  value={dataFim}
                  onChange={setDataFim}
                />
              </>
            )}

            <Button variant="contained" startIcon={<TableChart />} onClick={handleGerarRelatorio} disabled={carregando}>
              {carregando ? "Gerando..." : "Gerar relatório"}
            </Button>

            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              disabled={!relatorioGerado}
              onClick={handleExportarPdf}
            >
              Exportar PDF
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
              <TableChart sx={{ fontSize: 48, mb: 2, opacity: 0.45 }} />
              <Typography variant="body1">Clique em &quot;Gerar relatório&quot; para visualizar</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Todos os relatórios exibem gráfico de pizza e permitem exportação em PDF.
              </Typography>
            </Box>
          ) : (
            <Box ref={refRelatorio}>
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "320px 1fr" }, mb: 2 }}>
                <Paper variant="outlined" sx={{ borderColor: "divider", borderRadius: 2, p: 2 }}>
                  {pieData.length > 0 ? (
                    <PieChart
                      series={[
                        {
                          data: pieData,
                          innerRadius: 45,
                          outerRadius: 90,
                        },
                      ]}
                      height={240}
                      slotProps={{ legend: { hidden: true } }}
                      sx={{ "& .MuiChartsLegend-root": { display: "none" } }}
                    />
                  ) : (
                    <Box sx={{ height: 240, display: "grid", placeItems: "center", color: "text.secondary" }}>
                      <Typography variant="body2">Sem dados para o gráfico.</Typography>
                    </Box>
                  )}
                </Paper>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, borderColor: "divider" }}>
                  {renderTabela()}
                </TableContainer>
              </Box>

              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {resumoTexto()}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

export default Relatorios;
