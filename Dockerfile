# ---- Base Stage ----
# Temel imaj olarak Node.js 20 Alpine kullanıyoruz.
# Alpine, küçük imaj boyutları sağlar ancak bazen ek paketler gerektirebilir.
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies Stage ----
# Bu aşamada sadece bağımlılıklar yüklenir.
# Bu, Docker katman önbelleğini daha iyi kullanmamızı sağlar.
FROM base AS deps
WORKDIR /app

# package.json ve lock dosyasını kopyala
COPY package.json ./
# Projenizde kullandığınız lock dosyasına göre (package-lock.json, yarn.lock, pnpm-lock.yaml)
# aşağıdaki satırlardan uygun olanı aktif bırakın veya hepsini kopyalayın.
COPY package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Paket yöneticisine göre bağımlılıkları yükle
# Eğer pnpm kullanıyorsanız, aşağıdaki satırları aktif edin ve npm ci'yi yorumlayın:
# RUN apk add --no-cache --virtual .pnpm-deps curl && \
#     curl -fsSL https://get.pnpm.io/install.sh | sh - && \
#     pnpm install --frozen-lockfile && \
#     apk del .pnpm-deps
# Eğer yarn kullanıyorsanız:
# RUN yarn install --frozen-lockfile
# Varsayılan olarak npm kullanılıyor:
RUN npm ci

# ---- Builder Stage ----
# Bu aşamada uygulama build edilir.
FROM base AS builder
WORKDIR /app

# Build için gerekli olabilecek derleme araçları (node-gyp bağımlılıkları için)
# Eğer projenizde C++/Python derlemesi gerektiren paketler yoksa bunlar kaldırılabilir.
RUN apk update && apk add --no-cache libc6-compat python3 make g++

# Bağımlılıkları bir önceki aşamadan kopyala
COPY --from=deps /app/node_modules ./node_modules
# Tüm proje dosyalarını kopyala
COPY . .

# Build sırasında kullanılacak ortam değişkenleri (ARG ile tanımlanır)
# Bu değişkenler `docker build --build-arg VAR_NAME=value` ile dışarıdan verilebilir.
# Next.js, build sırasında .env.local dosyasını otomatik olarak okur,
# bu nedenle burada ARG olarak tanımlamak her zaman gerekmeyebilir,
# ancak CI/CD ortamlarında faydalı olabilir.
# ARG DATABASE_URL
# ARG JWT_SECRET
# ARG REFRESH_TOKEN_SECRET
# ARG ACCESS_TOKEN_EXPIRES_IN
# ARG REFRESH_TOKEN_EXPIRES_IN
# ARG NEXT_PUBLIC_APP_URL

# Prisma Client'ı oluştur
RUN npx prisma generate

# Disable Nextjs telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# JWT için gerekli ortam değişkenleri
ENV JWT_SECRET=1f7b2c4d8e9a3f0c5b6d7a8e9f0c1b2a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a
ENV REFRESH_TOKEN_SECRET=c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9
ENV ACCESS_TOKEN_EXPIRES_IN=15m
ENV REFRESH_TOKEN_EXPIRES_IN=7d

# Paket yöneticinize göre build komutunu ayarlayın
# Eğer pnpm kullanıyorsanız:
# RUN pnpm run build
# Varsayılan olarak npm/yarn:
RUN npm run build

# ---- Runner Stage (Production Image) ----
# Bu aşamada son, çalıştırılabilir imaj oluşturulur.
FROM base AS runner
WORKDIR /app

# Sadece runtime için gerekli sistem paketlerini yükle
# postgresql-client, veritabanı işlemleri için (örn: migration, seed) gerekebilir.
# openssl ve libc6-compat genellikle base alpine imajında gelir veya gereklidir.
RUN apk update && apk add --no-cache libc6-compat openssl postgresql-client

# Güvenlik için root olmayan bir kullanıcı oluştur ve kullan
ENV NODE_ENV production

# JWT için gerekli ortam değişkenleri
ENV JWT_SECRET=1f7b2c4d8e9a3f0c5b6d7a8e9f0c1b2a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a
ENV REFRESH_TOKEN_SECRET=c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9
ENV ACCESS_TOKEN_EXPIRES_IN=15m
ENV REFRESH_TOKEN_EXPIRES_IN=7d

# Gerekli bağımlılıkları yükle
RUN npm install bcryptjs wait-on

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# USER nextjs # USER komutunu CMD'den hemen önceye almak daha iyi olabilir.

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

# Next.js 13+ standalone output'u, .next/static dosyalarını genellikle
# .next/standalone/.next/static altına kendisi kopyalar.
# Eğer manuel kopyalama gerekiyorsa (eski Next.js versiyonları veya özel durumlar için):
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# init-admin.sh script'ini kopyala ve çalıştırılabilir yap
COPY --from=builder --chown=nextjs:nodejs /app/db/init-scripts/init-admin.sh /app/db/init-scripts/init-admin.sh
COPY --from=builder --chown=nextjs:nodejs /app/db/init-scripts/create-admin-user.js /app/db/init-scripts/create-admin-user.js
RUN chmod +x /app/db/init-scripts/init-admin.sh

# Çalışma dizinindeki dosyaların sahibi olarak nextjs kullanıcısını ayarla
# Bu, CMD komutu çalışmadan önce yapılmalı.
USER nextjs

EXPOSE 3000
ENV PORT=3000

# Uygulamayı başlat (standalone modda)
CMD ["node", "server.js"]
