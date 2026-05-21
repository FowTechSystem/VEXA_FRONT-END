# Prompt para desenvolvimento do backend — Módulo Bazar (VEXA)

> Cole esse arquivo inteiro como contexto para a IA que vai desenvolver o backend.
> Ele é autossuficiente — não depende de nenhum outro documento do repositório.

---

## 1. Contexto do produto

Você vai implementar o backend do módulo **Bazar** do sistema VEXA, um SaaS multi-empresa de gestão para lojas de roupas, calçados e acessórios. O front-end React já está pronto e consumindo endpoints REST sob `/bazar/...`.

O módulo Bazar gerencia **produtos consignados** — pessoas (chamadas "consignantes") deixam peças na loja para venda. Quando vende, a loja repassa um valor combinado ao consignante e fica com a diferença como lucro.

### Glossário

- **Consignante** — pessoa que deixa peças. Cadastro próprio, separado de `fornecedores` (para não poluir o cadastro de fornecedor com gente que só traz roupa).
- **Sacola** — agrupamento lógico de peças que um consignante trouxe de uma vez (uma "entrada"). Facilita o cadastro em lote e a devolução em lote.
- **Peça** — item físico individual (`produtos_bazar`). **Cada peça é única**: não tem quantidade em estoque, sempre é 1.
- **Repasse** — registro financeiro do que a loja deve / pagou ao consignante referente a peças vendidas.

### Regras de negócio inegociáveis

1. **Não há prazo de devolução** — peça fica até vender ou o consignante buscar.
2. **A loja define o preço de venda** — `valor_venda` é definido no cadastro da peça.
3. **Cada peça é única** — sempre `quantidade = 1`, não tem estoque.
4. **Peça vendida não pode ser editada** nem entrar em dois repasses.
5. **Valor de venda ≥ valor de compra** — não pode vender no prejuízo (validar no create).
6. **Soft delete em tudo** — nunca delete fisicamente peça, consignante ou repasse (use `deletado_em` ou flag `ativo`).
7. **Multi-tenancy** — toda query precisa filtrar por `empresa_id` (vem do header `X-Empresa-Id` ou do usuário autenticado, mesma regra do resto do sistema).

---

## 2. Stack e convenções já usadas pelo sistema

- API REST sob o prefixo `/api/...` (front usa `apiBaseURL` configurável)
- Autenticação: **JWT Bearer Token** no header `Authorization`
- Multi-tenancy: header `X-Empresa-Id` (enviado pelo front quando admin troca de empresa)
- Datas em ISO `YYYY-MM-DD` (sem hora) ou `YYYY-MM-DDTHH:mm:ssZ` (com hora)
- Valores monetários como `number` (decimal), nunca string
- Respostas paginadas no formato:
  ```json
  { "items": [...], "totalPaginas": 5, "totalRegistros": 47 }
  ```
- Erros padronizados:
  ```json
  { "message": "Texto amigável para o usuário", "detail": "(opcional, técnico)", "errors": { "campo": ["msg"] } }
  ```
- Códigos HTTP: 200/201 sucesso, 400 validação, 401 não autenticado, 403 sem permissão, 404 não encontrado, 409 conflito (ex.: peça já vendida), 422 regra de negócio violada.

---

## 3. Modelo de dados (schema)

Crie estas tabelas (nomes em snake_case, padrão do sistema). Todas têm `empresa_id`, `criado_em` e `atualizado_em`. Use o adapter de banco que o projeto já usa.

### `bazar_consignantes`
```
id              BIGINT PK
empresa_id      BIGINT NOT NULL (FK empresas)
nome            VARCHAR(120) NOT NULL
telefone        VARCHAR(20)  NOT NULL
cpf             VARCHAR(14)  NULL    -- opcional
observacao      TEXT         NULL
ativo           BOOLEAN      NOT NULL DEFAULT TRUE
criado_em       TIMESTAMP    NOT NULL
atualizado_em   TIMESTAMP    NOT NULL
deletado_em     TIMESTAMP    NULL    -- soft delete

ÍNDICES:
  (empresa_id, ativo)
  (empresa_id, nome)
  (empresa_id, cpf) UNIQUE WHERE cpf IS NOT NULL
```

