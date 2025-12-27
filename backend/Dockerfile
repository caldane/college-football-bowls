# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm i --only=production

# Final stage
FROM node:20-alpine

WORKDIR /app

# Copy built node_modules and app code
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# === FIX START: Create user/group FIRST, then chown ===
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001 -G nodejs && \
    mkdir -p /app/assets/json && \
    chown -R nodeapp:nodejs /app/assets
# === FIX END ===

USER nodeapp

ENV NODE_ENV=production
ENV PORT=5050

EXPOSE 5050

# Healthcheck: Simple ping to / (add a /health endpoint in your app for better)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5050 || exit 1

CMD ["node", "server.js"]