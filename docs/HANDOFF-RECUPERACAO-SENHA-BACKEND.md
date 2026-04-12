# Handoff — Recuperação e redefinição de senha (backend)

Este documento descreve o contrato esperado pelo **frontend VEXA CRM** para o fluxo “esqueci minha senha”. O backend referenciado no código é **ASP.NET Core** (`/api/Auth/...`), alinhado a `docs/CONTRATO-API-FRONT-BACKEND.md`.

## URLs públicas no front (SPA)

| Rota | Função |
|------|--------|
| `/recuperar-senha` | Usuário informa o e-mail |
| `/redefinir-senha?token=...` | Usuário define nova senha após clicar no link do e-mail |

O **link enviado por e-mail** deve apontar para a origem do front + query string, por exemplo:

```text
https://SEU_DOMINIO/redefinir-senha?token=TOKEN_OPAQUE_AQUI
```

Configure no backend uma variável **`FrontendBaseUrl`** (ou similar) com a URL base do SPA **sem** barra final, e monte o link como `{FrontendBaseUrl}/redefinir-senha?token={token}`.

---

## 1. Solicitar recuperação — `POST /api/Auth/forgot-password`

**Autenticação:** não requer `Authorization` (rota pública).

**Body (JSON, camelCase — aceitar também PascalCase espelhado):**

```json
{
  "email": "usuario@exemplo.com"
}
```

**Comportamento recomendado (segurança):**

1. Validar formato de e-mail.
2. Se o e-mail **existir** e o usuário puder receber reset: gerar um **token opaco** (ou JWT de uso único e curta duração), persistir hash + expiração (ex.: 1–24 h) e enviar o e-mail com o link.
3. Se o e-mail **não existir**: responder **`200 OK`** com o **mesmo formato** de sucesso **sem** revelar que o e-mail não está cadastrado (mitiga enumeração de contas).
4. Limitar taxa por IP/e-mail (**rate limiting**) para evitar abuso.

**Resposta sucesso (200):**

```json
{
  "message": "Se o e-mail estiver cadastrado, você receberá as instruções."
}
```

(O front exibe mensagem genérica própria; o campo `message` é opcional para o UI.)

**Erros opcionais:**

- `429 Too Many Requests` — muitas tentativas (o front exibe aviso específico).
- `400 Bad Request` — e-mail inválido (corpo vazio ou formato inválido).

---

## 2. Redefinir senha — `POST /api/Auth/reset-password`

**Autenticação:** não requer `Authorization` (rota pública).

**Body (JSON):**

```json
{
  "token": "valor-copiado-da-query-string",
  "newPassword": "novaSenhaSegura"
}
```

Aceitar também **`password`** como alias de `newPassword` se preferir no C# (`[JsonPropertyName("newPassword")]` ou DTO com ambos).

**Validações:**

- Token válido, não expirado e não utilizado.
- `newPassword` com política mínima alinhada ao sistema (o front exige **mínimo 6 caracteres**; o backend pode exigir mais).
- Rejeitar token reutilizado após sucesso.

**Resposta sucesso (200):**

```json
{
  "message": "Senha alterada com sucesso."
}
```

**Erros típicos:**

- `400 Bad Request` — token inválido/expirado, senha fraca, corpo inválido. Corpo com `message` ou `Message` em português para exibição no toast do front.

---

## Modelo de dados sugerido (exemplo)

Tabela `PasswordResetToken` (ou similar):

| Campo | Observação |
|-------|------------|
| `Id` | PK |
| `UserId` | FK usuário |
| `TokenHash` | Hash do token (nunca armazenar token puro) |
| `ExpiresAt` | UTC |
| `UsedAt` | null até consumir |
| `CreatedAt` | UTC |

Fluxo: ao solicitar reset, invalidar tokens anteriores não usados do mesmo usuário (opcional mas recomendado).

---

## E-mail

- Assunto sugerido: “Redefinição de senha — VEXA”.
- Corpo em HTML ou texto com o link completo para `/redefinir-senha?token=...`.
- Não incluir a senha nova no e-mail.

---

## CORS / proxy

Em produção o front costuma chamar `/api` no mesmo host (Nginx → API). Garantir que `POST /api/Auth/forgot-password` e `POST /api/Auth/reset-password` estejam acessíveis sem autenticação e sem exigir `X-Empresa-Id` (o front **não** envia esse header nessas rotas).

---

## Referência no código front

- `src/api/authService.js` — `solicitarRecuperacaoSenha`, `redefinirSenhaComToken`
- `src/api/axiosConfig.js` — 401 nessas rotas **não** dispara logout/redirecionamento global
- `src/pages/RecuperarSenha.jsx`, `src/pages/RedefinirSenha.jsx`