### `bazar_sacolas`
```
id               BIGINT PK
empresa_id       BIGINT NOT NULL
consignante_id   BIGINT NOT NULL (FK bazar_consignantes)
data_cadastro    DATE   NOT NULL
observacao       TEXT   NULL
criado_em        TIMESTAMP NOT NULL
atualizado_em    TIMESTAMP NOT NULL

ÍNDICES:
  (empresa_id, consignante_id, data_cadastro DESC)
```

### `bazar_produtos`
```
id                BIGINT PK
empresa_id        BIGINT NOT NULL
consignante_id    BIGINT NOT NULL (FK bazar_consignantes)
sacola_id         BIGINT NOT NULL (FK bazar_sacolas)
descricao         VARCHAR(200) NOT NULL
tamanho           VARCHAR(10)  NULL    -- ENUM aplicado pelo front (TAMANHOS_PADRAO)
cor               VARCHAR(40)  NULL    -- ENUM aplicado pelo front (CORES_PADRAO)
valor_compra      DECIMAL(10,2) NOT NULL  -- vai pro consignante
valor_venda       DECIMAL(10,2) NOT NULL  -- preço de venda na loja
codigo_etiqueta   VARCHAR(50)  NULL    -- desabilitado por enquanto, reservado para leitor
status            ENUM('disponivel','vendida','devolvida') NOT NULL DEFAULT 'disponivel'
data_entrada      DATE         NOT NULL
data_venda        DATE         NULL
data_devolucao    DATE         NULL
venda_id          BIGINT       NULL    -- FK vendas (quando vendido pelo PDV)
criado_em         TIMESTAMP    NOT NULL
atualizado_em     TIMESTAMP    NOT NULL
deletado_em       TIMESTAMP    NULL

ÍNDICES (críticos para performance):
  (empresa_id, status)                        -- busca no PDV
  (empresa_id, consignante_id, status)        -- "quanto tenho a pagar pro fulano?"
  (empresa_id, sacola_id)                     -- listagem por sacola
  (empresa_id, codigo_etiqueta) WHERE codigo_etiqueta IS NOT NULL
```

### `bazar_produto_fotos`
```
id                BIGINT PK
produto_id        BIGINT NOT NULL (FK bazar_produtos)
ordem             INT     NOT NULL DEFAULT 0  -- 0, 1, 2 (até 3 fotos)
url               VARCHAR(500) NOT NULL
criado_em         TIMESTAMP NOT NULL

ÍNDICES:
  (produto_id, ordem)
  CHECK (ordem BETWEEN 0 AND 2)
```

### `bazar_repasses`
```
id                BIGINT PK
empresa_id        BIGINT NOT NULL
consignante_id    BIGINT NOT NULL (FK bazar_consignantes)
valor_total       DECIMAL(10,2) NOT NULL
data_geracao      TIMESTAMP NOT NULL
data_pagamento    TIMESTAMP NULL
status            ENUM('pendente','pago') NOT NULL DEFAULT 'pendente'
forma_pagamento   VARCHAR(30) NULL  -- Dinheiro | PIX | Transferência | Outro
observacao        TEXT NULL
criado_por        BIGINT NOT NULL (FK usuarios)   -- auditoria
pago_por          BIGINT NULL (FK usuarios)
criado_em         TIMESTAMP NOT NULL
atualizado_em     TIMESTAMP NOT NULL
deletado_em       TIMESTAMP NULL

ÍNDICES:
  (empresa_id, status, data_geracao DESC)
  (empresa_id, consignante_id, status)
```

