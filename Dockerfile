# ── build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --global npm@11.21.1 && npm ci

COPY . .
RUN npm run build

# ── serve stage ───────────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/public /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
