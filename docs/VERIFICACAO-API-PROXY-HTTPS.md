# Verificação — API, proxy `/api` e HTTPS

Documento de apoio para **backend**, **infra** e **front** alinharem produção em `https://sistemavexa.com`.

**Antes de alterar o backend**, siga o checklist abaixo. Só mude código/config se algo falhar.

---

## Contexto (produção)

- O site público é **`https://sistemavexa.com`** (HTTPS).
- O navegador chama **`https://sistemavexa.com/api/...`** (mesmo domínio) — **nunca** `http://IP:8080` a partir da página (Mixed Content).
- O **Nginx** (container do front ou host) encaminha **`/api/*`** para a API (ex.: `http://127.0.0.1:8080/api/...`).

---

## Checklist — verificar antes de mudar o backend

### 1. Login direto na API

- **POST** `http://localhost:8080/api/Auth/login` (porta real), body `{ "email": "...", "password": "..." }`.
- Esperado: **200** (token) ou **401** (credenciais) — não **404** na rota correta.

### 2. Porta e bind

- `docker ps`: a porta no **host** deve ser a que o `proxy_pass` usa (ex.: **8080**).
- A API precisa ser alcançável a partir do proxy (rede Docker ou host).

### 3. Prefixo `/api`

- Rotas ASP.NET sob **`/api/...`** (ex.: `/api/Auth/login`; routing case-insensitive).
- O proxy preserva o prefixo **`/api`**.

### 4. CORS

- Com front e API no **mesmo host** (`/api/...` relativo), é **mesma origem** — CORS não é o primeiro suspeito em produção no domínio.

### 5. `X-Forwarded-*`

- Se houver redirect para `http://` ou problemas de cookie `Secure`, revisar `ForwardedHeaders` / `X-Forwarded-Proto` no ASP.NET Core **após** confirmar proxy e login direto.

### 6. POST e 405

- **405** em `/api/...` costuma ser **proxy** (POST não encaminhado), não só controller.

---

## Sintomas → onde olhar

| Sintoma | Prioridade |
|--------|------------|
| 502 / 504 | API fora, porta errada, proxy |
| 404 | Path `/api`, middleware ASP.NET |
| 405 | Configuração Nginx/proxy |
| Mixed Content no browser | Bundle com `http://` + IP — rebuild front sem `VITE_API_URL` HTTP |

---

## Arquivos no repositório do front

- `docker/nginx.conf`, `docker-compose.yml`, `src/config/apiBase.js`, `src/api/authService.js`

---

**Resumo:** validar **POST /api/Auth/login** na API e o **proxy `/api`** antes de mexer em CORS ou forwarded headers.
