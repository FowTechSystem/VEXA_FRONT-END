# Backend – Cadastro de Empresas e usuário dev@gmail.com

Este documento descreve o que o **backend** precisa implementar para o frontend funcionar com:

1. Exibição do **nome da empresa** no lugar do usuário (identidade = empresa).
2. Uma **aba "Empresas"** visível apenas para o usuário **dev@gmail.com**, onde é possível **cadastrar novas empresas** para outros clientes acessarem o sistema.

---

## 1. Resposta do login: incluir `empresaNome` no `user`

O frontend exibe o **nome da empresa** no header, sidebar e perfil. Para isso, a resposta do login deve incluir o nome da empresa no objeto `user`:

```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "empresaId": 1,
    "empresaNome": "Minha Empresa Ltda",
    "nome": "João",
    "email": "joao@empresa.com",
    "perfil": "Administrador"
  }
}
```

- **empresaId** – já existe (multi-tenancy).
- **empresaNome** – **adicionar**: buscar o nome da empresa (tabela `Empresas`) pelo `EmpresaId` do usuário e retornar no payload do login. Assim o front não precisa de um endpoint extra só para “nome da empresa”.

---

## 2. Usuário especial dev@gmail.com

- O frontend considera que o usuário com **e-mail exatamente igual a `dev@gmail.com`** é um “admin do sistema” e:
  - Mostra no menu lateral a seção **"Administração"** com o item **"Empresas"**.
  - Na rota **/empresas**, exibe a tela de **Cadastro de Empresas** (formulário para criar nova empresa).
- Qualquer outro usuário que acessar a URL **/empresas** (por exemplo, se mudar a rota manualmente) verá apenas a mensagem: *"Você não tem permissão para acessar o cadastro de empresas."*
- No backend, **restrinja** as operações de listagem e criação de empresas **apenas** ao usuário cujo e-mail seja **dev@gmail.com** (ou a um perfil “SuperAdmin”, se preferir centralizar por perfil em vez de e-mail).

---

## 3. Endpoint: POST /api/empresas (criar empresa)

O frontend chama este endpoint quando o usuário **dev@gmail.com** preenche o formulário e clica em **"Cadastrar empresa"**.

- **Método:** `POST`
- **Rota:** `/api/empresas` (ou a base que você usar, ex.: `https://seudominio.com/api/empresas`)
- **Headers:** `Authorization: Bearer <token>` (obrigatório)
- **Regra de negócio:** só aceitar a requisição se o usuário autenticado for **dev@gmail.com** (ou SuperAdmin). Caso contrário, retornar **403 Forbidden**.

**Body (JSON) enviado pelo frontend:**

```json
{
  "nome": "Razão Social da Empresa Ltda",
  "nomeFantasia": "Nome Fantasia",
  "cnpj": "12345678000199",
  "email": "contato@empresa.com",
  "telefone": "(49) 99999-9999",
  "ativo": true
}
```

- **nome** – obrigatório (razão social).
- **nomeFantasia**, **cnpj**, **email**, **telefone** – opcionais.
- **ativo** – booleano; default `true`.

**O que o backend deve fazer:**

1. Validar que o usuário logado é **dev@gmail.com** (ou SuperAdmin). Se não for, retornar **403**.
2. Validar o body (ex.: `nome` obrigatório, CNPJ formato válido se informado).
3. Inserir um novo registro na tabela **Empresas** com os campos: Nome, NomeFantasia, CNPJ, Email, Telefone, Ativo, DataCadastro (ou equivalentes no seu modelo).
4. Retornar **201 Created** com o objeto da empresa criada (ex.: `{ id, nome, nomeFantasia, ... }`) ou **200** com uma mensagem de sucesso.

**Exemplo de resposta de sucesso (201):**

```json
{
  "id": 2,
  "nome": "Razão Social da Empresa Ltda",
  "nomeFantasia": "Nome Fantasia",
  "cnpj": "12345678000199",
  "email": "contato@empresa.com",
  "telefone": "(49) 99999-9999",
  "ativo": true,
  "dataCadastro": "2026-02-13T..."
}
```