### `bazar_repasse_itens`
```
id                BIGINT PK
repasse_id        BIGINT NOT NULL (FK bazar_repasses)
produto_id        BIGINT NOT NULL (FK bazar_produtos)
valor             DECIMAL(10,2) NOT NULL   -- snapshot do valor_compra na hora do repasse

ÍNDICES:
  (repasse_id)
  (produto_id) UNIQUE        -- garante peça em no máximo um repasse
```

> A unicidade do `produto_id` na tabela `bazar_repasse_itens` é a **garantia de que uma peça vendida nunca seja paga duas vezes**.

---

## 4. Endpoints — contratos exatos esperados pelo front-end

O front já está chamando esses endpoints e esperando esses formatos de resposta. Implemente exatamente como descrito. Tudo sob `/api`.

### 4.1 Consignantes

#### `GET /api/bazar/consignantes`
Lista paginada com busca opcional e resumo embutido.

Query params:
- `busca` (string, opcional) — busca em `nome` ou `telefone` com `LIKE %valor%`
- `incluirResumo` (boolean, opcional) — quando `true`, embute o resumo de cada consignante (peças, valores)
- `pagina` (number, opcional, default 1)
- `tamanho` (number, opcional, default 50)

Response (200):
```json
{
  "consignantes": [
    {
      "id": 1,
      "nome": "Alexandre Silva",
      "telefone": "(11) 98765-4321",
      "cpf": "123.456.789-00",
      "observacao": "Cliente recorrente",
      "criadoEm": "2024-09-12",
      "sacolasCount": 4,
      "resumo": {
        "pendente": 340.00,
        "emEstoque": 12,
        "vendidas": 28,
        "devolvidas": 3
      }
    }
  ],
  "totalPaginas": 1,
  "totalRegistros": 7
}
```

> Campos `sacolasCount` e `resumo` só aparecem se `incluirResumo=true`. Calcule de forma agregada (uma única query com JOIN/COUNT, não N+1).

#### `GET /api/bazar/consignantes/recentes?limite=6`
Lista enxuta dos consignantes mais ativos recentemente (ordenar por última sacola criada). Usado nos chips de atalho do hub.

Response:
```json
[
  { "id": 1, "nome": "Alexandre Silva", "telefone": "(11) 98765-4321" }
]
```

#### `GET /api/bazar/consignantes/resumo`
Resumo geral do módulo (cards do topo do hub + alerta).

Response:
```json
{
  "pendenteTotal": 1240.00,
  "consignantesPendentes": 3,
  "emEstoque": 87,
  "vendidoMes": 23
}
```

Cálculos:
- `pendenteTotal` — soma de `valor_compra` de peças vendidas que **não estão em nenhum repasse**.
- `consignantesPendentes` — DISTINCT count de consignantes que têm `pendenteTotal > 0`.
- `emEstoque` — count de peças com `status = 'disponivel'`.
- `vendidoMes` — count de peças com `status = 'vendida'` e `data_venda` no mês corrente.

#### `GET /api/bazar/consignantes/:id`
Detalhes de um consignante, com resumo embutido.

Response (200):
```json
{
  "id": 1,
  "nome": "Alexandre Silva",
  "telefone": "(11) 98765-4321",
  "cpf": "123.456.789-00",
  "observacao": "...",
  "criadoEm": "2024-09-12",
  "resumo": {
    "pendente": 340.00,
    "emEstoque": 12,
    "vendidas": 28,
    "devolvidas": 3
  }
}
```

Erros:
- `404` se não existe ou foi soft-deletado

#### `GET /api/bazar/consignantes/:id/resumo`
Apenas o objeto `resumo` do consignante.

#### `POST /api/bazar/consignantes`
Cadastro.

Request:
```json
{
  "nome": "Alexandre Silva",
  "telefone": "(11) 98765-4321",
  "cpf": "123.456.789-00",
  "observacao": "Anotação interna"
}
```

