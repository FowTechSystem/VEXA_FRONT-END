# Proposta: API de produto aceitar múltiplas fotos

Documento para alinhar **backend** e **frontend** (VEXA CRM). Pode ser usado como base para slides ou especificação de sprint.

---

## Roteiro sugerido para apresentação (ex.: PowerPoint)

**Slide 1 — Título**  
- Múltiplas imagens por produto — mudanças de API  
- VEXA CRM / Produtos

**Slide 2 — Contexto**  
- Hoje o cadastro já envia **uma foto principal** (`foto1` ou `fotoBase64` no POST).  
- O front passou a permitir **até duas imagens adicionais** na mesma tela (galeria).  
- Precisamos que a API **persista, valide e devolva** essas imagens de forma estável.

**Slide 3 — Objetivo**  
- Aceitar **N fotos** por produto (mínimo 0; sugerido limite **5–10** no backend).  
- Ordem fixa: **1ª = principal**, demais = adicionais (galeria).  
- Compatível com **criação**, **edição** e **leitura** (GET).

**Slide 4 — O que o front já envia hoje (MVP)**  
- Mantém `foto1` / `fotoBase64` como hoje.  
- Para extras no mesmo JSON do POST/PUT:  
  - `foto2`, `foto3` — URL http(s) quando a imagem já é uma URL.  
  - `foto2Base64`, `foto3Base64` — string base64 pura (sem prefixo `data:image/...`), quando o usuário escolhe arquivo no navegador.

**Slide 5 — Evolução recomendada (API mais limpa)**  
- **Opção A (mínima):** aceitar só `foto1`…`fotoN` e `foto1Base64`… ou mapear `foto2*` / `foto3*` como está no front.  
- **Opção B (preferida):**  
  - `POST/PUT /produtos` com `fotosUrls: string[]` (opcional) e/ou `fotosBase64: string[]` (opcional; ordem = galeria após a principal).  
  - Ou **multipart**: `multipart/form-data` com `files[]` + JSON de metadados (evita payload gigante em JSON).

**Slide 6 — Resposta GET / listagem**  
- Retornar sempre a **lista ordenada de URLs públicas** (ou assinadas), por exemplo:  
  - `foto1` principal (compatibilidade) **ou**  
  - `fotos: [{ url, ordem }]` / `fotos: string[]`.

**Slide 7 — Regras e validação**  
- Tipos: `image/jpeg`, `image/png`, `image/webp` (definir lista fechada).  
- Tamanho máximo por arquivo (ex.: **5 MB**, igual ao front).  
- Sanitizar nome/origem; rejeitar conteúdo não-imagem mesmo que extensão diga imagem.

**Slide 8 — Upload assíncrono (se já existir `/produtos/upload-foto`)**  
- Definir se fotos extras usam o **mesmo endpoint** em chamadas sequenciais e depois o PUT só com **URLs**, ou se um único POST recebe tudo em base64.

**Slide 9 — Próximos passos**  
- Fechar contrato (campos finais + limite N).  
- Implementar persistência (tabela `ProdutoFoto` ou colunas `Foto2`… / JSON).  
- Ajustar front se o contrato escolhido for o array `fotosBase64[]` unificado.

---

## Especificação técnica (referência)

### 1. Situação atual (resumo)

| Uso | Front (hoje) |
|-----|----------------|
| Foto principal | `fotoBase64` (POST) ou `foto1` URL; edição com `foto1` após upload |
| Fotos extras (UI) | Até **2** slots; payload tenta `foto2`, `foto3`, `foto2Base64`, `foto3Base64` |

### 2. Contrato mínimo para o backend “aceitar” o que já existe

**POST `/produtos` (JSON)** — aceitar opcionalmente:

- `foto2` — `string`, URL `http` ou `https`  
- `foto3` — `string`, URL `http` ou `https`  
- `foto2Base64` — `string`, apenas Base64 (sem prefixo data-URI)  
- `foto3Base64` — `string`, apenas Base64  

**PUT `/produtos/{id}`** — mesmo critério; se o produto já tiver fotos, definir semântica:

- Substituir galeria inteira **ou** merge por índice (recomenda-se documentar explicitamente).

### 3. Contrato sugerido (escalável)

**Corpo JSON (exemplo):**

```json
{
  "sku": "CAM-001",
  "nome": "Camiseta",
  "foto1": "https://cdn.../principal.jpg",
  "fotosAdicionaisUrls": [
    "https://cdn.../extra-1.jpg",
    "https://cdn.../extra-2.jpg"
  ],
  "fotosAdicionaisBase64": []
}
```

Ou somente base64 na criação:

```json
{
  "fotoBase64": "...",
  "fotosAdicionaisBase64": ["...", "..."]
}
```

**GET `/produtos/{id}` e listagens** — devolver, por exemplo:

```json
{
  "foto1": "https://...",
  "foto2": "https://...",
  "foto3": "https://..."
}
```

ou

```json
{
  "fotos": [
    { "url": "https://...", "ordem": 0, "principal": true },
    { "url": "https://...", "ordem": 1, "principal": false }
  ]
}
```

### 4. Persistência (sugestão de modelagem)

- Tabela **`ProdutoImagem`**: `Id`, `ProdutoId`, `Url`, `Ordem`, `CriadoEm`.  
- Ou colunas `Foto2`, `Foto3`… se a regra for **fixo 2 extras** (menos flexível).

### 5. Critérios de aceite (QA)

- Criar produto só com principal → OK.  
- Criar com principal + 2 extras (URL ou Base64) → 3 URLs persistidas e retornadas no GET.  
- Editar removendo uma foto extra → reflete no GET.  
- Payload acima do tamanho máximo → **400** com mensagem clara.  
- Tipo de arquivo inválido → **400**.

---

## Contato / owners

- Front: ajusta `toApiPayload` assim que o contrato final estiver definido.  
- Back: definir nomes finais dos campos e limite de fotos.
