FROM node:18-alpine AS base

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* prisma ./
RUN npm ci --registry=http://registry.npmmirror.com;

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
ENV SKIP_ENV_VALIDATION true
RUN npm run build
RUN rm -rf ./.next/cache

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=builder /app/public ./public

RUN mkdir .next

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json /app/package-lock.json* ./
COPY --from=builder /app/.next/static ./.next/static

# RUN npm install --production --registry=http://registry.npmmirror.com && npm cache clean --force

# without this, instrumentation can't execute
# standalone mode does not need this
# RUN echo "export default {experimental: {instrumentationHook: true}}" > next.config.mjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"
ENV DATABASE_URL "file:/app/data/db.sqlite"
ENV ASAR_DIR "./data/asar"
ENV TEMP_DIR "./temp"
ENV ADMIN_USER_NAME "admin"
ENV ADMIN_USER_PASSWORD ""

CMD npm run start:prod