Validações:
- `nome` obrigatório (1..120 chars)
- `telefone` obrigatório, mínimo 10 dígitos depois de remover não-numéricos
- `cpf` opcional; se vier, validar formato (algoritmo) e unicidade por `empresa_id`

Response (201): o objeto criado, no mesmo shape do `GET /:id`.

#### `PUT /api/bazar/consignantes/:id`
Update parcial dos mesmos campos do POST.

#### `DELETE /api/bazar/consignantes/:id`
**Soft delete**. Recusar (`409`) se existem peças vinculadas que não foram todas devolvidas. Caso contrário, marcar `deletado_em = now()`, `ativo = false`.

---

### 4.2 Sacolas

#### `GET /api/bazar/consignantes/:consignanteId/sacolas?incluirResumo=true`
Lista as sacolas de um consignante, **ordenadas da mais recente para a mais antiga**.

Response:
```json
[
  {
    "id": 9001,
    "consignanteId": 1,
    "dataCadastro": "2026-04-10",
    "observacao": "Verão 2026",
    "total": 5,
    "disponiveis": 3,
    "vendidas": 1,
    "devolvidas": 1,
    "valorVenda": 535.00,
    "valorRepasse": 200.00,
    "podeDevolverTudo": false
  }
]
```

Campos derivados (quando `incluirResumo=true`):
- `total` = nº de peças na sacola (excluindo soft-deletadas)
- `disponiveis`, `vendidas`, `devolvidas` = counts por status
- `valorVenda` = SUM(`valor_venda`) das peças
- `valorRepasse` = SUM(`valor_compra`) das peças
- `podeDevolverTudo` = `vendidas == 0 && total > 0`

#### `GET /api/bazar/sacolas/:id`
Detalhe individual da sacola (mesmo shape acima).

#### `POST /api/bazar/sacolas`  ⚠️ **endpoint crítico — usar transação**
Cadastra a sacola e todas as peças em uma única transação.

Request:
```json
{
  "consignanteId": 1,
  "observacao": "Verão 2026",
  "pecas": [
    {
      "descricao": "Vestido floral midi",
      "tamanho": "M",
      "cor": "Verde",
      "valorCompra": 35.00,
      "valorVenda": 89.00
    },
    { "...": "..." }
  ]
}
```

Validações por peça:
- `descricao` obrigatória (1..200 chars)
- `valorCompra` numérico ≥ 0
- `valorVenda` numérico ≥ 0
- `valorVenda >= valorCompra` (não pode vender no prejuízo)
- `tamanho`/`cor` opcionais (front limita à lista padrão, backend só armazena)

Lógica:
1. Inicia transação
2. Valida consignante existe, está `ativo` e pertence à empresa
3. Cria registro em `bazar_sacolas`
4. Para cada peça: insere em `bazar_produtos` com `status='disponivel'`, `data_entrada=now()::date`, `sacola_id` da sacola criada
5. Se qualquer erro → ROLLBACK
6. Retorna a sacola com os IDs gerados — front usa esses IDs para subir as fotos depois.

Response (201):
```json
{
  "id": 9010,
  "consignanteId": 1,
  "dataCadastro": "2026-05-21",
  "observacao": "Verão 2026",
  "pecas": [
    { "id": 199 },
    { "id": 200 }
  ]
}
```

⚠️ A ordem do array `pecas` na resposta **deve ser idêntica** à do request — o front envia upload de fotos com `pecas[idx].id`.

#### `POST /api/bazar/pecas/:id/fotos`  (multipart/form-data)
Upload de até 3 fotos para uma peça.

- Campo: `files` (1..3 imagens, máx 1MB cada após o upload)
- Validar `Content-Type` começa com `image/`
- Redimensionar para **800px no maior lado** + comprimir para ~200KB antes de salvar no storage
- Salvar URL pública em `bazar_produto_fotos` com `ordem` sequencial (0, 1, 2)
- Recusar (`409`) se a peça já tem 3 fotos e o upload faria exceder

