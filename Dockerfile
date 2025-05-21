# ---- Base Stage ----
FROM node:20-alpine3.16 AS base
WORKDIR /app

# ---- Dependencies Stage ----
FROM base AS deps
WORKDIR /app

# package.json ve lock dosyasını kopyala
COPY package.json ./
COPY package-lock.json* ./

# Bağımlılıkları yükle
RUN npm install

# ---- Builder Stage ----
FROM base AS builder
WORKDIR /app

# Build için gerekli paketleri yükle
RUN apk update && \
    apk add --no-cache libc6-compat python3 make g++ curl openssl

# Bağımlılıkları kopyala
COPY --from=deps /app/node_modules ./node_modules
# Tüm proje dosyalarını kopyala
COPY . .

# Prisma Client'ı oluştur
RUN npx prisma generate

# Disable Nextjs telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# JWT için gerekli ortam değişkenleri
ENV JWT_SECRET=cpFZHH5zLazWQ0n5+iq+Fmk0AVS1j6fd/tRbai7suMQ=
ENV REFRESH_TOKEN_SECRET=cpFZHH5zLazWQ0n5+iq+Fmk0AVS1j6fd/tRbai7suMQ=
ENV ACCESS_TOKEN_EXPIRES_IN=15m
ENV REFRESH_TOKEN_EXPIRES_IN=7d

# Uygulamayı build et
RUN npm run build

# ---- Runner Stage (Production Image) ----
FROM base AS runner
WORKDIR /app

# Gerekli paketleri yükle
RUN apk update && \
    apk add --no-cache libc6-compat postgresql-client curl openssl

# Ortam değişkenlerini ayarla
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV JWT_SECRET=cpFZHH5zLazWQ0n5+iq+Fmk0AVS1j6fd/tRbai7suMQ=
ENV REFRESH_TOKEN_SECRET=cpFZHH5zLazWQ0n5+iq+Fmk0AVS1j6fd/tRbai7suMQ=
ENV ACCESS_TOKEN_EXPIRES_IN=15m
ENV REFRESH_TOKEN_EXPIRES_IN=7d

# Gerekli bağımlılıkları yükle
RUN npm install bcryptjs wait-on

# Güvenlik için root olmayan kullanıcı oluştur
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Standalone output için gerekli dosyaları kopyala
# .next/standalone klasörünü kopyala (Next.js'in optimize edilmiş server dosyalarını içerir)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Public klasörünü kopyala (statik resimler, fontlar vb. için)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# .next klasörünü kopyala
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
# node_modules klasörünü kopyala
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
# prisma klasörünü kopyala
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# scripts klasörünü kopyala
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Next.js 13+ standalone output'u, .next/static dosyalarını genellikle
# .next/standalone/.next/static altına kendisi kopyalar.
# Eğer manuel kopyalama gerekiyorsa:
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Docker entrypoint script'ini oluştur
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Wait for database to be ready' >> /docker-entrypoint.sh && \
    echo 'echo "Waiting for database to be ready..."' >> /docker-entrypoint.sh && \
    echo 'MAX_RETRIES=30' >> /docker-entrypoint.sh && \
    echo 'RETRY_COUNT=0' >> /docker-entrypoint.sh && \
    echo 'while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do' >> /docker-entrypoint.sh && \
    echo '  RETRY_COUNT=$((RETRY_COUNT + 1))' >> /docker-entrypoint.sh && \
    echo '  if PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then' >> /docker-entrypoint.sh && \
    echo '    echo "Database is ready!"' >> /docker-entrypoint.sh && \
    echo '    break' >> /docker-entrypoint.sh && \
    echo '  else' >> /docker-entrypoint.sh && \
    echo '    echo "Database is not ready yet. Retrying ($RETRY_COUNT/$MAX_RETRIES)..."' >> /docker-entrypoint.sh && \
    echo '    sleep 2' >> /docker-entrypoint.sh && \
    echo '  fi' >> /docker-entrypoint.sh && \
    echo '  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then' >> /docker-entrypoint.sh && \
    echo '    echo "Error: Could not connect to database after $MAX_RETRIES attempts"' >> /docker-entrypoint.sh && \
    echo '    exit 1' >> /docker-entrypoint.sh && \
    echo '  fi' >> /docker-entrypoint.sh && \
    echo 'done' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Run database migrations' >> /docker-entrypoint.sh && \
    echo 'echo "Running database migrations..."' >> /docker-entrypoint.sh && \
    echo 'npx prisma db push --accept-data-loss' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Create superadmin user' >> /docker-entrypoint.sh && \
    echo 'echo "Creating superadmin user..."' >> /docker-entrypoint.sh && \
    echo 'node scripts/create-admin.js' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Start the application' >> /docker-entrypoint.sh && \
    echo 'echo "Starting the application..."' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Çalışma dizinindeki dosyaların sahibi olarak nextjs kullanıcısını ayarla
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Uygulamayı başlat (standalone modda)
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
