// src/utils/validators.js
import { validationMessages } from "./entityMessages";

export const validateCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, "");

  if (cpf.length !== 11)
    return { valid: false, message: validationMessages.exactLength("CPF", 11) };
  if (/^(\d)\1{10}$/.test(cpf))
    return { valid: false, message: validationMessages.cpfInvalid() };

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9)))
    return { valid: false, message: validationMessages.cpfInvalid() };

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10)))
    return { valid: false, message: validationMessages.cpfInvalid() };

  return { valid: true };
};

export const validateCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]/g, "");

  if (cnpj.length !== 14)
    return {
      valid: false,
      message: validationMessages.exactLength("CNPJ", 14),
    };
  if (/^(\d)\1{13}$/.test(cnpj))
    return { valid: false, message: validationMessages.cnpjInvalid() };

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0))
    return { valid: false, message: validationMessages.cnpjInvalid() };

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(1))
    return { valid: false, message: validationMessages.cnpjInvalid() };

  return { valid: true };
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(email)) {
    return { valid: false, message: validationMessages.emailInvalid() };
  }
  return { valid: true };
};

export const validateCEP = (cep) => {
  cep = cep.replace(/[^\d]/g, "");
  if (cep.length !== 8) {
    return { valid: false, message: validationMessages.exactLength("CEP", 8) };
  }
  return { valid: true };
};

export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === "") {
    return { valid: false, message: validationMessages.required(fieldName) };
  }
  return { valid: true };
};

export const validateMaxLength = (value, fieldName, maxLength) => {
  if (value && value.length > maxLength) {
    return {
      valid: false,
      message: validationMessages.maxLength(fieldName, maxLength),
    };
  }
  return { valid: true };
};
