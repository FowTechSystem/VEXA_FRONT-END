// src/components/Bazar/bazarConstants.js
// Enums e listas fixas usadas pelas telas do módulo Bazar.
// Mantidas no front porque são domínio (status conhecido, formas de pagamento),
// não dados de loja.
//
// TODO: caso a loja queira customizar tamanhos/cores, mover esses valores
//       para Configurações (GET /api/bazar/opcoes) e cachear na inicialização.

export const STATUS_PECA = {
  DISPONIVEL: "disponivel",
  VENDIDA: "vendida",
  DEVOLVIDA: "devolvida",
};

export const STATUS_REPASSE = {
  PENDENTE: "pendente",
  PAGO: "pago",
};

export const FORMAS_PAGAMENTO_REPASSE = [
  "Dinheiro",
  "PIX",
  "Transferência",
  "Outro",
];

/** Tamanhos padronizados — ordem natural. */
export const TAMANHOS_PADRAO = [
  "PP",
  "P",
  "M",
  "G",
  "GG",
  "XG",
  "XGG",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "46",
  "48",
  "U",
];

/** Cores padronizadas — ordem alfabética. */
export const CORES_PADRAO = [
  "Amarelo",
  "Azul",
  "Azul claro",
  "Azul marinho",
  "Azul royal",
  "Bege",
  "Branco",
  "Caramelo",
  "Cinza",
  "Dourado",
  "Estampado",
  "Laranja",
  "Lilás",
  "Marrom",
  "Mescla",
  "Nude",
  "Off-white",
  "Pink",
  "Prateado",
  "Preto",
  "Rosa",
  "Rosa claro",
  "Roxo",
  "Verde",
  "Verde água",
  "Verde claro",
  "Verde militar",
  "Vermelho",
  "Vinho",
];
