# Handoff: cores, tamanhos e material do produto (front → back)

Use este documento para **outra IA ou desenvolvedor backend** analisar por que cor, tamanho e material “não salvavam” e **alinhar o contrato da API** com o que o front envia e consome.

---

## 1. Resumo do que estava errado no front (corrigido)

| Situação | Comportamento antigo | Comportamento atual |
|----------|----------------------|---------------------|
| **Validação na tela** | O formulário obrigava selecionar **cores** e **tamanhos** antes de salvar. | Igual. |
| **Payload `POST /produtos` e `PUT /produtos/{id}`** | A função `toApiPayload` em `src/pages/Produtos.jsx` **não incluía** `cores`, `tamanhos`, `material` nem `tipoTamanho` no JSON. | Esses campos passam a ser **incluídos** no corpo da requisição (ver seção 3). |

Ou seja: mesmo com dados corretos na UI, o backend **nunca recebia** esses atributos — não era só “backend não persiste”, era **front não enviava**.

**Arquivo alterado no front:** `src/pages/Produtos.jsx` → `toApiPayload`.

---

## 2. O que a IA do backend deve fazer

1. **Confirmar** se o DTO de criação/atualização de produto (`ProdutoRequest`, `CreateProdutoDTO`, etc.) possui propriedades para **cores**, **tamanhos**, **material** e opcionalmente **tipoTamanho** (camelCase como abaixo, ou documentar o nome real e alinhar o front).
2. **Mapear** esses campos para a entidade persistida (colunas JSON, tabelas de junção, `ElementCollection`, etc.).
3. **Garantir** que `GET /produtos`, `GET /produtos/{id}` e listagens devolvam os mesmos campos no formato que o front espera ao **editar** (seção 4).
4. Se o backend hoje usa **outros nomes** (`corIds`, `listaCores`, `variacoes`, etc.), **ou** alterar o backend para aceitar o contrato abaixo, **ou** documentar o contrato real e pedir ajuste pontual no front.

---

## 3. Contrato enviado pelo front (após correção)

**Endpoints:** `POST /produtos` (criar) e `PUT /produtos/{id}` (atualizar).  
**Content-Type:** `application/json` (mesma instância axios do restante do CRM).

### 3.1 Campos novos / explícitos no JSON

| Campo (camelCase) | Tipo | Obrigatório no front | Descrição |
|-------------------|------|----------------------|-----------|
| `cores` | `string[]` | Sim (validação: pelo menos 1) | Nomes de cor em **português**, exatamente como no catálogo fixo do front (lista abaixo). **Não são IDs numéricos** no envio atual. |
| `tamanhos` | `string[]` | Sim (validação: pelo menos 1) | Códigos de tamanho como string (`"P"`, `"M"`, `"38"`, `"Único"`, etc.), conforme o tipo de grade. |
| `tipoTamanho` | `string` | Condicional | Um de: `"roupas"` \| `"calcados"` \| `"acessorios"`. Indica qual conjunto de opções de tamanho o usuário estava usando. |
| `material` | `string` \| `null` | Não | Nome do material em português (lista fixa no front) ou `null` se vazio. |

### 3.2 Valores possíveis de `cores` (lista do front)

`Preto`, `Branco`, `Azul`, `Vermelho`, `Verde`, `Amarelo`, `Rosa`, `Roxo`, `Laranja`, `Marrom`, `Cinza`, `Bege`, `Nude`, `Vinho`, `Azul Marinho`, `Off-white`, `Estampado`, `Multicolor`.

### 3.3 Valores possíveis de `tamanhos` (dependem de `tipoTamanho`)

- **`roupas`:** `PP`, `P`, `M`, `G`, `GG`, `XG`, `XGG`
- **`calcados`:** `33` … `44` (strings)
- **`acessorios`:** `Único`, `P`, `M`, `G`, `GG`, `Infantil`

### 3.4 Valores possíveis de `material` (lista do front)

