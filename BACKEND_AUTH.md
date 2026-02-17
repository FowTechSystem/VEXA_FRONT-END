# Integração de Autenticação - Backend

Este documento descreve o que o backend deve implementar para integrar com o login do CRM VEXA.

## Endpoint obrigatório

### POST `/api/auth/login`

**Request:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Response 200 (sucesso):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "Nome do Usuário",
    "email": "usuario@email.com",
    "perfil": "Administrador"
  }
}
```

O campo `user` é opcional, mas recomendado.

**Response 401 (credenciais inválidas):**
```json
{
  "message": "E-mail ou senha inválidos"
}
```

**Response 500 (erro interno):**
```json
{
  "message": "Erro interno do servidor"
}
```

---

## Token

- O frontend envia o token no header `Authorization: Bearer {token}` em todas as requisições.
- O backend deve validar o token em **todas as rotas protegidas**.
- Se o token for inválido ou expirado, retornar **401 Unauthorized**.
- Ao receber 401, o frontend faz logout e redireciona para `/login`.

---

## Logout

O logout é feito no frontend (remoção do token). O backend não precisa de endpoint de logout, mas pode implementar invalidação de token se desejar.

---

## Resumo para a IA do Backend

1. Criar rota `POST /api/auth/login` que recebe `email` e `password`.
2. Validar credenciais (banco de dados, etc.).
3. Se válido: gerar JWT e retornar `{ token, user? }`.
4. Se inválido: retornar 401 com `{ message: "E-mail ou senha inválidos" }`.
5. Em todas as rotas protegidas: validar o header `Authorization: Bearer {token}` e retornar 401 se inválido.
