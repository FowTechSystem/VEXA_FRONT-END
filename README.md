# VEXA CRM (front-end)

React + Vite.

**Produção (HTTPS, sem Mixed Content):** com o front em `https://sistemavexa.com`, o padrão é chamar a API em `/api/...` no **mesmo** host (requisição relativa). Configure o Nginx para fazer `proxy_pass` de `/api` para o backend interno (ex.: porta 8080). Só defina `VITE_API_URL` ou `VITE_API_BASE_URL` se a API estiver em outro domínio — e use **HTTPS**, nunca `http://` + IP no bundle de um site HTTPS. Veja [`.env.production.example`](./.env.production.example).

**Após alterar qualquer variável `VITE_*`:** rode `npm run build` de novo e publique o novo artefato (os valores são embutidos no JavaScript no momento do build).

**Docker:** `cp .env.docker.example .env` → deixe `VITE_API_URL` vazio se o proxy `/api` estiver no mesmo domínio → `docker compose up -d --build`.

**Contrato com a API (ASP.NET):** [`docs/CONTRATO-API-FRONT-BACKEND.md`](./docs/CONTRATO-API-FRONT-BACKEND.md) · checklist proxy/HTTPS: [`docs/VERIFICACAO-API-PROXY-HTTPS.md`](./docs/VERIFICACAO-API-PROXY-HTTPS.md).

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