Storage: usar o mesmo storage do resto do sistema (S3 / Cloudinary / disco local — siga o padrão de `clientesService.uploadFoto` se existir).

Response (200):
```json
{
  "fotos": [
    { "id": 51, "url": "https://storage.../produto-199-0.jpg", "ordem": 0 }
  ]
}
```

#### `PUT /api/bazar/sacolas/:id/devolver`
**Devolução em lote** — marca todas as peças disponíveis da sacola como devolvidas.

Lógica:
1. Carrega a sacola e suas peças
2. Se **qualquer peça** está vendida → recusar com `422` e mensagem clara: `"Esta sacola tem peças vendidas. Devolva apenas as disponíveis individualmente."`
3. UPDATE em lote: `status='devolvida'`, `data_devolucao=now()::date` para todas com `status='disponivel'`

Response (200): a sacola atualizada com o resumo recalculado.

---

### 4.3 Peças

#### `GET /api/bazar/pecas`
Lista com filtros.

Query params:
- `consignanteId` (number, opcional)
- `sacolaId` (number, opcional)
- `status` (string: `disponivel` | `vendida` | `devolvida`, opcional)
- `dataInicio`, `dataFim` (`YYYY-MM-DD`, opcional, filtra por `data_entrada`)
- `pagina`, `tamanho` (opcionais)

Response:
```json
{
  "pecas": [
    {
      "id": 101,
      "consignanteId": 1,
      "sacolaId": 9001,
      "descricao": "Vestido floral midi",
      "tamanho": "M",
      "cor": "Verde",
      "valorCompra": 35.00,
      "valorVenda": 89.00,
      "fotos": [
        { "id": 51, "url": "https://...", "ordem": 0 }
      ],
      "status": "disponivel",
      "dataEntrada": "2026-04-10",
      "dataVenda": null,
      "dataDevolucao": null,
      "vendaId": null
    }
  ],
  "totalPaginas": 1,
  "totalRegistros": 12
}
```

#### `GET /api/bazar/pecas/:id`
Detalhe individual (mesmo shape).

#### `PUT /api/bazar/pecas/:id`
Edição.

Validações duras:
- **Recusar (`422`) se `status != 'disponivel'`** — peça vendida/devolvida não pode ser editada
- Mesmas validações do create (`valorVenda >= valorCompra`, etc.)

#### `PUT /api/bazar/pecas/:id/devolver`
Marca uma peça individual como devolvida.

Validações:
- Recusar (`422`) se `status != 'disponivel'`

#### `DELETE /api/bazar/pecas/:id`
**Soft delete**. Recusar (`422`) se a peça já foi vendida ou entrou em algum repasse.

---

### 4.4 Repasses

#### `GET /api/bazar/repasses/pendentes`
Lista os consignantes que têm peças vendidas sem repasse.

Lógica (query agrupada):
```sql
SELECT
  c.id, c.nome, c.telefone,
  COUNT(p.id) AS qtd_pecas,
  SUM(p.valor_compra) AS total
FROM bazar_consignantes c
JOIN bazar_produtos p ON p.consignante_id = c.id
LEFT JOIN bazar_repasse_itens ri ON ri.produto_id = p.id
WHERE c.empresa_id = :empresa_id
  AND c.deletado_em IS NULL
  AND p.status = 'vendida'
  AND ri.id IS NULL
GROUP BY c.id, c.nome, c.telefone
HAVING SUM(p.valor_compra) > 0
ORDER BY total DESC
```

Response (recomendado embutir as peças pendentes — front usa direto no modal):
```json
[
  {
    "consignante": { "id": 1, "nome": "Alexandre Silva", "telefone": "(11) 98765-4321" },
    "pecas": [
      {
        "id": 103,
        "descricao": "Bolsa de couro pequena",
        "tamanho": "U",
        "cor": "Caramelo",
        "valorCompra": 70.00,
        "dataVenda": "2026-04-18"
      }
    ],
    "total": 70.00
  }
]
```

