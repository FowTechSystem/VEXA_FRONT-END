# =============================================================================
# VEXA CRM — build do front (Vite) + Nginx servindo arquivos estáticos
# =============================================================================
# A URL da API entra no bundle no momento do build (VITE_*).
# Produção com Nginx em /api: omita VITE_API_URL (bundle usa /api no mesmo host).
# Só use build-arg se a API for outro host HTTPS: --build-arg VITE_API_URL=https://seudominio.com

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Build-time: aponta para a API pública (IP:porta ou https://api.dominio.com)
ARG VITE_API_URL=
ARG VITE_API_BASE_URL=

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
