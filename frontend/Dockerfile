# Этап сборки – ставим все зависимости
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci   # установка всех зависимостей (включая dev)

COPY . .
RUN npm run build

# Этап production – только статика
FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]