#### `GET /api/bazar/consignantes/:id/repasses/pendentes`
Mesmo conteúdo da entrada acima, mas restrito a UM consignante. Usado quando o usuário entra em `/bazar/repasses?consignanteId=:id`.

#### `GET /api/bazar/repasses`
Lista histórico (todos os repasses já gerados).

Query params:
- `status` (`pendente` | `pago`, opcional)
- `consignanteId` (number, opcional)
- `dataInicio`, `dataFim` (filtra por `data_geracao`)
- `pagina`, `tamanho`

Response:
```json
{
  "repasses": [
    {
      "id": 5001,
      "consignanteId": 1,
      "consignante": { "id": 1, "nome": "Alexandre Silva", "telefone": "..." },
      "data": "2026-04-22",
      "valor": 70.00,
      "formaPagamento": "PIX",
      "status": "pago",
      "pecasIds": [103],
      "observacao": "Repasse referente à bolsa vendida."
    }
  ],
  "totalPaginas": 1,
  "totalRegistros": 3
}
```

#### `POST /api/bazar/repasses`  ⚠️ **endpoint crítico — usar transação**

Request:
```json
{
  "consignanteId": 1,
  "pecasIds": [103, 104],
  "formaPagamento": "PIX",
  "observacao": "Pagamento referente a abril."
}
```

Lógica:
1. Inicia transação
2. Valida que cada peça em `pecasIds`:
   - Pertence ao `consignanteId` informado
   - Está com `status='vendida'`
   - **Não está em outro `bazar_repasse_itens`** (a unique constraint garante, mas valide antes para dar erro amigável)
3. Calcula `valor_total = SUM(valor_compra)` das peças
4. Insere em `bazar_repasses` com `status='pendente'`, `criado_por = usuario_logado`, `data_geracao = now()`
5. Para cada peça, insere em `bazar_repasse_itens` (`repasse_id`, `produto_id`, `valor = peca.valor_compra`)
6. COMMIT

Response (201): o repasse criado.

⚠️ Se duas requisições tentarem criar repasse com a mesma peça simultaneamente, a unique constraint em `bazar_repasse_itens(produto_id)` impede inconsistência — mas trate o conflito e devolva `409` com mensagem clara: `"Uma das peças já foi incluída em outro repasse."`

#### `PUT /api/bazar/repasses/:id/pagar`
Marca como pago.

Lógica:
- Recusar (`422`) se já está `pago`
- UPDATE: `status='pago'`, `data_pagamento=now()`, `pago_por = usuario_logado`
- Se vier `formaPagamento` no body e ainda não tinha sido definida, salvar

#### `GET /api/bazar/repasses/:id`
Detalhe completo (inclui lista de peças e dados do consignante).

#### `DELETE /api/bazar/repasses/:id`
**Cancelamento** (soft delete). Recusar (`422`) se `status='pago'`. Ao cancelar, as peças voltam a aparecer em "pendentes".

---

### 4.5 Integração com o Caixa (PDV)  ⚠️ **CRÍTICO**

Aqui é onde a maioria dos sistemas quebra. Você vai alterar endpoints existentes do PDV.

#### Modificar `GET /api/produtos/busca` (ou equivalente que o PDV usa)

Hoje o endpoint busca em `produtos` (estoque normal). Adicionar `UNION` com `bazar_produtos WHERE status='disponivel'` e retornar campo `tipo`:

```json
[
  { "id": 45, "tipo": "normal",  "nome": "Camiseta básica branca", "precoVenda": 49.90, "estoque": 7 },
  {
    "id": 12, "tipo": "bazar",   "nome": "Vestido floral midi",
    "precoVenda": 89.00,
    "consignanteNome": "Alexandre Silva",
    "tamanho": "M", "cor": "Verde"
  }
]
```

