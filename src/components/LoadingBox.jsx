import React from "react";
import { Box, CircularProgress } from "@mui/material";

/**
 * Bolinha girando para indicar carregamento de dados.
 * Usado em tabelas e listas em todo o sistema.
 * @param {number} size - Tamanho do spinner (default 40)
 * @param {number} py - Padding vertical (default 8)
 */
export const LoadingBox = ({ size = 40, py = 8 }) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    width="100%"
    py={py}
  >
    <CircularProgress size={size} />
  </Box>
);
