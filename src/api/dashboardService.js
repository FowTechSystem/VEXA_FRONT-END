// src/api/dashboardService.js
import api from "./axiosConfig";

/**
 * Serviço do Dashboard.
 * Consome GET /api/Dashboard?mes=&ano=
 * O backend retorna todos os dados já calculados.
 *
 * mes: 1-12 (Janeiro=1, Dezembro=12)
 * ano: ex 2026
 */
export const dashboardService = {
  getResumo: async (ano, mes) => {
    const response = await api.get("/Dashboard", {
      params: { ano, mes },
    });
    return response.data;
  },
};
