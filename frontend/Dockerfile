# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "start"]
