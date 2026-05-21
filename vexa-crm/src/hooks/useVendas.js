// src/hooks/useVendas.js
import { useState, useEffect, useCallback } from "react";
import { vendasService } from "../api/vendasService";
import { clientesService } from "../api/clientesService";
import { produtosService } from "../api/produtosService";

export const useVendas = () => {
  const [vendas, setVendas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVendas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vendasService.getAll();
      setVendas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Erro ao carregar vendas");
      console.error("Erro ao buscar vendas:", err);
      setVendas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClientes = useCallback(async () => {
    try {
      const data = await clientesService.getAll();
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      setClientes([]);
    }
  }, []);

  const fetchProdutos = useCallback(async () => {
    try {
      const data = await produtosService.getAll();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      setProdutos([]);
    }
  }, []);

  const createVenda = useCallback(
    async (vendaData) => {
      try {
        setLoading(true);
        setError(null);
        await vendasService.create(vendaData);
        await fetchVendas();
        return { success: true };
      } catch (err) {
        const errorMessage =
          err.response?.data?.message || "Erro ao criar venda";
        setError(errorMessage);
        console.error("Erro ao criar venda:", err);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [fetchVendas]
  );

  useEffect(() => {
    fetchVendas();
    fetchClientes();
    fetchProdutos();
  }, [fetchVendas, fetchClientes, fetchProdutos]);

  return {
    vendas,
    clientes,
    produtos,
    loading,
    error,
    createVenda,
    refetch: fetchVendas,
    clearError: () => setError(null),
  };
};