O front usa o campo `tipo` para mostrar um badge amarelo "BAZAR" na linha + o nome do consignante em texto discreto.

#### Modificar `POST /api/vendas` (registrar venda)

Quando o body tem itens com `tipo: 'bazar'`:

```json
{
  "itens": [
    { "produtoId": 45, "tipo": "normal", "quantidade": 2 },
    { "produtoId": 12, "tipo": "bazar", "quantidade": 1 }
  ],
  "clienteId": 7,
  "formaPagamento": "PIX"
}
```

Para cada item `tipo='bazar'`, **dentro da transação da venda**:

1. `SELECT ... FROM bazar_produtos WHERE id = ? FOR UPDATE` — **lock obrigatório** para evitar venda duplicada da mesma peça em caixas simultâneos
2. Verificar `status='disponivel'`. Se não → `409 Conflict` com mensagem: `"A peça '{descricao}' do consignante {nome} já foi vendida ou devolvida."`
3. UPDATE: `status='vendida'`, `data_venda=now()::date`, `venda_id = id_da_venda_atual`
4. **Não mexer** em estoque normal (peça é única, não tem quantidade)

Cálculo da venda continua igual. Para relatórios futuros:
```
lucro_venda = SUM(produtos_normais.lucro)
            + SUM(bazar.valor_venda - bazar.valor_compra)
```

#### Endpoint utilitário para cancelamento de venda

Se a venda for cancelada/estornada, reverter peças do bazar para `status='disponivel'`, `data_venda=NULL`, `venda_id=NULL`.

---

### 4.6 Relatórios (opcional nessa fase, mas previsto)

- `GET /api/bazar/relatorios/pendentes-por-consignante` — agrupado, retorna `[{ consignante, qtd_pecas, valor_devido }]`
- `GET /api/bazar/relatorios/estoque-por-consignante` — peças disponíveis por consignante, com valor potencial de venda
- `GET /api/bazar/relatorios/historico-repasses?consignanteId=&dataInicio=&dataFim=` — repasses pagos no período

---

## 5. Pontos de atenção transversais

### Permissões
Crie no mínimo estas duas, separadas:
- `bazar.operar` — cadastrar peça, criar sacola, devolver, ver listas (perfil "caixa/vendedora")
- `bazar.gerenciar_repasses` — gerar repasse, marcar como pago (perfil "dono/gerente")

`DELETE` de consignante e cancelamento de repasse exigem `bazar.gerenciar_repasses`.

### Auditoria
- `bazar_repasses.criado_por` e `pago_por` obrigatórios — dinheiro envolvido precisa de rastro
- Log de auditoria opcional (mas recomendado) em uma tabela `bazar_auditoria(entidade, entidade_id, acao, usuario_id, dados_antes, dados_depois, criado_em)`

### Transações
Endpoints que **obrigatoriamente** rodam em transação atômica:
- `POST /bazar/sacolas` (sacola + N peças)
- `POST /bazar/repasses` (repasse + N itens)
- `PUT /bazar/sacolas/:id/devolver` (atualiza N peças)
- `POST /vendas` quando tem item bazar (lock + update + insert da venda)

### Locks
- `POST /vendas` com itens bazar → `SELECT ... FOR UPDATE` em cada `bazar_produtos.id` **antes** de qualquer outra escrita
- Se preferir, use `SELECT ... FOR UPDATE SKIP LOCKED` para responder rápido com erro em caso de concorrência

### Soft delete
- Nunca `DELETE` físico de `bazar_consignantes`, `bazar_produtos`, `bazar_repasses`
- Use coluna `deletado_em TIMESTAMP NULL` e filtrar `WHERE deletado_em IS NULL` em todas as queries

### Multi-tenancy
Toda query DEVE filtrar `empresa_id = :empresa_atual`. Resolva o `empresa_id` do contexto do request (mesmo padrão usado nos outros services do sistema):
1. Se header `X-Empresa-Id` veio E o usuário é admin → usa esse
2. Senão → usa `empresa_id` do JWT do usuário

