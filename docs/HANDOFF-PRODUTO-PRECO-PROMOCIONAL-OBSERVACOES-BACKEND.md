# Handoff: preço promocional e observações internas do produto (front → back)

Documento para **outra IA ou desenvolvedor backend** validar persistência e contrato da API após o front passar a enviar estes campos.

---

## 1. Problema que existia no front (corrigido)

| Campo na tela | Estado React | Envio em `POST/PUT` (antes) |
|----------------|--------------|-----------------------------|
| **Preço promocional** | `precoPromocional` | **Não era incluído** no JSON de `toApiPayload`. |
| **Em promoção** (derivado) | `emPromocao` | **Não era enviado**; na listagem o front só mostra badge se `emPromocao && precoPromocional`. |
| **Observações internas** | `observacoes` | **Não era incluído** no JSON. |

**Arquivo alterado:** `src/pages/Produtos.jsx` → função `toApiPayload`.

---

## 2. O que a IA do backend deve fazer

1. Confirmar se o DTO de criação/atualização de produto possui **`precoPromocional`**, **`emPromocao`** e **`observacoes`** (camelCase) ou equivalentes com `@JsonProperty`.
2. Persistir na entidade e devolver nos **GET** / listagens para edição e listagem.
3. Se os nomes no back forem outros (`preco_promocional`, `observacoes_internas`, etc.), **alinhar** DTO/Jackson ou ajustar o front com os nomes reais.

---

## 3. Contrato enviado pelo front (após correção)

**Endpoints:** `POST /produtos`, `PUT /produtos/{id}`  
**Content-Type:** `application/json`

### 3.1 Campos

| Campo (camelCase) | Tipo JSON | Regras no front |
|-------------------|-----------|-----------------|
| `precoPromocional` | `number` \| `null` | Número **> 0** quando há promoção; caso contrário **`null`** (campo vazio, zero ou inválido → sem promoção). |
| `emPromocao` | `boolean` | **`true`** se `precoPromocional` for um número **> 0**; senão **`false`**. Não há toggle separado na UI: a promoção “liga” pelo preenchimento do valor. |
| `observacoes` | `string` \| `null` | Texto trimado; string vazia → **`null`**. |

### 3.2 Exemplo de trecho no body

```json
{
  "sku": "CAM-001",
  "nome": "Camiseta",
  "precoCusto": 499.0,
  "precoVenda": 799.0,
  "precoPromocional": 599.0,
  "emPromocao": true,
  "observacoes": "Lote importado jan/2026. Conferir etiqueta.",
  "cores": ["Amarelo"],
  "tamanhos": ["P", "M"]
}
```

Sem promoção e sem observação:

```json
{
  "precoPromocional": null,
  "emPromocao": false,
  "observacoes": null
}
```

---

## 4. O que o front espera receber da API (leitura)

- **`precoPromocional`:** número (ou string numérica tolerada no estado) para o campo “Preço promocional”.
- **`emPromocao`:** boolean — na **tabela** de produtos, o preço promocional em destaque só aparece se `produto.emPromocao && produto.precoPromocional`.
- **`observacoes`:** string para o textarea “Observações internas”.

Ao abrir **editar**, o objeto do produto é espalhado no estado; se a API não devolver esses campos, a tela fica vazia mesmo após salvar no back.

---

## 5. Checklist para o backend

- [ ] `POST /produtos` e `PUT /produtos/{id}` **deserializam** `precoPromocional`, `emPromocao`, `observacoes`.
- [ ] Valores **`null`** em `precoPromocional` / `observacoes` não quebram validação (opcionais).
- [ ] Se o back **ignorar** `emPromocao` e calcular só por regra própria, manter consistência com o que o front envia (`emPromocao` espelha “há preço promocional válido”).
- [ ] Respostas de **listagem** e **detalhe** incluem os três campos para o CRM repovoar o formulário.

---

## 6. Referência no repositório (front)

| Arquivo | Função |
|---------|--------|
| `src/pages/Produtos.jsx` | `toApiPayload`, campos de precificação e papel “Observações Internas” |
| `src/api/produtosService.js` | `create` / `update` enviam o objeto retornado por `toApiPayload` |

---

## 7. Pedido explícito à IA que analisar o backend

1. Localizar controller + DTO + entidade **Produto**.  
2. Garantir mapeamento e persistência de **`precoPromocional`**, **`emPromocao`**, **`observacoes`**.  
3. Testar: salvar produto com preço promocional e observações → **GET** → conferir JSON.  
4. Documentar qualquer divergência de nome (`snake_case`, prefixos) para alinhar Jackson ou o front.

---

*Handoff VEXA CRM — produto, promoção e observações.*
