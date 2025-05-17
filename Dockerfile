# ---- Base Stage ----
# Temel imaj olarak Node.js 20 Alpine kullanıyoruz.
# Alpine, küçük imaj boyutları sağlar ancak bazen ek paketler gerektirebilir.
FROM node:20-alpine AS base
WORKDIR /app

# Tüm aşamalarda kullanılacak ortak ortam değişkenleri
ENV NEXT_TELEMETRY_DISABLED=1 \
    JWT_SECRET=cpFZHH5zLazWQ0n5+iq+Fmk0AVS1j6fd/tRbai7suMQ= \
    REFRESH_TOKEN_SECRET=cpFZHH5zLazWQ0n5+iq+Fmk0AVS1j6fd/tRbai7suMQ= \
    ACCESS_TOKEN_EXPIRES_IN=15m \
    REFRESH_TOKEN_EXPIRES_IN=7d \
    ENCRYPTION_KEY=aB7cD9eF2gH5jK8mN0pQ3rS6tU1vW4xY \
    PUBLIC_SERVER_URL=http://localhost:3003

# ---- Dependencies Stage ----
# Bu aşamada sadece bağımlılıklar yüklenir.
# Bu, Docker katman önbelleğini daha iyi kullanmamızı sağlar.
FROM base AS deps
WORKDIR /app

# package.json ve lock dosyasını kopyala
COPY package.json package-lock.json* ./

# Paket yöneticisine göre bağımlılıkları yükle
RUN npm ci

# ---- Builder Stage ----
# Bu aşamada uygulama build edilir.
FROM base AS builder
WORKDIR /app

# Build için gerekli olabilecek derleme araçları (node-gyp bağımlılıkları için)
RUN apk update && apk add --no-cache libc6-compat python3 make g++

# Bağımlılıkları bir önceki aşamadan kopyala
COPY --from=deps /app/node_modules ./node_modules

# Tüm proje dosyalarını kopyala
COPY . .

# Prisma Client'ı oluştur
RUN npx prisma generate

# Build için gerekli ek ortam değişkenleri
ENV DATABASE_URL=postgresql://postgres:P@ssw0rd@localhost:5432/postgres?schema=public

# Uygulamayı build et
RUN npm run build

# ---- Runner Stage (Production Image) ----
# Bu aşamada son, çalıştırılabilir imaj oluşturulur.
FROM base AS runner
WORKDIR /app

# Sadece runtime için gerekli sistem paketlerini yükle
RUN apk update && apk add --no-cache libc6-compat openssl postgresql-client

# Güvenlik için root olmayan bir kullanıcı oluştur ve kullan
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Üretim ortamı değişkenleri
ENV NODE_ENV=production \
    PORT=3000

# Gerekli dosyaları kopyala
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Çalıştırma izinlerini ayarla
RUN chmod +x ./docker-entrypoint.sh && \
    mkdir -p /app/uploads /app/logs && \
    chown -R nextjs:nodejs /app/uploads /app/logs

# Kullanıcıyı nextjs olarak ayarla
USER nextjs

# Port ayarı
EXPOSE 3000

# Entrypoint ve komut
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