### Performance
Índices listados no schema acima cobrem os casos quentes. Em especial:
- `(empresa_id, status)` em `bazar_produtos` — busca do PDV
- `(produto_id)` UNIQUE em `bazar_repasse_itens` — validação "já está em repasse?"
- Endpoint `GET /bazar/consignantes/resumo` é chamado a cada abertura do hub — considere cache curto (60s) por `empresa_id` se ficar lento.

### Uploads
- Tamanho máximo aceito antes do redimensionamento: 10MB (rejeita maiores com `413`)
- Após redimensionar: 800px no maior lado, JPEG/WebP, ~200KB
- Storage: usar o mesmo bucket/pasta do upload de foto de cliente (`clientesService.uploadFoto`)
- Nome do arquivo no storage: `bazar/{empresa_id}/produto-{produto_id}-{ordem}.{ext}` para facilitar limpeza

---

## 6. Checklist de aceitação

Quando terminar, o front deve conseguir fazer **sem alterações**:

- [ ] Hub `/bazar` carrega tabela de consignantes com resumo (sacolas, em estoque, vendidas, pendente)
- [ ] Cards do topo do hub carregam (pendente total, estoque, vendido no mês)
- [ ] Busca por nome/telefone filtra em tempo real (debounce de 350ms no front)
- [ ] Cadastro de novo consignante salva e redireciona pro detalhe
- [ ] Edição de consignante atualiza e refresca
- [ ] Tela do consignante mostra grid de sacolas com resumo agregado por sacola
- [ ] Botão "Devolver tudo" da sacola fica desabilitado quando há venda na sacola
- [ ] Botão "Nova sacola" abre tela cheia com tabela editável
- [ ] Salvar sacola com 10 peças e 2 fotos cada → 1 POST de sacola + 10 POSTs de fotos em paralelo → tudo persiste corretamente
- [ ] Tela `/bazar/consignante/:id/pecas` filtra por status, período e sacolaId (via query string)
- [ ] Marcar peça individual como devolvida funciona
- [ ] Aba "Pendentes" de `/bazar/repasses` lista consignantes com valor a pagar e o total geral confere
- [ ] Modal "Gerar repasse" permite (des)marcar peças e calcula total dinamicamente
- [ ] Após confirmar repasse: peças desaparecem dos pendentes e aparecem no histórico
- [ ] Tentar gerar repasse com peça que já está em outro repasse → erro amigável (não 500)
- [ ] PDV mostra peças do bazar misturadas com produtos normais, com badge "BAZAR"
- [ ] Vender peça do bazar pelo PDV: peça vira `status='vendida'`, aparece em "Pendentes" na próxima carga
- [ ] Duas vendas simultâneas da mesma peça: só uma sucede, a outra recebe erro de conflito
- [ ] Soft delete de consignante com peças ativas é recusado
- [ ] Tudo respeita `empresa_id` (testar com 2 empresas: empresa A não vê dados da B)

---

## 7. Como entregar

1. Migrations criando as 6 tabelas com índices
2. Models/Repositories
3. Services/Controllers seguindo o padrão do projeto
4. Rotas no arquivo principal de routing, sob `/api/bazar/...`
5. Modificações nos endpoints existentes do PDV (busca de produto + criação de venda)
6. Testes unitários cobrindo as regras críticas:
   - Não pode editar peça vendida
   - Não pode gerar 2 repasses com a mesma peça
   - Lock funciona em venda concorrente
   - Devolver sacola com peça vendida falha
   - Soft delete de consignante com peças falha
7. Postman/Insomnia collection (opcional, mas ajuda muito)

Use o **mesmo framework, ORM, padrão de pastas e estilo** do resto do código backend do VEXA. Se houver dúvida sobre algum detalhe não especificado aqui, **siga o padrão de outro módulo já implementado** (Clientes, Produtos, Vendas).
