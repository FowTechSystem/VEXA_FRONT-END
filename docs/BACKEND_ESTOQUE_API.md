# Backend - API para Módulo de Estoque

## Resumo

O frontend de **Estoque** utiliza os endpoints existentes de **Compras** e **Vendas** para exibir:

1. **Visão Geral:** apenas produtos lançados em compras recebidas
2. **Movimentações:** todas as vendas (cada item = uma saída de estoque)

Não é necessário criar novos endpoints. O backend deve garantir que as respostas atendam ao formato esperado abaixo.

---

## 1. GET /api/compras

**Uso no Estoque:** A página filtra compras com `status === "recebida"` e extrai os produtos dos itens para montar a Visão Geral.

### Resposta esperada

Array de compras (ou objeto com `compras`, `items`, `data`):

```json
[
  {
    "id": 1,
    "fornecedorId": 1,
    "fornecedor": { "id": 1, "nome": "Fornecedor ABC" },
    "dataPedido": "2025-03-04",
    "dataEntregaPrevista": "2025-03-15",
    "valorTotal": 15000.00,
    "status": "recebida",
    "observacoes": "",
    "itens": [
      {
        "produtoId": 1,
        "produto": {
          "id": 1,
          "nome": "Camiseta Básica",
          "sku": "CAM-001",
          "estoqueMinimo": 20,
          "estoqueMaximo": 100,
          "precoCusto": 25.00,
          "precoVenda": 29.90
        },
        "quantidade": 45,
        "precoUnitario": 29.90
      }
    ]
  }
]
```

### Campos obrigatórios para Estoque

| Campo        | Obrigatório | Descrição                                                          |
|-------------|-------------|--------------------------------------------------------------------|
| `status`    | Sim         | Valores: `pendente`, `aprovada`, `recebida`, `cancelada`          |
| `itens`     | Sim         | Array de itens (pode ser vazio)                                    |
| `itens[].produtoId` | Sim | ID do produto                                                      |
| `itens[].quantidade` | Sim | Quantidade recebida                                                |
| `itens[].precoUnitario` | Não | Usado como valor unitário no estoque                             |
| `itens[].produto` | Recomendado | Objeto com `id`, `nome`, `sku`; opcional `estoqueMinimo`, `estoqueMaximo` |

**Observação:** Apenas compras com `status = "recebida"` entram no cálculo do estoque. Os demais status são ignorados.

---

## 2. GET /api/vendas

**Uso no Estoque:** A página usa as vendas para (1) subtrair do estoque na Visão Geral e (2) exibir a tabela de **Movimentações** (saídas).

### Resposta esperada

Array de vendas (ou objeto com `vendas`, `items`, `data`):

```json
[
  {
    "id": 1,
    "clienteId": 2,
    "nomeCliente": "João Silva",
    "dataVenda": "2025-03-10T14:30:00",
    "valorTotal": 450.00,
    "status": "Concluída",
    "observacoes": "",
    "itens": [
      {
        "produtoId": 1,
        "produto": { "id": 1, "nome": "Camiseta Básica", "sku": "CAM-001" },
        "quantidade": 2,
        "precoUnitario": 150.00
      },
      {
        "produtoId": 2,
        "produto": { "id": 2, "nome": "Calça Jeans", "sku": "CAL-002" },
        "quantidade": 1,
        "precoUnitario": 150.00
      }
    ]
  }
]
```

### Campos obrigatórios para Estoque

| Campo                | Obrigatório | Descrição                                                          |
|----------------------|-------------|--------------------------------------------------------------------|
| `id`                 | Sim         | ID da venda                                                        |
| `status`             | Sim         | Vendas com status `"Cancelada"` (case-insensitive) são ignoradas  |
| `dataVenda` ou `data`| Sim         | Data/hora da venda (para ordenação e exibição)                     |
| `itens`              | **Sim**     | Array de itens vendidos                                            |
| `itens[].produtoId`  | Sim         | ID do produto                                                      |
| `itens[].quantidade` | Sim         | Quantidade vendida                                                 |
| `itens[].produto`    | Recomendado | Objeto com `id`, `nome`, `sku` para exibição na tabela            |
| `nomeCliente`        | Não         | Usado nas observações da movimentação                              |

### Importante

O frontend **precisa** do campo `itens` em cada venda retornada pelo `GET /api/vendas`. Se a lista não incluir os itens, a tabela de Movimentações ficará vazia. Duas opções:

1. Incluir os itens na resposta de `GET /api/vendas` (recomendado)
2. Ou o frontend precisaria chamar `GET /api/vendas/:id` para cada venda, gerando muitas requisições

---

## Headers

- `Authorization: Bearer <token>`
- `X-Empresa-Id: <id>` (quando usuário dev)
- `Content-Type: application/json`

---

## Lógica do frontend (referência)

### Visão Geral – produtos em estoque

1. Busca `GET /api/compras`
2. Filtra compras com `status === "recebida"`
3. Para cada compra, percorre `itens` e agrega por `produtoId`: soma `quantidade` (entradas)
4. Busca `GET /api/vendas`
5. Para cada venda (exceto cancelada), percorre `itens` e subtrai `quantidade` por produto (saídas)
6. `estoqueAtual = entradas - saídas` por produto
7. Exibe apenas produtos que aparecem nos itens das compras recebidas

### Movimentações – saídas de vendas

1. Busca `GET /api/vendas`
2. Filtra vendas não canceladas
3. Para cada item de cada venda, cria uma linha: tipo "Saída", produto, quantidade, motivo "Venda #id"
4. Ordena por data (mais recente primeiro)
