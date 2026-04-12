# Contrato API (CRMVEXA) ↔ front-end VEXA

O backend é **ASP.NET Core**, API **REST JSON**. O front deve seguir isto.

## 1. URL base (produção)

- Rotas sob o prefixo **`/api`**.
- Em produção: **`https://sistemavexa.com/api/...`** ou paths **relativos** `/api/...` (o browser usa o host HTTPS atual).
- **Nunca** embutir `http://` + IP + porta no bundle quando a página for HTTPS.

**Implementação no front:** `src/config/apiBase.js` (base `/api` ou `VITE_*` em HTTPS). Após mudar `VITE_*`, rodar **`npm run build`** e publicar o artefato.

**Desenvolvimento:** proxy Vite em `/api` → em geral `https://localhost:5001` (ver `vite.config.js`).

## 2. JSON em camelCase

Requests e responses em **camelCase** no fio (`email`, `password`, `token`, `user`, etc.).

## 3. Login

| Item | Valor |
|------|--------|
| Método | `POST` |
| Caminho | `/api/Auth/login` (case-insensitive; o front usa `/Auth/login` relativo à base `/api`) |
| Header | `Content-Type: application/json` |
| Body | `{ "email": "string", "password": "string" }` |

**200:** `token` (string), `user` (objeto: `id`, `empresaId`, `empresaNome`, `nome`, `email`, `perfil`, …).

**401:** credenciais inválidas ou body incompleto; pode vir `{ "message": "..." }`.

**Recuperação de senha (rotas públicas):** `POST /api/Auth/forgot-password` e `POST /api/Auth/reset-password` — especificação completa em [`HANDOFF-RECUPERACAO-SENHA-BACKEND.md`](./HANDOFF-RECUPERACAO-SENHA-BACKEND.md).

## 4. Demais rotas

Enviar **`Authorization: Bearer <token>`** quando a rota exigir autenticação (configurado em `src/api/axiosConfig.js`).

## 5. CORS e mesma origem

`https://sistemavexa.com` + `https://sistemavexa.com/api/...` = **mesma origem**. Problemas em produção: priorizar **URL da API no bundle** e **proxy Nginx** (`/api` → backend).

## 6. Infra

Ver checklist: [`docs/VERIFICACAO-API-PROXY-HTTPS.md`](./VERIFICACAO-API-PROXY-HTTPS.md).
