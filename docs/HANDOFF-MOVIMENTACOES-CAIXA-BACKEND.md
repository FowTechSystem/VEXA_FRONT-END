# Handoff: Movimentações de caixa (manual) + exclusão na lista

Este documento descreve o que o **front-end VEXA CRM** já chama e o que o **backend** precisa implementar (ou alinhar) para a tela **Movimentações** (`/vendas`), a página **Nova movimentação** (`/vendas/nova-movimentacao`) e a ação **Excluir** no menu de cada linha.

---

## 1. Contexto de produto

- **Movimentações** lista entradas e saídas do período (vendas, compras e, após o backend existir, lançamentos manuais de lucro/despesa).
- **Nova movimentação** permite registrar **lucro (entrada)** ou **despesa (saída)** manualmente, sem passar pelo fluxo de venda do caixa.
- **Excluir** na tabela:
  - Para linha do tipo **venda**: o front chama **cancelamento de venda** (endpoint já previsto no projeto).
  - Para **compra**: `DELETE /compras/{id}` (já existe no front).
  - Para **movimentação manual** (futuro): `DELETE /caixa/movimentacoes/{id}`.

---

## 2. Endpoint já usado hoje

### `GET /caixa/resumo?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD`

Resposta esperada (campos flexíveis — o front aceita PascalCase ou camelCase):

- `totalEntradas` / `TotalEntradas`
- `totalSaidas` / `TotalSaidas`
- `saldoAtual` / `SaldoAtual`
- `movimentacoes` / `Movimentacoes` — array unificado

Cada item do array deve permitir ao front identificar tipo e id para listagem e exclusão:

| Campo sugerido | Uso no front |
|----------------|--------------|
| `tipo` ou `Tipo` | Ver **§2.1** — nunca use `"venda"` para lançamento manual de despesa ou lucro. |
| `id` ou `Id` | Identificador genérico da linha |
| `vendaId` / `VendaId` | Opcional; se preenchido para vendas, usado na prioridade para cancelar |
| `compraId` / `CompraId` | Opcional; id da compra para exclusão |
| `valor` / `Valor` / `valorTotal` | Valor numérico |
| `data` / `Data` / `dataVenda` / `createdAt` | Data/hora do lançamento |
| `descricao` / `Descricao` | Texto exibido na coluna Descrição |
| `formaPagamento` / `FormaPagamento` | Texto ou código (ex.: `dinheiro`, `pix`, `CartaoCredito`) |
| `status` / `Status` | Opcional |

**Recomendação:** para cada linha, retornar sempre um `id` estável e, para vendas/compras, também `vendaId` / `compraId` quando fizer sentido, para o front não confundir id de “movimentação agregada” com id de venda.

### 2.1 Tipo e sinal do valor (correção importante)

**Problema:** Se a API gravar uma despesa manual (ex.: “Pagamento de água”) com `tipo: "venda"` e `valor` positivo, a lista de Movimentações mostra chip verde “Venda” e valor `+ R$`, embora o total de saídas no resumo esteja correto — isso confunde o usuário.

**O que o backend deve fazer:**

1. Para cada item em `movimentacoes`, enviar `tipo` **discriminando** o registro:
   - Venda de caixa: `venda` (idealmente com `vendaId` preenchido).
   - Compra: `compra` (e `compraId` se existir).
   - Lucro / entrada manual: um dentre `entrada_manual`, `entrada_lucro`, `entrada`, `receita`, `lucro`.
   - Despesa / saída manual: um dentre `saida_manual`, `saida_despesa`, `saida`, `despesa`.

2. **Nunca** retornar `tipo: "venda"` para lançamento criado por `POST /caixa/movimentacoes/manual` com `tipo: "saida_despesa"` (nem o inverso para lucro).

3. Opcional mas recomendado: campo explícito de fluxo (o front já interpreta se vier):
   - `natureza` ou `sentido` ou `fluxo`: `"entrada"` | `"saida"` (ou `e` / `s`).

4. Opcional: enviar `valor` **negativo** para saídas; o front normaliza pelo `tipo`, mas um sinal coerente ajuda.

O front aplica ainda **heurísticas** (ex.: descrição com “pagamento de…”, “água”, “aluguel” sem código `VND-`) para corrigir linhas já erradas no backend, mas o correto é a API enviar `tipo` e ids certos desde a origem.

---

## 3. Novo: lançamento manual (lucro ou despesa)

### `POST /caixa/movimentacoes/manual`

