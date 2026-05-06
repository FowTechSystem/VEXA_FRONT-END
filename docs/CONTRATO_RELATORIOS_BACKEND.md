# Contrato Back-end - Relatorios (VEXA CRM)

Este documento descreve o contrato esperado pelo front para a tela `Relatorios`.

## Objetivo

Disponibilizar dados para 4 relatorios:

1. Vendas por Periodo
2. Produtos em Estoque
3. Vendas por Cliente
4. Produtos mais vendidos

Todos os relatorios devem funcionar por empresa ativa e, quando aplicavel, por intervalo de datas.

## Regras gerais

- O backend deve respeitar a empresa do contexto autenticado (tenant/empresa ativa).
- Datas no formato `YYYY-MM-DD`.
- Valores monetarios em decimal (BRL).
- Quando nao houver dados, retornar arrays vazios (nao retornar `null`).

## Endpoints sugeridos

## 1) Vendas por Periodo

- **GET** `/api/relatorios/vendas-periodo?dataInicio=2026-04-01&dataFim=2026-04-30`

Resposta:

```json
{
  "dataInicio": "2026-04-01",
  "dataFim": "2026-04-30",
  "totalVendas": 12500.45,
  "quantidadeVendas": 87,
  "vendas": [
    {
      "id": 123,
      "data": "2026-04-12",
      "cliente": "Maria Souza",
      "valor": 450.0,
      "itens": [
        { "produto": "Camiseta Basica", "quantidade": 2, "subtotal": 120.0 }
      ]
    }
  ]
}
```

## 2) Produtos em Estoque

- **GET** `/api/relatorios/produtos-estoque`

Resposta:

```json
{
  "totalProdutos": 120,
  "criticos": 15,
  "normais": 105,
  "produtos": [
    {
      "produto": "Camiseta Basica",
      "sku": "CAM-001",
      "atual": 45,
      "minimo": 20,
      "status": "Normal"
    }
  ]
}
```

## 3) Vendas por Cliente

- **GET** `/api/relatorios/vendas-por-cliente?dataInicio=2026-04-01&dataFim=2026-04-30`

Resposta:

```json
{
  "dataInicio": "2026-04-01",
  "dataFim": "2026-04-30",
  "clientes": [
    {
      "cliente": "Maria Souza",
      "pedidos": 8,
      "valor": 3250.9,
      "ticketMedio": 406.36
    }
  ]
}
```

## 4) Produtos mais vendidos

- **GET** `/api/relatorios/produtos-mais-vendidos?dataInicio=2026-04-01&dataFim=2026-04-30`

Resposta:

```json
{
  "dataInicio": "2026-04-01",
  "dataFim": "2026-04-30",
  "produtos": [
    {
      "produto": "Camiseta Basica",
      "quantidade": 120,
      "valor": 7200.0
    }
  ]
}
```

## Compatibilidade com front atual

O front esta tolerante para nomes alternativos de campos e wrappers comuns (`items`, `data`, etc.), porem o ideal e seguir exatamente os nomes deste documento para evitar mapeamentos extras.

## PDF

O PDF e gerado no front, com:

- tema VEXA (azul escuro + amarelo)
- nome da empresa ativa no cabecalho
- titulo do relatorio
- periodo (quando aplicavel)

Se no futuro o backend gerar PDF server-side, manter o mesmo layout visual para consistencia.
