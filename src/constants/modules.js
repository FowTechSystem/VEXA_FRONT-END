/**
 * Catálogo de módulos do VEXA. Cada módulo define visibilidade no menu, dependências
 * e se pode ser desativado pelo dev na aba "Personalização".
 *
 * Para adicionar um módulo novo: incluir aqui, no Sidebar (referenciar moduleKey)
 * e proteger a rota em App.jsx com <ModuleRoute moduleKey="...">.
 */

export const MODULE_CATEGORIES = [
  { key: "visao-geral", label: "Visão Geral" },
  { key: "operacao", label: "Operação" },
  { key: "gestao", label: "Gestão" },
  { key: "cadastros", label: "Cadastros" },
  { key: "analises", label: "Análises" },
  { key: "sistema", label: "Sistema" },
  { key: "administracao", label: "Administração" },
];

/**
 * @typedef {Object} ModuleDef
 * @property {string} key           Identificador único usado em settings.enabled_modules
 * @property {string} label         Nome exibido na lista de switches
 * @property {string} description   Descrição curta (tooltip/subtítulo)
 * @property {string} category      Uma das MODULE_CATEGORIES.key
 * @property {boolean} mandatory    Se true, switch sempre ativo + desabilitado
 * @property {boolean} [devOnly]    Disponível somente quando perfil dev
 * @property {string[]} [requires]  Todas as keys listadas precisam estar ativas
 * @property {string[]} [requiresAny] Pelo menos uma das keys precisa estar ativa
 */

/** @type {ModuleDef[]} */
export const MODULES = [
  // Visão Geral
  {
    key: "inicio",
    label: "Início",
    description: "Tela inicial e dashboard resumo.",
    category: "visao-geral",
    mandatory: true,
  },

  // Operação
  {
    key: "bazar",
    label: "Bazar",
    description: "Consignados, sacolas e gerenciamento de consignantes.",
    category: "operacao",
  },
  {
    key: "repasses",
    label: "Repasses",
    description: "Repasses financeiros aos consignantes do bazar.",
    category: "operacao",
    requires: ["bazar"],
  },
  {
    key: "caixa",
    label: "Caixa",
    description: "Abertura, fechamento, sangrias e suprimentos.",
    category: "operacao",
    requiresAny: ["vendas", "bazar"],
  },
  {
    key: "catalogo",
    label: "Catálogo Digital",
    description: "Catálogo público compartilhável com clientes.",
    category: "operacao",
    requires: ["produtos"],
  },
  {
    key: "condicional",
    label: "Condicional",
    description: "Envio de produtos para experimentação.",
    category: "operacao",
    requiresAny: ["produtos", "bazar"],
  },
  {
    key: "vendas",
    label: "Vendas",
    description: "Frente de caixa (PDV) e registro de vendas.",
    category: "operacao",
    requiresAny: ["produtos", "bazar"],
  },

  // Gestão
  {
    key: "compras",
    label: "Compras",
    description: "Pedidos de compra e entradas de mercadoria.",
    category: "gestao",
    requires: ["produtos"],
  },
  {
    key: "estoque",
    label: "Estoque",
    description: "Saldo, ajustes e inventário.",
    category: "gestao",
    requires: ["produtos"],
  },
  {
    key: "fiscal",
    label: "Fiscal",
    description: "Notas fiscais e obrigações fiscais.",
    category: "gestao",
    requires: ["vendas"],
  },
  {
    key: "produtos",
    label: "Produtos",
    description: "Cadastro de produtos, categorias e marcas.",
    category: "gestao",
  },

  // Cadastros
  {
    key: "clientes",
    label: "Clientes",
    description: "Cadastro de clientes e histórico de compras.",
    category: "cadastros",
  },
  {
    key: "fornecedores",
    label: "Fornecedores",
    description: "Cadastro de fornecedores.",
    category: "cadastros",
    requires: ["compras"],
  },

  // Análises
  {
    key: "relatorios",
    label: "Relatórios",
    description: "Relatórios gerenciais e exportação.",
    category: "analises",
  },

  // Sistema
  {
    key: "configuracoes",
    label: "Configurações",
    description: "Configurações do sistema (parâmetros, permissões).",
    category: "sistema",
    mandatory: true,
  },
  {
    key: "usuarios",
    label: "Usuários",
    description: "Cadastro e perfis de usuários da empresa.",
    category: "sistema",
    mandatory: true,
  },

  // Administração (dev)
  {
    key: "empresas",
    label: "Empresas",
    description: "Painel multi-empresa (apenas conta dev).",
    category: "administracao",
    mandatory: true,
    devOnly: true,
  },
];

const MODULE_BY_KEY = MODULES.reduce((acc, m) => {
  acc[m.key] = m;
  return acc;
}, {});

export function getModule(key) {
  return MODULE_BY_KEY[key];
}

/** Lista de keys de módulos obrigatórios (não podem ser desligados). */
export const MANDATORY_MODULE_KEYS = MODULES.filter((m) => m.mandatory).map(
  (m) => m.key,
);

/** Conjunto padrão de módulos habilitados quando a empresa não tem settings ainda. */
export const DEFAULT_ENABLED_MODULES = MODULES.filter(
  (m) => !m.devOnly,
).map((m) => m.key);

/**
 * Verifica se uma key de módulo está ativa dado um conjunto.
 * Quando enabledSet for null/undefined assume "tudo ativo" (boot inicial sem settings).
 */
export function isModuleEnabled(key, enabledSet) {
  const def = MODULE_BY_KEY[key];
  if (!def) return true;
  if (def.mandatory) return true;
  if (!enabledSet) return true;
  if (enabledSet instanceof Set) return enabledSet.has(key);
  if (Array.isArray(enabledSet)) return enabledSet.includes(key);
  return false;
}

/**
 * Para ativar `key`, retorna a lista de keys que faltam ser ativadas (todas as
 * `requires`) e/ou um aviso de `requires_any` (texto pronto para exibir). Vazio = ok.
 */
export function getUnmetDependencies(key, enabledSet) {
  const def = MODULE_BY_KEY[key];
  if (!def) return { missing: [], requiresAnyLabel: null };
  const set = enabledSet instanceof Set ? enabledSet : new Set(enabledSet || []);
  const missing = (def.requires || []).filter((k) => !set.has(k));
  let requiresAnyLabel = null;
  if (def.requiresAny?.length) {
    const someActive = def.requiresAny.some((k) => set.has(k));
    if (!someActive) {
      requiresAnyLabel = def.requiresAny
        .map((k) => MODULE_BY_KEY[k]?.label || k)
        .join(" ou ");
    }
  }
  return { missing, requiresAnyLabel };
}

/**
 * Ao desativar `key`, retorna a lista de módulos que ficariam órfãos
 * (dependem direta ou indiretamente de `key`).
 */
export function getDependentsOf(key, enabledSet) {
  const set = enabledSet instanceof Set ? enabledSet : new Set(enabledSet || []);
  const without = new Set(set);
  without.delete(key);
  const orphans = [];
  for (const m of MODULES) {
    if (m.mandatory) continue;
    if (m.key === key) continue;
    if (!set.has(m.key)) continue;
    const requires = m.requires || [];
    const requiresAny = m.requiresAny || [];
    const missingRequires = requires.some((k) => !without.has(k));
    const lostRequiresAny =
      requiresAny.length > 0 && !requiresAny.some((k) => without.has(k));
    if (missingRequires || lostRequiresAny) orphans.push(m);
  }
  return orphans;
}
