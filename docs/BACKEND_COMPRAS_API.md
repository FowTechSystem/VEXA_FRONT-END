# Backend - API de Compras (PUT e DELETE)

## Resumo

O frontend espera os seguintes endpoints para **editar** e **excluir** compras:

---

## PUT /api/compras/:id

**Descrição:** Atualiza uma compra existente.

**Parâmetros:** `id` na URL (ID da compra)

**Body (igual ao POST):**
```json
{
  "fornecedorId": 1,
  "dataPedido": "2025-03-04",
  "dataEntregaPrevista": "2025-03-15",
  "valorTotal": 15000.00,
  "status": "aprovada",
  "observacoes": "Texto opcional",
  "itens": [
    { "produtoId": 1, "quantidade": 10, "precoUnitario": 29.90 },
    { "produtoId": 2, "quantidade": 5, "precoUnitario": 89.90 }
  ]
}
```

**Resposta esperada:** 200 OK com o objeto da compra atualizado (ou 204 No Content)

**Erros:**
- 400: Dados inválidos
- 404: Compra não encontrada

---

## DELETE /api/compras/:id

**Descrição:** Exclui uma compra.

**Parâmetros:** `id` na URL (ID da compra)

**Body:** Nenhum

**Resposta esperada:** 200 OK ou 204 No Content

**Erros:**
- 404: Compra não encontrada
- 409: Se a compra não pode ser excluída (ex.: já recebida e com movimentação de estoque)

---

## GET /api/compras/:id (para Edição)

O frontend chama esse endpoint ao clicar em **Editar** para carregar os dados completos da compra, incluindo os **itens**.

**Resposta esperada (200):**
```json
{
  "id": 1,
  "fornecedorId": 1,
  "fornecedor": { "id": 1, "nome": "Nike" },
  "dataPedido": "2025-03-04",
  "dataEntregaPrevista": "2025-03-15",
  "valorTotal": 15000.00,
  "status": "aprovada",
  "observacoes": "Observações...",
  "itens": [
    {
      "produtoId": 1,
      "produto": { "id": 1, "nome": "Camiseta", "sku": "CAM-001" },
      "quantidade": 10,
      "precoUnitario": 29.90
    }
  ]
}
```

**Campos importantes para o frontend:**
- `fornecedorId`, `fornecedor` (objeto com id e nome)
- `itens`: array com `produtoId`, `produto` (objeto), `quantidade`, `precoUnitario`

---

## Headers

- `Authorization: Bearer <token>`
- `X-Empresa-Id: <id>` (quando usuário dev)
- `Content-Type: application/json`
