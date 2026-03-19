# ═══════════════════════════════════════════════
# NEXUS Watcher — Dockerfile
# node:24-alpine, multistage build
# ═══════════════════════════════════════════════

# Stage 1 — build frontend
FROM node:24-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2 — backend + built frontend
FROM node:24-alpine AS production
WORKDIR /app

# Backend dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Backend source
COPY backend/ ./

# Frontend build output → backend/public
COPY --from=frontend-builder /app/frontend/../backend/public ./public

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --spider http://localhost:3002/health || exit 1

CMD ["node", "server.js"]
