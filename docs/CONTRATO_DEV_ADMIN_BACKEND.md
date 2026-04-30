# Contrato Back-end — conta dev / multi-empresa / Configurações

Este documento alinha o front com as validações que o **backend deve aplicar** para que apenas o administrador de desenvolvimento tenha privilégios extras.

## Identidade da conta dev

- **E-mail fixo (front):** `dev@gmail.com`
- Implementação no front: `src/constants/devAdmin.js` (`DEV_ADMIN_EMAIL`, `isDevAdminUser()`).

O backend **não deve** confiar apenas no e-mail vindo do cliente sem validar o token e o usuário no banco. Recomenda-se:

- Manter um utilizador real com esse e-mail **ou**
- Usar um claim/role (`SuperAdmin`, `DevAdmin`, etc.) e documentar o valor esperado.

## Comportamento esperado no front

| Funcionalidade | Visível / permitido só para `dev@gmail.com` |
|----------------|---------------------------------------------|
| Menu **Configurações** (`/configuracoes`) | Sim |
| Menu **Empresas** + cadastro/listagem | Sim |
| Botão **Trocar empresa** / **Entrar em empresa** no header | Sim |
| Header `X-Empresa-Id` (contexto de empresa no painel dev) | Sim (apenas dev) |

Usuários **comuns** devem operar **somente** no contexto da empresa vinculada ao JWT / perfil (sem escolher outra empresa).

## Header HTTP — `X-Empresa-Id`

- Enviado pelo axios **apenas** quando o usuário logado passa em `isDevAdminUser()` **e** existe empresa ativa em `localStorage` (`empresaAtiva`).
- Usuário comum: o front **não** envia `X-Empresa-Id`.

### Backend deve:

1. Ignorar ou rejeitar `X-Empresa-Id` se o usuário autenticado **não** for o admin/dev autorizado.
2. Se for dev e o header vier válido, usar esse ID como contexto de tenant para a requisição (alinhado à regra de negócio da API).
3. Para usuários comuns, derivar tenant apenas do token (claim `empresaId`, usuário-empresa, etc.) — **sem** aceitar empresa arbitrária por header.

## Endpoints restritos ao dev (exemplos já usados pelo front)

| Método | Rota | Observação |
|--------|------|------------|
| GET | `/api/empresas` | Lista empresas — apenas dev |
| POST | `/api/empresas` | Cria empresa — apenas dev |

Outras rotas “globais” que o produto defina (ex.: configurações globais) devem seguir a mesma política.

## Configurações (`/configuracoes`)

Hoje as preferências são persistidas em **localStorage** no browser (`Configuracoes.jsx`). Se no futuro existir API:

- Endpoints de escrita/leitura devem retornar **403** para não-dev.
- Dev pode ter payload amplo; usuário comum não deve alterar parâmetros globais da instalação.

## Resposta HTTP recomendada

- **403 Forbidden** — usuário autenticado mas sem papel dev/admin.
- Corpo JSON opcional: `{ "message": "Acesso restrito ao administrador de desenvolvimento." }`

## Checklist de validação no backend

- [ ] Login retorna JWT com claims suficientes para distinguir dev vs usuário comum (ou validação por e-mail/id interno confiável).
- [ ] Qualquer uso de `X-Empresa-Id` valida que o caller é dev autorizado.
- [ ] `GET/POST /empresas` negam não-dev com 403.
- [ ] Rotas futuras de “configuração global” negam não-dev.