**Content-Type:** `application/json`

**Body (contrato atual do front):**

```json
{
  "tipo": "entrada_lucro",
  "valor": 150.5,
  "descricao": "Texto obrigatório",
  "categoria": "Outras Receitas",
  "data": "2026-04-11",
  "observacoes": "Opcional",
  "formaPagamento": "pix"
}
```

- `tipo` (obrigatório):
  - `"entrada_lucro"` — lucro / entrada no caixa.
  - `"saida_despesa"` — despesa / saída.
- `valor` (obrigatório): número &gt; 0 (sempre positivo no JSON; o sentido vem de `tipo`).
- `descricao`, `categoria`, `data` (obrigatórios).
- `observacoes` (opcional).
- `formaPagamento` (opcional): enviado só para `entrada_lucro`. Valores que o front pode enviar: `dinheiro`, `credito`, `debito`, `pix` (string).

**Respostas sugeridas:**

- `201 Created` — corpo com o registro criado (incluindo `id` e `tipo` para aparecer no `GET /caixa/resumo`).
- `400` — validação (mensagem em `message` ou estrutura que o axios já serializa).

**Efeito esperado:** o novo lançamento deve entrar no **mesmo** agregado de `GET /caixa/resumo` (totais e lista), com tipo discriminável (ex.: `entrada_manual` / `saida_manual`).

---

## 4. Novo: exclusão de movimentação manual

### `DELETE /caixa/movimentacoes/{id}`

- `id`: id retornado na criação ou no item de `movimentacoes` do resumo.
- `204 No Content` ou `200` com corpo opcional.
- `404` se não existir.

O front habilita “Excluir” para linhas cujo `tipo` (normalizado) for um destes: `entrada`, `saida`, `entrada_manual`, `saida_manual` **e** houver `exclusaoTipo === movimentacao_manual` na lógica atual.

---

## 5. Exclusão / cancelamento de venda

O front **não** chama `DELETE /vendas/{id}` na tela de Movimentações por padrão. Ele usa o fluxo já existente no cliente:

### `POST /vendas/{id}/cancelar`

**Body:**

```json
{
  "motivo": "Texto — o front envia padrão se o usuário deixar em branco"
}
```

**Comportamento esperado:** cancelar a venda, ajustar estoque e totais conforme regra de negócio, e a linha não deve mais aparecer como venda ativa no resumo (ou deve aparecer com status cancelado — alinhar com o produto).

Opcionalmente o backend pode expor também:

### `DELETE /vendas/{id}`

O arquivo `vendasService.js` já contém um método `delete` para quando esse endpoint existir; a tela de Movimentações **não** depende dele hoje.

---

## 6. Exclusão de compra

### `DELETE /compras/{id}`

Já utilizado pelo front quando a linha é identificada como compra (`tipo === "compra"`).

---

## 7. Checklist para a outra IA (backend)

1. Implementar `POST /caixa/movimentacoes/manual` e persistir com empresa/usuário e auditoria se necessário.
2. Incluir lançamentos manuais em `GET /caixa/resumo` com `tipo` claro (`entrada_manual` / `saida_manual` recomendado).
3. Implementar `DELETE /caixa/movimentacoes/{id}` apenas para registros manuais (não para venda/compra sintética).
4. Garantir que `POST /vendas/{id}/cancelar` funcione com o `id` numérico (ou UUID) que o resumo expõe para vendas.
5. Documentar formato exato de `formaPagamento` no banco (string livre vs enum) alinhado ao caixa (`dinheiro`, `credito`, `debito`, `pix`).

---

## 8. Arquivos no front (referência)

- `src/api/caixaService.js` — `getResumo`, `criarMovimentacaoManual`, `excluirMovimentacaoManual`
- `src/api/vendasService.js` — `cancelar`, `delete` (opcional)
- `src/api/comprasService.js` — `delete`
- `src/utils/movimentacaoCaixa.js` — `resolverTipoMovimentacaoLinha`, `valorMovimentacaoAssinado` (normalização tipo + sinal)
- `src/pages/Vendas.jsx` — lista Movimentações, menu Excluir, diálogo
- `src/pages/Caixa.jsx` — resumo do caixa (grid de movimentações)
- `src/pages/Financeiro.jsx` — movimentações do sistema no mês
- `src/pages/NovaMovimentacaoCaixa.jsx` — formulário nova movimentação
- `src/App.jsx` — rota `vendas/nova-movimentacao`
