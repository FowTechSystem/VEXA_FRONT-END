// src/pages/Vendas/NovaVenda.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import EtapaItens from "./components/EtapaItens";
import EtapaPagamento from "./components/EtapaPagamento";
import { produtosService } from "../../api/produtosService";

const steps = ["Itens da Venda", "Forma de Pagamento"];

function NovaVenda({ onClose, onSave }) {
  const [activeStep, setActiveStep] = useState(0);
  const [produtos, setProdutos] = useState([]);
  const [venda, setVenda] = useState({
    clienteId: null,
    itens: [],
    descontoGeral: 0,
    observacoes: "",
    pagamentos: [],
  });

  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        const data = await produtosService.getAll();
        setProdutos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        setProdutos([]);
      }
    };

    carregarProdutos();
  }, []);

  const calcularTotal = () => {
    const subtotal = venda.itens.reduce(
      (acc, item) =>
        acc + (item.quantidade * item.precoUnitario - item.desconto),
      0
    );
    return subtotal - venda.descontoGeral;
  };

  const handleNext = () => {
    if (activeStep === 0 && venda.itens.length === 0) {
      alert("Adicione pelo menos um item à venda");
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFinalizarVenda = async () => {
    const totalPago = venda.pagamentos.reduce((acc, p) => acc + p.valor, 0);
    const totalVenda = calcularTotal();

    if (totalPago < totalVenda) {
      alert("Valor pago insuficiente");
      return;
    }

    await onSave({
      ...venda,
      valorTotal: totalVenda,
      dataVenda: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <EtapaItens
          venda={venda}
          setVenda={setVenda}
          produtos={produtos}
          calcularTotal={calcularTotal}
        />
      )}

      {activeStep === 1 && (
        <EtapaPagamento
          venda={venda}
          setVenda={setVenda}
          totalVenda={calcularTotal()}
        />
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Voltar
        </Button>

        {activeStep === steps.length - 1 ? (
          <Button variant="contained" onClick={handleFinalizarVenda}>
            Finalizar Venda
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Próximo
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default NovaVenda;