`Algodão`, `Poliéster`, `Viscose`, `Linho`, `Seda`, `Jeans`, `Couro`, `Couro Sintético`, `Malha`, `Lã`, `Elastano`, `Tecido Misto`.

### 3.5 Exemplo mínimo de trecho do body (ilustrativo)

```json
{
  "sku": "CAM-001",
  "nome": "Camiseta",
  "categoriaId": 1,
  "generoId": 1,
  "precoCusto": 50.0,
  "precoVenda": 99.9,
  "estoqueMinimo": 2,
  "quantidadeEstoque": 10,
  "cores": ["Amarelo", "Preto"],
  "tamanhos": ["P", "M", "G"],
  "tipoTamanho": "roupas",
  "material": "Algodão"
}
```

No **PUT**, os mesmos campos podem aparecer junto com `id` e demais campos já usados hoje (`marcaId`, `fornecedorId`, `foto1`, `fotoBase64` em criação, etc.).

---

## 4. O que o front espera receber da API (leitura / edição)

Ao **abrir um produto para editar**, o front faz spread do objeto retornado pela lista ou pelo detalhe e normaliza:

- `cores`: **array de strings**. Se vier `null` ou não for array, o front usa `[]`.
- `tamanhos`: idem.
- `material`: string; ligado ao `Select` de material.
- `tipoTamanho`: usado para escolher a grade (roupas/calçados/acessórios).

**Recomendação para o backend:** na resposta de `GET` (item e lista), devolver:

```json
{
  "id": 1,
  "nome": "...",
  "sku": "...",
  "cores": ["Amarelo"],
  "tamanhos": ["P", "M"],
  "tipoTamanho": "roupas",
  "material": "Algodão",
  "foto1": "https://..."
}
```

Se hoje a API devolve apenas texto livre em outro campo (`descricao`, `observacoes`) ou não devolve nada, a tela de edição **não conseguirá** repovoar cores/tamanhos/material.

---

## 5. Checklist para validação no backend

- [ ] O DTO de `POST /produtos` / `PUT /produtos/{id}` **deserializa** `List<String> cores`, `List<String> tamanhos`, `String material`, `String tipoTamanho` (ou equivalente com `@JsonProperty` se o nome for outro)?
- [ ] A entidade **persiste** esses dados (e o repositório **não** os ignora em `save`)?
- [ ] `GET` / listagem **serializa** de volta `cores`, `tamanhos`, `material`, `tipoTamanho`?
- [ ] Há validação que **rejeita** listas vazias onde o front sempre envia pelo menos um item (deve ser compatível)?
- [ ] Se o banco usa **IDs de cor** em vez de nomes, o backend deve **converter** nome ↔ id ou o front deve ser alterado para enviar ids — hoje o contrato é **nome por string**.

---

## 6. Arquivos de referência no repositório (front)

| Arquivo | Função |
|---------|--------|
| `src/pages/Produtos.jsx` | `toApiPayload`, estado `cores`, `tamanhos`, `material`, `tipoTamanho`; `handleSave` valida cores/tamanhos antes de salvar |
| `src/api/produtosService.js` | `create`, `update` — enviam o objeto retornado por `toApiPayload` |

---

## 7. Pedido explícito à IA que for analisar o backend

1. Localize o **controller** e o **DTO** de produto para criação e atualização.  
2. Compare com a tabela da seção 3: **inclua** campos faltantes, **persistência** e **mapeamento** na entidade.  
3. Ajuste os **serviços de leitura** para devolver os mesmos campos na resposta JSON.  
4. Rode um teste manual ou integração: `POST` com `cores`/`tamanhos`/`material`, depois `GET` e confira se os valores retornam iguais.  
5. Se o padrão interno da API for **snake_case** (`tipo_tamanho`), configure Jackson ou alinhe com o front — hoje o envio é **camelCase**.

---

*Documento gerado para handoff front/back — produto VEXA CRM.*
