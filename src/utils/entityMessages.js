// src/utils/entityMessages.js

export const successMessages = {
  create: (entityName) => `${entityName} cadastrado com sucesso!`,
  update: (entityName) => `${entityName} atualizado com sucesso!`,
  delete: (entityName) => `${entityName} excluído com sucesso!`,
  fetch: (entityName) => `${entityName} carregado com sucesso!`,
};

export const errorMessages = {
  create: (entityName) =>
    `Não foi possível cadastrar ${entityName.toLowerCase()}.`,
  update: (entityName) =>
    `Não foi possível atualizar ${entityName.toLowerCase()}.`,
  delete: (entityName) =>
    `Não foi possível excluir ${entityName.toLowerCase()}.`,
  fetch: (entityName) =>
    `Não foi possível carregar ${entityName.toLowerCase()}.`,
  notFound: (entityName) => `${entityName} não encontrado.`,
  duplicate: (entityName, field) =>
    `${entityName} com este ${field} já existe.`,
  required: (fieldName) => `${fieldName} é obrigatório.`,
  invalid: (fieldName) => `${fieldName} inválido.`,
  network: () => "Erro de conexão. Verifique sua internet.",
  unauthorized: () => "Você não tem permissão para realizar esta ação.",
  server: () => "Erro no servidor. Tente novamente mais tarde.",
};

export const confirmMessages = {
  delete: (entityName) =>
    `Deseja realmente excluir este ${entityName.toLowerCase()}?`,
  update: (entityName) =>
    `Deseja realmente atualizar este ${entityName.toLowerCase()}?`,
  cancel: (action) => `Deseja realmente cancelar esta ${action}?`,
};

export const validationMessages = {
  required: (fieldName) => `${fieldName} é obrigatório.`,
  maxLength: (fieldName, maxLength) =>
    `${fieldName} deve ter no máximo ${maxLength} caracteres.`,
  minLength: (fieldName, minLength) =>
    `${fieldName} deve ter no mínimo ${minLength} caracteres.`,
  exactLength: (fieldName, length) =>
    `${fieldName} deve ter exatamente ${length} dígitos.`,
  cpfInvalid: () => "CPF inválido.",
  cnpjInvalid: () => "CNPJ inválido.",
  emailInvalid: () => "E-mail inválido.",
  phoneInvalid: () => "Telefone inválido.",
  cepInvalid: () => "CEP inválido.",
  cpfDuplicate: (nomeCompleto) => `CPF já cadastrado para: ${nomeCompleto}`,
  cnpjDuplicate: (nomeCompleto) => `CNPJ já cadastrado para: ${nomeCompleto}`,
};

export const entityNames = {
  cliente: "Cliente",
  clientes: "Clientes",
  fornecedor: "Fornecedor",
  fornecedores: "Fornecedores",
  funcionario: "Funcionário",
  funcionarios: "Funcionários",
  produto: "Produto",
  produtos: "Produtos",
  venda: "Venda",
  vendas: "Vendas",
  usuario: "Usuário",
  usuarios: "Usuários",
};
