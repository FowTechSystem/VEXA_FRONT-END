# Handoff: fluxo de foto do cliente (front → back) — validação sugerida

Use este documento para outra IA (ou desenvolvedor backend) **revalidar o contrato da API** e descobrir por que a foto pode não persistir no banco.

---

## Resumo

O front trata foto em **dois caminhos distintos**:

| Situação | O que o front faz | Endpoint / formato |
|----------|-------------------|---------------------|
| **Novo cliente** (`POST /clientes`) | Envia **`fotoBase64`** no JSON (sem prefixo `data:image/...;base64,`) | Body JSON |
| **Editar cliente** (`PUT /clientes/{id}`) | Primeiro **`POST /clientes/upload-foto`** (multipart); depois envia **`fotoUrl`** no JSON do PUT | Multipart + JSON |

Se o backend esperar outro nome de campo, outro formato ou um único fluxo para criar e editar, a foto **não será gravada** mesmo com o front “funcionando” na tela.

---

## 1. Criação de cliente (`POST /clientes`)

**Arquivo:** `src/pages/Clientes.jsx` → `handleSave` → `toApiPayload(..., true)`  
**Serviço:** `src/api/clientesService.js` → `create(cliente)`

### Condição no front

- Só monta base64 se existir **`fotoFile`** (arquivo escolhido ou gerado pela câmera).
- O preview (`fotoPreview`) é um data URL; o front extrai só a parte após a vírgula:

```text
fotoBase64 = fotoPreview.split(",")[1]
```

Ou seja: **string base64 pura** (ex.: JPEG), **sem** prefixo `data:image/jpeg;base64,`.

### Campos relevantes do body (trecho lógico)

- `nomeCompleto`, `cpf`, `dataNascimento`, etc.
- **`fotoBase64`**: `string | null` — em criação, pode ser `null` se o usuário não escolheu foto.

### O que validar no backend

1. O controller/DTO **aceita** o campo `fotoBase64` no `POST /clientes`?
2. O nome é exatamente **`fotoBase64`** (camelCase) ou o Jackson espera `foto_base64` / outro?
3. A aplicação **decodifica** base64, grava arquivo ou BLOB e persiste **`fotoUrl`** (ou equivalente) na entidade `Cliente`?
4. Há **limite de tamanho** do body (Spring `max-http-post-size`, gateway, nginx) que corta JSON grande?
5. Se `fotoBase64` for `null`, o backend ignora sem erro — ok.

---

## 2. Edição de cliente — upload (`POST /clientes/upload-foto`)

**Arquivo:** `src/pages/Clientes.jsx` → `handleSave` (quando `editMode && fotoFile`)  
**Serviço:** `src/api/clientesService.js` → `uploadFoto(file)`

### Request

- **Method:** `POST`
- **Path:** `/clientes/upload-foto` (relativo à `baseURL` do axios, ex.: `/api`)
- **Body:** `multipart/form-data`
- **Campo do arquivo:** nome da parte = **`file`** (`formData.append("file", file)`)

### Headers (importante)

- A instância axios usa default `Content-Type: application/json`.
- No upload, o front **remove** o `Content-Type` no `transformRequest` para o cliente HTTP definir **`multipart/form-data` com `boundary` correto**.
- Se o backend ou proxy exigir outro nome de parte (`arquivo`, `image`, `foto`), o Spring pode **não bindar** o `@RequestParam MultipartFile` e o upload falha ou chega vazio.

### Response esperada pelo front (após ajuste)

O front tenta ler a URL nesta ordem:

1. `response.data.url`
2. `response.data.fotoUrl`
3. `response.data.path`
4. `response.data.location`
5. ou `response.data` como **string** (URL direta)

Se nenhum bater, o front exibe erro e **não** chama o `PUT` (para não salvar cliente sem URL nova).

### O que validar no backend

1. Rota existe: **`POST /clientes/upload-foto`** (ou o path real com prefixo `/api`)?
2. Parâmetro multipart: **`file`** (ou documentar o nome correto e alinhar o front).
3. Resposta JSON inclui ao menos um dos campos acima com a **URL pública ou relativa** da imagem após salvar (disco, S3, etc.).
4. Autenticação: mesmo token Bearer e, se aplicável, **`X-Empresa-Id`** que os outros endpoints de cliente usam (`src/api/axiosConfig.js`).
5. Tamanho máximo de upload no servidor (Spring `spring.servlet.multipart.max-file-size`).

---

## 3. Edição de cliente — persistência (`PUT /clientes/{id}`)

**Serviço:** `clientesService.update(id, cliente)` — envia **`PUT /clientes/{id}`** com corpo JSON.

### Campos de foto no body (update)

- **`fotoUrl`**: string com a URL retornada pelo upload (ou a já existente se não houve novo arquivo).
- **`fotoBase64`**: o front força **`null`** no fluxo de edição quando monta o objeto para `toApiPayload` (não manda base64 no PUT pelo código atual).

Trecho lógico em `toApiPayload` para update:

- Inclui `fotoUrl: u.fotoUrl ?? null` no objeto de atualização.

### O que validar no backend

1. O `PUT` **persiste** `fotoUrl` na entidade (e não ignora o campo por `@JsonIgnore` ou DTO incompleto)?
2. Se o upload grava o arquivo mas **não** associa ao cliente até o PUT, o PUT precisa receber e salvar **`fotoUrl`**.
3. Se o backend espera **outro campo** (ex.: só `foto` como ID do arquivo), o front precisaria ser alterado — hoje é **`fotoUrl`**.

---

## 4. Autenticação e base URL

- **Base URL:** `src/config/apiBase.js` → `apiBaseURL`
- **Authorization:** `Bearer <token>` (localStorage)
- **Dev (admin):** header **`X-Empresa-Id`** em requisições (exceto login)

Falhas 401 redirecionam para login; upload/Put podem falhar sem mensagem clara de foto.

---

## 5. Checklist rápido para a IA / backend

- [ ] `POST /clientes` grava foto quando `fotoBase64` vem preenchido?
- [ ] Nome e formato de `fotoBase64` batem com o DTO?
- [ ] `POST /clientes/upload-foto` existe, aceita parte **`file`**, retorna JSON com **`url`** (ou um dos aliases acima)?
- [ ] `PUT /clientes/{id}` atualiza **`fotoUrl`** no banco?
- [ ] Limites de body/upload e CORS não bloqueiam o multipart?
- [ ] Mesmo contexto de tenant (`X-Empresa-Id`) nos três endpoints?

---

## 6. Arquivos de referência no repositório (front)

| Arquivo | Função |
|---------|--------|
| `src/pages/Clientes.jsx` | `handleSave`, `toApiPayload`, estado `fotoFile` / `fotoPreview` |
| `src/api/clientesService.js` | `create`, `update`, `uploadFoto` |
| `src/api/axiosConfig.js` | Base URL, token, `X-Empresa-Id` |
| `src/components/FotoPerfilPicker.jsx` | Gera `File` + data URL (arquivo e câmera) |

---

## 7. Correção já aplicada no front (contexto)

- **Upload multipart:** remoção do `Content-Type` fixo sem `boundary` no `uploadFoto`, para o axios enviar multipart corretamente (problema clássico que impede o servidor de parsear o arquivo).
- **Resposta do upload:** tolerância a várias chaves de URL (`url`, `fotoUrl`, `path`, `location`); se nada vier, o usuário vê mensagem orientando a conferir o backend.

Se, após isso, a foto ainda não aparecer no banco, o próximo passo é **logar no backend** o body do `POST /clientes`, o `MultipartFile` em `upload-foto` e o payload do `PUT`, e comparar com este contrato.
