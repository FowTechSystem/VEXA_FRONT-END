# Backend - API para o Dashboard

## Resumo

O **Dashboard** consome os endpoints de **Vendas**, **Clientes** e **Produtos** para exibir:

| Bloco                 | Fonte de dados            | Filtro              |
|-----------------------|---------------------------|---------------------|
| Faturamento do Mês    | Lucro (venda - custo)     | Mês selecionado     |
| Total de Vendas       | Quantidade de vendas      | Mês selecionado     |
| Novos Clientes        | Clientes cadastrados      | Mês selecionado     |
| Ticket Médio          | valorTotal / nº vendas    | Mês selecionado     |
| Metas do Mês          | Valor bruto / metas       | Mês selecionado     |
| Faturamento Mensal    | Valor bruto por mês       | Ano selecionado     |
| Vendas por Categoria  | Roupas, Calçados, Acessórios | Mês selecionado |
| Produtos Mais Vendidos| Top 5 por quantidade      | Mês selecionado     |
| Estoque Crítico       | 5 produtos com menor estoque | Produtos        |
| Top Vendedores        | Vendas por vendedor       | Mês selecionado     |
| Formas de Pagamento   | Distribuição por forma    | Mês selecionado     |

Não é necessário criar novos endpoints. O backend deve garantir que as respostas atendam ao formato esperado abaixo.

---

## Endpoints consumidos

O Dashboard chama em paralelo com parâmetros de paginação:

- `GET /api/vendas?pagina=1&tamanho=500`
- `GET /api/clientes?pagina=1&tamanho=500`
- `GET /api/produtos?pagina=1&tamanho=500`

**Importante:** O frontend solicita até 500 registros por vez. Garanta que o backend aceite `tamanho=500` e retorne os dados nessa estrutura paginada.

---

## 1. GET /api/vendas

