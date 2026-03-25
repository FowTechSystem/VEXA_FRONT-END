# Guia para o front-end — API CRMVEXA

Este repositório é **somente a API** (ASP.NET Core). A interface (React, Vue, Angular, mobile, etc.) deve ficar em **outro projeto** e consumir esta API por HTTP. **Não há obrigação de manter HTML, páginas ou SPA dentro do backend**; o arquivo de demo que existia em `wwwroot` foi removido por isso.

---

## O que o backend **faz**

| Área | Comportamento |
|------|----------------|
| **Autenticação** | `POST /api/Auth/login` — retorna JWT e dados do usuário. Demais rotas exigem `Authorization: Bearer {token}` por padrão. |
| **Multi-empresa** | O escopo da empresa vem do claim `empresa_id` no JWT. Usuário **dev** (`dev@gmail.com`, conforme constantes do sistema) pode forçar empresa com header **`X-Empresa-Id`** (só se a empresa existir e estiver ativa). |
| **JSON** | Respostas e corpos em JSON; nomes em **camelCase** no wire. |
| **CORS** | Já liberado para origens comuns de dev (`localhost:3000`, `5173`, etc.). Se o front rodar em outra origem, é preciso **alterar o CORS no `Program.cs`** no backend. |
| **Compras** | `POST /api/Compras` grava a compra e **registra entrada de estoque** (tabela `Estoques` + `MovimentacoesEstoque`) para cada item, exceto se o status da compra for `cancelada`. |
| **Compra → recebida** | `PATCH /api/Compras/{id}/status` com `recebida` só entra estoque **se ainda não existir movimentação** vinculada a essa compra (evita duplicar quantidade quando o estoque já foi lançado na criação). |
| **Estoque (leitura)** | `GET /api/Estoque` — lista produtos com quantidade atual (paginação, filtro `valor`). **Não há** endpoint de “lançamento manual” de estoque; entradas vêm de compras (e saídas de vendas/fluxos já implementados). |
| **Movimentações** | `GET /api/Estoque/movimentacoes` — histórico (filtros `produtoId`, `tipo`, paginação). Motivos incluem textos como compra lançada ou recebida. |
| **Catálogo público** | `GET /api/Catalogos/publico/{id}` e `GET /api/Catalogos/publico/slug/{slug}` são **[AllowAnonymous]** (sem JWT). |

### Recursos principais (todos sob `/api/...`, salvo anotação)

- **Auth** — login.
- **Empresas, Usuarios, Permissoes** — cadastros e permissões.
- **Clientes, Fornecedores** — cadastros.
- **Produtos, Categorias, Marcas** — catálogo interno.
- **Compras** — CRUD + alteração de status.
- **Vendas, Caixa(s), Condicional** — operação de venda e caixa.
- **Estoque** — listagem e movimentações (leitura).
- **Dashboard** — agregados para painel.
- **Catalogos** — criação/listagem autenticada + rotas públicas acima.

Para detalhes de contrato (campos exatos), use **Swagger** em ambiente de desenvolvimento (`/swagger`).

---

## O que o backend **não faz** (responsabilidade do front)

- **Não renderiza telas** nem define layout, grid visual ou fluxo de navegação.
- **Não substitui** validação de UX (máscaras, mensagens amigáveis): o front deve tratar erros HTTP (`400`, `401`, `404`) e o corpo `{ sucesso, mensagem, errors }` quando existir.
- **Não envia** o header `X-Empresa-Id` sozinho: o front deve enviá-lo quando usar usuário dev testando outra empresa; usuários normais usam só o token.
- **Não hospeda** o build do seu SPA por padrão: em produção, front e API costumam ser servidos separadamente (CDN, S3+CloudFront, Vercel, etc.) ou o front faz proxy para a API.

---

## Fluxo sugerido para telas de **Compra** e **Estoque**

1. **Login** → guardar JWT (e `empresa_id` se precisar exibir).
2. **Lançar compra** → `POST /api/Compras` com `fornecedorId`, `itens[]` (`produtoId`, `quantidade`, `precoUnitario`), `status`, `valorTotal`, etc.
3. **Atualizar grid de estoque** → após sucesso do POST, chamar de novo `GET /api/Estoque` (ou invalidar cache/query do seu estado global) para refletir as novas quantidades.

---

## Base URL

- Padrão local no projeto: **`https://localhost:5001`** (ver `Program.cs` / `launchSettings.json`).

---

## Manutenção deste documento

Quando novos endpoints ou regras de negócio forem adicionados, atualize esta página para o time de front-end não depender de HTML dentro da API.
