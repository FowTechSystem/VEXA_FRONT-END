# Módulo Bazar — VEXA

Gerencia produtos **consignados**: pessoas (consignantes) deixam peças na loja, que ficam à venda até serem compradas ou devolvidas. Quando vende, a loja repassa parte ao consignante e fica com o lucro.

---

## Como visualizar

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`, faça login e acesse pelo menu lateral **OPERAÇÃO › Bazar**, ou diretamente pelas URLs abaixo.

---

## Telas

| # | Tela | Rota | Arquivo |
|---|------|------|---------|
| 1 | Hub Bazar (lista de consignantes) | `/bazar` | [src/pages/Bazar.jsx](../../pages/Bazar.jsx) |
| 2 | Consignante (grid de sacolas) | `/bazar/consignante/:id` | [src/pages/BazarConsignante.jsx](../../pages/BazarConsignante.jsx) |
| 3 | Painel "Adicionar peças à sacola" | (dialog full-screen) | [AdicionarPecasSacola.jsx](./AdicionarPecasSacola.jsx) |
| 4 | Modal Novo/Editar consignante | (modal) | [NovoConsignanteModal.jsx](./NovoConsignanteModal.jsx) |
| 5 | Listagem de peças do consignante | `/bazar/consignante/:id/pecas` | [src/pages/BazarConsignantePecas.jsx](../../pages/BazarConsignantePecas.jsx) |
| 6 | Gestão de Repasses | `/bazar/repasses` | [src/pages/BazarRepasses.jsx](../../pages/BazarRepasses.jsx) |

---

## Services (comunicação com backend)

| Service | Endpoints |
|---|---|
| [bazarConsignantesService](../../api/bazarConsignantesService.js) | `GET/POST/PUT/DELETE /bazar/consignantes`, `/bazar/consignantes/resumo`, `/bazar/consignantes/:id/resumo`, `/bazar/consignantes/recentes` |
| [bazarSacolasService](../../api/bazarSacolasService.js) | `GET/POST /bazar/sacolas`, `GET /bazar/consignantes/:id/sacolas`, `PUT /bazar/sacolas/:id/devolver`, `POST /bazar/pecas/:id/fotos` (multipart) |
| [bazarPecasService](../../api/bazarPecasService.js) | `GET/PUT/DELETE /bazar/pecas`, `PUT /bazar/pecas/:id/devolver` |
| [bazarRepassesService](../../api/bazarRepassesService.js) | `GET/POST/DELETE /bazar/repasses`, `GET /bazar/repasses/pendentes`, `GET /bazar/consignantes/:id/repasses/pendentes`, `PUT /bazar/repasses/:id/pagar` |

Todos os services usam a instância única `src/api/axiosConfig.js` (Bearer token + X-Empresa-Id automáticos).

---

## Contratos esperados

### `GET /bazar/consignantes?busca=&incluirResumo=true`
```json
{
  "consignantes": [
    {
      "id": 1, "nome": "Alexandre Silva", "telefone": "(11) 98765-4321",
      "cpf": "123.456.789-00", "observacao": "...", "criadoEm": "2024-09-12",
      "sacolasCount": 4,
      "resumo": { "pendente": 100.50, "emEstoque": 12, "vendidas": 28, "devolvidas": 3 }
    }
  ],
  "totalPaginas": 1, "totalRegistros": 1
}
```

### `GET /bazar/consignantes/resumo`
```json
{ "pendenteTotal": 1240.00, "consignantesPendentes": 3, "emEstoque": 87, "vendidoMes": 23 }
```

### `GET /bazar/consignantes/:id`
```json
{
  "id": 1, "nome": "...", "telefone": "...", "cpf": "...", "observacao": "...",
  "resumo": { "pendente": 340, "emEstoque": 12, "vendidas": 28, "devolvidas": 0 }
}
```

### `GET /bazar/consignantes/:id/sacolas?incluirResumo=true`
```json
[
  {
    "id": 9001, "consignanteId": 1, "dataCadastro": "2026-04-10", "observacao": "Verão 2026",
    "total": 5, "disponiveis": 3, "vendidas": 1, "devolvidas": 1,
    "valorVenda": 535.00, "valorRepasse": 200.00,
    "podeDevolverTudo": false
  }
]
```

### `POST /bazar/sacolas`
Request:
```json
{
  "consignanteId": 1,
  "observacao": "Verão 2026",
  "pecas": [
    { "descricao": "Vestido floral midi", "tamanho": "M", "cor": "Verde",
      "valorCompra": 35, "valorVenda": 89 }
  ]
}
```
Response (necessário para upload de fotos depois):
```json
{
  "id": 9010,
  "consignanteId": 1,
  "pecas": [{ "id": 199 }]   // mesma ordem do request
}
```

### `POST /bazar/pecas/:id/fotos` (multipart/form-data)
Campo: `files` (1 a 3 imagens). Response: `{ fotos: [{ url: "..." }] }`

### `GET /bazar/pecas?consignanteId=&sacolaId=&status=&dataInicio=&dataFim=`
```json
[
  {
    "id": 101, "consignanteId": 1, "sacolaId": 9001,
    "descricao": "Vestido floral midi", "tamanho": "M", "cor": "Verde",
    "valorCompra": 35, "valorVenda": 89,
    "fotos": [{ "id": 1, "url": "https://..." }],
    "status": "disponivel", "dataEntrada": "2026-04-10",
    "dataVenda": null, "dataDevolucao": null
  }
]
```

### `GET /bazar/repasses/pendentes`
```json
[
  {
    "consignante": { "id": 1, "nome": "...", "telefone": "..." },
    "pecas": [{ "id": 103, "descricao": "...", "tamanho": "U", "cor": "Caramelo",
                "valorCompra": 70, "dataVenda": "2026-04-18" }],
    "total": 70.00
  }
]
```

### `GET /bazar/repasses?status=&consignanteId=&dataInicio=&dataFim=`
```json
[
  {
    "id": 5001, "consignanteId": 1, "data": "2026-04-22",
    "valor": 70, "formaPagamento": "PIX", "status": "pago",
    "pecasIds": [103], "observacao": "..."
  }
]
```

### `POST /bazar/repasses`
Request:
```json
{ "consignanteId": 1, "pecasIds": [103, 104], "formaPagamento": "PIX", "observacao": "..." }
```

### `PUT /bazar/repasses/:id/pagar`
Sem body. Response: `{ id, status: "pago", dataPagamento: "..." }`.

---

## Constants e helpers

- [bazarConstants.js](./bazarConstants.js) — `STATUS_PECA`, `STATUS_REPASSE`, `FORMAS_PAGAMENTO_REPASSE`, `TAMANHOS_PADRAO` (22 opções), `CORES_PADRAO` (29 opções)
- [bazarHelpers.js](./bazarHelpers.js) — `formatBRL`, `formatData`, `getAvatarColor`, `getInitials`

---

## Regras de negócio importantes

- Cada peça é única (sem `quantidade`)
- Uma peça vendida não pode ser editada nem entrar em dois repasses
- Devolução em lote por sacola só é permitida se **nenhuma** peça da sacola foi vendida (`podeDevolverTudo: false` no payload)
- Tamanho/cor sempre vêm de listas fixas (TAMANHOS_PADRAO / CORES_PADRAO) — relatórios precisam de consistência
- Loading states e mensagens de erro vêm dos services; o front exibe via toast (`react-hot-toast`)

---

## Identidade visual

Cumpre o padrão VEXA via [`src/theme.js`](../../theme.js):

- Tema escuro padrão (canvas #12131c, paper #1c1e2c)
- Primária amarela `vexaColors.amareloNeon` (#F8F32B)
- Cards 12 px de raio, borda sutil
- Ícones outlined com cores variadas por contexto (roxo financeiro, verde estoque, laranja vendas, vermelho destrutivo)
- Toasts via `react-hot-toast` (canto superior direito)
- DatePicker dark via [VexaDatePicker](../VexaDatePicker.jsx) — sem date inputs nativos
