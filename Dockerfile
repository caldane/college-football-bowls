# Build React app
FROM node:20-alpine AS builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm i

COPY frontend ./
RUN npm run build

# Final Nginx stage
FROM nginx:alpine

# Copy built React assets
COPY --from=builder /app/frontend/build /usr/share/nginx/html

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Run as non-root (Nginx already does, but confirm)
EXPOSE 80

# Healthcheck: Nginx config test
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD nginx -t || exit 1

CMD ["nginx", "-g", "daemon off;"]