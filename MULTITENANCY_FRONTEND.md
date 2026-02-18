# Multi-tenancy (EmpresaId) – Frontend

Este documento descreve o que o **frontend** faz para funcionar com o backend multi-tenant (um banco, coluna `EmpresaId` em todas as tabelas, JWT com claim `empresa_id`).

---

## O que o backend faz (referência)

- Todas as tabelas têm **`EmpresaId`**; um único banco serve várias empresas.
- Entidade **Empresa** (tabela `Empresas`) com Id, Nome, NomeFantasia, CNPJ, etc.
- No **login**, a API retorna `user.empresaId` e o JWT inclui o claim **`empresa_id`**.
- Listagens, criações, atualizações e exclusões usam o `EmpresaId` do token; **não** é necessário enviar `empresaId` no body nem na query.

---

## O que o frontend faz (implementado)

### 1. Guardar `empresaId` (e user) no login

- A resposta do login é esperada no formato:

```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "empresaId": 1,
    "nome": "João",
    "email": "joao@empresa.com",
    "perfil": "Administrador"
  }
}
```

- O frontend **salva** o objeto `user` completo em `localStorage` (chave `userData`) junto com o `token`. Assim `user.empresaId` (e `user.empresaNome`, se a API enviar) fica disponível.

### 2. Enviar o token em todas as requisições autenticadas

- Todas as chamadas à API (exceto login) enviam:

```http
Authorization: Bearer <token>
```

- Configurado em **`src/api/axiosConfig.js`** (interceptor de request). Não se usa header `X-Empresa-Id`; o backend obtém a empresa só do JWT.

### 3. Não enviar `empresaId` no body nem na query

- **POST/PUT** (criar/editar usuário, cliente, fornecedor, produto, venda, compra, etc.): **não** incluir `empresaId` no payload. A API define o `EmpresaId` pelo token.
- **GET** (listagens e filtros): **não** enviar `empresaId` na query; o backend já filtra pela empresa do token.

### 4. Exibir “empresa atual”

- No **Header** é exibido `user.empresaNome` (se a API retornar) ou `Empresa #${user.empresaId}`.
- Dados obtidos com **`authService.getUsuario()`**, que retorna o `user` salvo no login (incluindo `empresaId`).

### 5. Logout

- **`authService.logout()`** remove `token` e `user` do `localStorage`/sessionStorage, para o próximo login trazer dados novos.

### 6. Troca de empresa (futuro)

- Hoje o backend assume **um usuário = uma empresa** (o `empresaId` vem do usuário no login e fica no token).
- Se no futuro houver “trocar de empresa”, será necessário novo login ou um endpoint que devolva um **novo token** com outro `empresa_id`. Até lá, basta usar o `empresaId` retornado no login.

---

## Checklist

- [x] Resposta do login: ler e guardar `user.empresaId` (e o `token`).
- [x] Header das requisições: sempre `Authorization: Bearer <token>`.
- [x] Body (POST/PUT): não enviar `empresaId`.
- [x] Queries (GET): não enviar `empresaId`; o backend filtra pelo token.
- [x] Exibição (nome da empresa): usar `authService.getUsuario()` (empresaId / empresaNome).
- [x] Logout: remover `token` e `user`.

---

## Resumo em uma frase

**Guarde `user.empresaId` e o token no login; envie só o token no header; não envie `empresaId` no body nem na URL.** O backend aplica o tenant correto pelo JWT.