### Formato esperado

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
    "formaPagamento": "pix",
    "vendedorId": 1,
    "vendedor": { "id": 1, "nome": "Ana Paula" },
    "usuarioId": 1,
    "usuario": { "id": 1, "nome": "Ana Paula" },
    "observacoes": "",
    "itens": [
      {
        "produtoId": 1,
        "produto": {
          "id": 1,
          "nome": "Camiseta Básica",
          "sku": "CAM-001",
          "precoVenda": 29.90,
          "precoCusto": 25.00,
          "categoria": { "id": 1, "nome": "Roupas" }
        },
        "quantidade": 2,
        "precoUnitario": 29.90
      }
    ]
  }
]
```

### Campos usados pelo Dashboard

| Campo                    | Obrigatório | Uso |
|--------------------------|-------------|-----|
| `id`                     | Sim         | Identificação |
| `status`                 | Sim         | Vendas com status `"Cancelada"` (case-insensitive) são ignoradas |
| `dataVenda` / `data` / `createdAt` | Sim | Filtro por mês/ano e gráfico de faturamento |
| `valorTotal`             | Sim         | Faturamento, ticket médio, metas, formas de pagamento, top vendedores |
| `formaPagamento`         | Sim*        | Formas de pagamento; valores aceitos: `credito`, `debito`, `pix`, `dinheiro` (ou variações: `cred`, `credito`, `pix`, etc.) |
| `vendedorId` / `usuarioId` | Não      | Top vendedores – identificador do vendedor |
| `vendedor` / `usuario`   | Não         | Top vendedores – objeto com `id`, `nome` |
| `nomeVendedor`           | Não         | Top vendedores – nome alternativo |
| `itens`                  | **Sim**     | Faturamento (lucro), vendas por categoria, produtos mais vendidos |
| `itens[].produtoId`      | Sim         | Agrupamento por produto |
| `itens[].quantidade`     | Sim         | Cálculos e top produtos |
| `itens[].precoUnitario`  | Sim         | Valor da venda |
| `itens[].produto`        | Recomendado | `nome`, `precoVenda`, `precoCusto`, `categoria` |
| `itens[].produto.categoria` | Recomendado | Objeto com `nome` – para vendas por categoria |

### Forma de pagamento

O frontend reconhece, em texto, por padrões como:

- **Crédito:** `cred`, `credito`
- **Débito:** `deb`, `debito`
- **PIX:** `pix`
- **Dinheiro:** `dinhe`, `dinheiro`

Valores não reconhecidos são tratados como **Crédito**.

---

## 2. GET /api/clientes

### Formato esperado

Array de clientes (ou objeto com `clientes`, `items`, `data`):

```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    "dataCriacao": "2025-03-05T10:00:00"
  }
]
```

### Campos usados

| Campo                  | Obrigatório | Uso |
|------------------------|-------------|-----|
| `dataCriacao` / `createdAt` / `created_at` | Sim | Contagem de **Novos Clientes** no mês filtrado |

---

## 3. GET /api/produtos

### Formato esperado

Array de produtos (ou objeto com `produtos`, `items`, `data`):

```json
[
  {
    "id": 1,
    "nome": "Camiseta Básica",
    "sku": "CAM-001",
    "quantidadeEstoque": 45,
    "estoqueMinimo": 20,
    "estoqueMaximo": 100,
    "precoCusto": 25.00,
    "precoVenda": 29.90,
    "categoria": { "id": 1, "nome": "Roupas" },
    "categoriaNome": "Roupas"
  }
]
```

### Campos usados

| Campo              | Obrigatório | Uso |
|--------------------|-------------|-----|
| `id`               | Sim         | Mapeamento produto ↔ estoque |
| `nome`             | Sim         | Exibição |
| `quantidadeEstoque` / `estoque` | Sim | Estoque crítico – ordenação por menor estoque |
| `estoqueMinimo`    | Sim         | Estoque crítico – status crítico/baixo |
| `categoria`        | Não         | Fallback para vendas por categoria (quando `itens[].produto.categoria` não vem) |
| `categoriaNome`    | Não         | Mesmo que acima |

---

## Mapeamento de categorias (Vendas por Categoria)

O frontend agrupa produtos em 3 categorias a partir do `nome` da categoria:

| Categoria   | Palavras-chave no nome da categoria |
|-------------|-------------------------------------|
| **Roupas**  | ropa, vestu |
| **Calçados**| calcad, tenis, sapato, bota, chinelo |
| **Acessórios** | acessor, bolsa, relogio, mochila |

Se o nome da categoria não se encaixar em nenhuma, o produto não entra em nenhuma das 3 categorias do gráfico.

---

## Lógica do frontend (referência)

### Cards principais

1. **Faturamento do Mês (Lucro):** soma de `(precoVenda - precoCusto) × quantidade` em todos os itens das vendas do mês.
2. **Total de Vendas:** quantidade de vendas do mês (exceto canceladas).
3. **Novos Clientes:** clientes com `dataCriacao` no mês.
4. **Ticket Médio:** `soma(valorTotal)` / `quantidade de vendas` do mês.
5. **Metas do Mês:** progresso das metas configuráveis em relação ao valor bruto das vendas.

### Gráficos e listas

1. **Faturamento Mensal:** soma de `valorTotal` por mês no ano selecionado.
2. **Vendas por Categoria:** soma do valor dos itens por categoria (Roupas, Calçados, Acessórios) no mês.
3. **Produtos Mais Vendidos:** top 5 produtos por quantidade vendida no mês.
4. **Estoque Crítico:** 5 produtos com menor `quantidadeEstoque`, ordenados do menor para o maior.
5. **Top Vendedores:** top 3 vendedores por valor total vendido no mês.
6. **Formas de Pagamento:** distribuição do valor das vendas do mês por forma de pagamento.

---

## Headers

- `Authorization: Bearer <token>`
- `X-Empresa-Id: <id>` (contexto multi-tenant, quando aplicável)
- `Content-Type: application/json`

---

## Resposta paginada e nomenclatura

O frontend suporta respostas com propriedades em **camelCase** ou **PascalCase** (comum em APIs .NET):

| camelCase   | PascalCase (fallback) |
|-------------|------------------------|
| `vendas`    | `Vendas`               |
| `clientes`  | `Clientes`             |
| `produtos`  | `Produtos`             |
| `dataVenda` | `DataVenda`            |
| `valorTotal`| `ValorTotal`           |
| `formaPagamento` | `FormaPagamento`  |
| `itens`     | `Itens`                |
| `vendedorId`| `VendedorId`           |

Configure o serializador JSON do .NET para **camelCase** (`JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase`) para compatibilidade com o frontend.

---

## Checklist de implementação no backend

- [ ] `GET /api/vendas` retorna array de vendas com `itens` completos
- [ ] Cada venda tem `dataVenda` (ou `data`/`createdAt`), `valorTotal`, `formaPagamento`
- [ ] Cada item tem `produtoId`, `quantidade`, `precoUnitario`, `produto` (com `precoCusto`, `precoVenda`, `categoria`)
- [ ] Cada venda tem `vendedorId`/`vendedor` ou `usuarioId`/`usuario` para Top Vendedores
- [ ] `GET /api/clientes` retorna array com `dataCriacao` (ou `createdAt`)
- [ ] `GET /api/produtos` retorna array com `quantidadeEstoque`, `estoqueMinimo`, `categoria` (ou `categoriaNome`)
- [ ] Categorias de produtos com nomes que permitam mapeamento (Roupas, Calçados, Acessórios)