**Exemplo de erro de validação (400):**

```json
{
  "message": "Nome da empresa é obrigatório.",
  "errors": {
    "Nome": ["O campo Nome é obrigatório."]
  }
}
```

**Exemplo de erro de permissão (403):**

```json
{
  "message": "Apenas o administrador do sistema pode cadastrar empresas."
}
```

---

## 4. Endpoint opcional: GET /api/empresas (listar empresas)

Se no futuro o frontend exibir uma **lista** de empresas cadastradas (para dev@gmail.com), o backend pode expor:

- **Método:** `GET`
- **Rota:** `/api/empresas`
- **Headers:** `Authorization: Bearer <token>`
- **Regra:** só permitir para **dev@gmail.com** (ou SuperAdmin). Caso contrário, **403**.

Resposta sugerida: array de empresas (ex.: `[{ id, nome, nomeFantasia, ativo, ... }, ...]`).

Hoje o frontend **não** chama esse endpoint; a tela de Empresas só tem o formulário de criação. O service já tem a função `listarEmpresas()` preparada para quando você quiser usar.

---

## 5. Como outro cliente acessa após cadastrar a empresa

Depois que uma **nova empresa** é criada (via POST /api/empresas), um “outro cliente” só consegue acessar o sistema se existir um **usuário** vinculado a essa empresa:

- Na tabela **Usuarios** (ou equivalente), o usuário deve ter **EmpresaId** = id da empresa recém-cadastrada.
- Esse usuário faz login com seu e-mail e senha; o token terá o claim **empresa_id** dessa empresa, e o backend filtrará todos os dados por esse **EmpresaId**.

Fluxo sugerido no backend:

1. **dev@gmail.com** cadastra a empresa (POST /api/empresas) → retorna, por exemplo, `id: 2`.
2. **Criar um usuário** para o cliente dessa empresa:
   - Ou um endpoint restrito a dev@gmail.com, por exemplo: **POST /api/usuarios** (body com nome, email, senha, **empresaId: 2**), e no backend só aceitar **empresaId** no body quando o requester for dev@gmail.com.
   - Ou cadastro manual no banco (insert em Usuarios com EmpresaId = 2).
3. O cliente usa o **e-mail e senha** desse usuário para fazer login; a partir daí o sistema funciona normalmente para a empresa dele.

Se o backend não quiser que o frontend envie **empresaId** na criação de usuário (por segurança), pode oferecer um endpoint específico, por exemplo:

- **POST /api/empresas/{id}/primeiro-usuario**  
  Body: `{ nome, email, senha }`  
  Regra: só para dev@gmail.com; cria um usuário com EmpresaId = {id}. Assim o frontend não envia empresaId em nenhum lugar; o backend associa ao id da empresa.

---

## 6. Checklist backend

- [ ] Login retorna **user.empresaNome** (além de empresaId, nome, email, perfil).
- [ ] **POST /api/empresas** implementado; restrito a **dev@gmail.com** (ou SuperAdmin); body com nome (obrigatório), nomeFantasia, cnpj, email, telefone, ativo.
- [ ] (Opcional) **GET /api/empresas** restrito a dev@gmail.com para listar empresas.
- [ ] Definir como um novo cliente recebe acesso após a empresa ser criada (criação de usuário com EmpresaId, por dev ou por endpoint específico).

---

## 7. Resumo

- **Login:** incluir **empresaNome** no objeto `user` para o front exibir o nome da empresa no lugar do usuário (header, sidebar, perfil).
- **dev@gmail.com:** único usuário que vê a aba **Empresas** e pode cadastrar novas empresas.
- **POST /api/empresas:** criar empresa; apenas dev@gmail.com; body conforme acima.
- **Acesso do cliente:** após criar a empresa, criar um usuário com **EmpresaId** dessa empresa (por endpoint restrito ou processo interno) para o cliente poder fazer login e usar o sistema.
