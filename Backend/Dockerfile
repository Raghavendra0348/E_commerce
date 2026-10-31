# Multi-stage Dockerfile for Backend (Node.js 20+ / Express 5 / Prisma)
FROM node:20-alpine AS base
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy application source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose API port
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start production server
CMD ["node", "src/server.js"]
