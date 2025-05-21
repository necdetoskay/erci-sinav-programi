# Next.js + Docker Deployment Guide

Bu rehber, Next.js uygulamalarının Docker kullanılarak nasıl doğru bir şekilde yapılandırılacağını ve dağıtılacağını açıklar. Özellikle Next.js'in standalone modunu ve Prisma ORM ile PostgreSQL veritabanını kullanan projeler için optimize edilmiştir.

## İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Proje Yapısı](#proje-yapısı)
3. [Next.js Yapılandırması](#nextjs-yapılandırması)
4. [Docker Yapılandırması](#docker-yapılandırması)
5. [Docker Compose Yapılandırması](#docker-compose-yapılandırması)
6. [Veritabanı Yönetimi](#veritabanı-yönetimi)
7. [Kullanıcı Yönetimi](#kullanıcı-yönetimi)
8. [Kalıcı Veri Yönetimi](#kalıcı-veri-yönetimi)
9. [Deployment Scriptleri](#deployment-scriptleri)
10. [Sorun Giderme](#sorun-giderme)
11. [Güvenlik Önlemleri](#güvenlik-önlemleri)
12. [Kontrol Listesi](#kontrol-listesi)

## Gereksinimler

- Docker (en son sürüm)
- Docker Compose (en son sürüm)
- Node.js 18+ (geliştirme için)
- Git

## Proje Yapısı

Projenizin aşağıdaki temel dosyalara sahip olduğundan emin olun:

```
project-root/
├── app/                    # Next.js uygulama kodu
├── components/             # React bileşenleri
├── lib/                    # Yardımcı fonksiyonlar ve kütüphaneler
├── prisma/                 # Prisma şema ve migrasyonları
│   └── schema.prisma       # Veritabanı şeması
├── public/                 # Statik dosyalar
├── scripts/                # Yardımcı scriptler
│   └── create-admin.js     # Admin kullanıcı oluşturma scripti
├── .dockerignore           # Docker'da yoksayılacak dosyalar
├── .env.example            # Örnek çevre değişkenleri
├── .gitignore              # Git'te yoksayılacak dosyalar
├── docker-compose.yml      # Docker Compose yapılandırması
├── Dockerfile              # Docker imaj yapılandırması
├── next.config.js          # Next.js yapılandırması
├── package.json            # Proje bağımlılıkları
└── tsconfig.json           # TypeScript yapılandırması
```

## Next.js Yapılandırması

### Standalone Modu Nedir ve Neden Önemlidir?

Next.js'in standalone modu, uygulamanızı minimum bağımlılıklarla çalıştırılabilecek şekilde optimize eder. Bu mod, Docker konteynerlerinde çalıştırmak için özellikle önemlidir çünkü:

1. **Daha Küçük İmaj Boyutu:** Sadece gerekli dosyaları içerir, `node_modules` klasörünün tamamını değil.
2. **Daha Hızlı Başlatma:** Daha az dosya ve bağımlılık olduğu için konteyner daha hızlı başlar.
3. **Daha Az Bellek Kullanımı:** Optimize edilmiş yapı daha az bellek kullanır.
4. **Daha İyi Güvenlik:** Daha az bağımlılık, daha az güvenlik açığı demektir.
5. **Daha Kolay Dağıtım:** Tek bir `server.js` dosyası ile uygulamanızı başlatabilirsiniz.

### Standalone Modu Yapılandırma

Next.js uygulamanızı standalone modda çalıştırmak için `next.config.js` dosyasında aşağıdaki yapılandırmayı kullanın:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output aktif - ÇOK ÖNEMLİ
  output: 'standalone',

  // Diğer yapılandırmalar...
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
```

`output: 'standalone'` ayarı, Next.js'in uygulamanızı bağımsız bir sunucu olarak çalıştırılabilecek şekilde optimize etmesini sağlar. Bu ayar olmadan, Docker konteynerinde uygulamanızı çalıştırmak için tüm `node_modules` klasörünü kopyalamanız gerekir, bu da imaj boyutunu gereksiz yere artırır.

### Standalone Mod Çıktısı

Standalone mod etkinleştirildiğinde, Next.js build işlemi sonucunda `.next/standalone` dizininde aşağıdaki dosyaları oluşturur:

- `server.js`: Uygulamanızı başlatmak için kullanılan ana dosya
- `node_modules`: Sadece çalışma zamanı bağımlılıklarını içeren küçük bir klasör
- `.next`: Optimize edilmiş uygulama dosyaları

Bu dosyaları Docker konteynerinize kopyalamanız ve `CMD ["node", "server.js"]` komutu ile uygulamanızı başlatmanız yeterlidir.

## Docker Yapılandırması

### Dockerfile

Aşağıda, Next.js uygulamanız için çok aşamalı bir Dockerfile örneği bulunmaktadır:

```dockerfile
# ---- Base Stage ----
FROM node:20-alpine AS base
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
RUN apk update && apk add --no-cache libc6-compat python3 make g++

# Bağımlılıkları kopyala
COPY --from=deps /app/node_modules ./node_modules
# Tüm proje dosyalarını kopyala
COPY . .

# Prisma Client'ı oluştur
RUN npx prisma generate

# Disable Nextjs telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Uygulamayı build et
RUN npm run build

# ---- Runner Stage (Production Image) ----
FROM base AS runner
WORKDIR /app

# Gerekli paketleri yükle
RUN apk update && apk add --no-cache libc6-compat openssl postgresql-client

# Ortam değişkenlerini ayarla
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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
```

### .dockerignore

Docker imajını oluştururken gereksiz dosyaları hariç tutmak için bir `.dockerignore` dosyası oluşturun:

```
# Version control
.git
.gitignore
.github

# Node.js
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log

# Build output
# .next - We need to include .next for the standalone output

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Docker
Dockerfile
docker-compose.yml
.dockerignore

# Logs
logs
*.log

# OS specific
.DS_Store
Thumbs.db

# IDE specific
.idea
.vscode
*.swp
*.swo

# Testing
coverage
.nyc_output
cypress/videos
cypress/screenshots

# Temporary files
tmp
temp

# Persistent data
sinav-portali
```

## Docker Compose Yapılandırması

Uygulamanızı ve veritabanını birlikte çalıştırmak için bir `docker-compose.yml` dosyası oluşturun:

```yaml
services:
  app:
    container_name: your-app-name
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3003:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-jwt-secret
      - REFRESH_TOKEN_SECRET=your-refresh-token-secret
      - ACCESS_TOKEN_EXPIRES_IN=15m
      - REFRESH_TOKEN_EXPIRES_IN=7d
      - DATABASE_URL=postgresql://postgres:password@db:5432/postgres?schema=public
      - NEXT_PUBLIC_APP_URL=http://localhost:3003
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASS=password
      - DB_NAME=postgres
      - PORT=3000
      - HOSTNAME=0.0.0.0
    volumes:
      - ./sinav-portali/persistent-data/uploads:/app/uploads
      - ./sinav-portali/persistent-data/logs:/app/logs
    depends_on:
      - db
    networks:
      - app-network

  db:
    container_name: your-db-name
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_USER=postgres
      - POSTGRES_DB=postgres
    ports:
      - "5432:5432"
    volumes:
      - ./sinav-portali/persistent-data/postgres:/var/lib/postgresql/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Veritabanı Yönetimi

### Prisma Yapılandırması

Prisma ORM'yi kullanarak veritabanı şemanızı yönetin. `prisma/schema.prisma` dosyasında veritabanı bağlantınızı yapılandırın:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Veritabanı modelleri...
```

### Veritabanı Migrasyonları

Docker entrypoint script'i, uygulama başlatılırken otomatik olarak veritabanı migrasyonlarını çalıştırır. Bu, `npx prisma db push --accept-data-loss` komutu ile yapılır.

## Kullanıcı Yönetimi

### Admin Kullanıcı Oluşturma

Admin kullanıcıları oluşturmak için `scripts/create-admin.js` dosyasını kullanın:

```javascript
// Admin kullanıcı oluşturma scripti
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('Veritabanı bağlantısı kontrol ediliyor...');
    await prisma.$connect();
    console.log('Veritabanı bağlantısı başarılı.');

    // Superadmin kullanıcı bilgileri
    const superadminEmail = 'superadmin@example.com';
    const superadminPassword = 'secure-password';
    const superadminName = 'Super Admin';

    // Superadmin kullanıcısını kontrol et
    const existingSuperadmin = await prisma.user.findUnique({
      where: { email: superadminEmail }
    });

    // Superadmin kullanıcısı yoksa oluştur
    if (!existingSuperadmin) {
      console.log(`Superadmin kullanıcısı oluşturuluyor: ${superadminEmail}`);

      // Şifreyi hashle
      const hashedPassword = await bcrypt.hash(superadminPassword, 10);

      // Superadmin kullanıcısını oluştur
      const superadmin = await prisma.user.create({
        data: {
          email: superadminEmail,
          name: superadminName,
          password: hashedPassword,
          role: 'SUPERADMIN',
          emailVerified: new Date() // E-posta doğrulanmış olarak işaretle
        }
      });

      console.log(`Superadmin kullanıcısı oluşturuldu: ${superadmin.email}`);
    } else {
      console.log(`Superadmin kullanıcısı zaten mevcut: ${existingSuperadmin.email}`);
    }

    console.log('İşlem tamamlandı.');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
createAdminUser();
```

## Kalıcı Veri Yönetimi

Kalıcı verileri yönetmek için Docker volume'ları kullanın. Bu, konteynerler silinse bile verilerin korunmasını sağlar.

```yaml
volumes:
  - ./sinav-portali/persistent-data/postgres:/var/lib/postgresql/data
  - ./sinav-portali/persistent-data/uploads:/app/uploads
  - ./sinav-portali/persistent-data/logs:/app/logs
```

## Deployment Scriptleri

### start.ps1 (Windows)

```powershell
# Başlatma Betiği

# Gerekli dizinleri oluştur
Write-Host "Kalıcı veri dizinleri oluşturuluyor..." -ForegroundColor Green
New-Item -Path "sinav-portali/persistent-data/postgres", "sinav-portali/persistent-data/uploads", "sinav-portali/persistent-data/logs" -ItemType Directory -Force

# Docker Compose ile uygulamayı başlat
Write-Host "Uygulama başlatılıyor..." -ForegroundColor Green
docker-compose up -d

# Konteyner durumlarını göster
Write-Host "Konteyner durumları:" -ForegroundColor Green
docker ps
```

### stop.ps1 (Windows)

```powershell
# Durdurma Betiği

# Uygulamayı durdur
Write-Host "Uygulama durduruluyor..." -ForegroundColor Yellow
docker-compose down

Write-Host "`nUygulama başarıyla durduruldu!" -ForegroundColor Cyan
Write-Host "Kalıcı verileriniz 'sinav-portali/persistent-data' dizininde saklanmaktadır." -ForegroundColor Cyan
```

### rebuild.ps1 (Windows)

```powershell
# Yeniden Oluşturma Betiği

# Uygulamayı durdur
Write-Host "Uygulama durduruluyor..." -ForegroundColor Yellow
docker-compose down

# Docker imajını yeniden oluştur
Write-Host "Docker imajı yeniden oluşturuluyor..." -ForegroundColor Green
docker-compose build --no-cache app

# Uygulamayı başlat
Write-Host "Uygulama başlatılıyor..." -ForegroundColor Green
docker-compose up -d

# Konteyner durumlarını göster
Write-Host "Konteyner durumları:" -ForegroundColor Green
docker ps
```

## Sorun Giderme

### Veritabanı Bağlantı Sorunları

Veritabanı bağlantı sorunlarını çözmek için:

1. Veritabanı konteynerinin çalıştığından emin olun:
   ```bash
   docker ps
   ```

2. Veritabanı loglarını kontrol edin:
   ```bash
   docker logs your-db-name
   ```

3. Veritabanı bağlantı bilgilerinin doğru olduğundan emin olun:
   ```bash
   docker exec -it your-app-name env | grep DB_
   ```

### Uygulama Başlatma Sorunları

Uygulama başlatma sorunlarını çözmek için:

1. Uygulama loglarını kontrol edin:
   ```bash
   docker logs your-app-name
   ```

2. Entrypoint script'inin doğru çalıştığından emin olun:
   ```bash
   docker exec -it your-app-name cat /docker-entrypoint.sh
   ```

3. Next.js standalone modunun doğru yapılandırıldığından emin olun:
   ```bash
   docker exec -it your-app-name ls -la
   docker exec -it your-app-name ls -la .next
   ```

## Docker İmaj Optimizasyonu

Docker imajlarınızı optimize etmek, daha hızlı dağıtım, daha az depolama alanı ve daha iyi güvenlik sağlar. İşte bazı optimizasyon teknikleri:

### 1. Çok Aşamalı Build Kullanın

Çok aşamalı build, daha küçük ve daha güvenli Docker imajları oluşturmanıza olanak tanır:

```dockerfile
# Build aşaması
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Çalışma aşaması
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
```

### 2. .dockerignore Dosyası Kullanın

Gereksiz dosyaları Docker build bağlamından hariç tutmak için `.dockerignore` dosyası kullanın:

```
node_modules
.git
.github
.vscode
*.log
```

### 3. Küçük Temel İmajlar Kullanın

Daha küçük temel imajlar kullanarak imaj boyutunu azaltın:

```dockerfile
# Daha büyük
FROM node:20

# Daha küçük
FROM node:20-alpine
```

### 4. Katmanları Optimize Edin

Sık değişen dosyaları daha sonra kopyalayarak Docker katmanlarını optimize edin:

```dockerfile
# Önce: Nadiren değişen dosyalar
COPY package.json package-lock.json ./
RUN npm install

# Sonra: Sık değişen dosyalar
COPY . .
```

### 5. Gereksiz Paketleri Kaldırın

Üretim imajında gereksiz paketleri kaldırın:

```dockerfile
RUN npm install --production
# veya
RUN npm ci --production
```

## Güvenlik Önlemleri

### 1. Hassas Bilgileri Yönetme

Hassas bilgileri güvenli bir şekilde yönetin:

- Hassas bilgileri doğrudan Dockerfile veya docker-compose.yml dosyalarına yazmayın.
- Docker Compose'da çevre değişkenleri veya harici bir `.env` dosyası kullanın.
- Üretim ortamında Docker Swarm veya Kubernetes secrets kullanmayı düşünün.

```yaml
services:
  app:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=${DATABASE_URL}
```

### 2. Root Olmayan Kullanıcı Kullanın

Güvenliği artırmak için root olmayan bir kullanıcı ile Docker konteynerlerini çalıştırın:

```dockerfile
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
```

### 3. İmaj Güvenlik Taraması

Docker imajlarınızı güvenlik açıkları için düzenli olarak tarayın:

```bash
# Docker Scout kullanarak
docker scout cves your-image-name

# Trivy kullanarak
trivy image your-image-name
```

### 4. Güncel Bağımlılıklar

Bağımlılıklarınızı güncel tutun ve güvenlik güncellemelerini düzenli olarak uygulayın:

```bash
npm audit fix
```

### 5. Sıkılaştırılmış Konteynerler

Konteynerlerinizi sıkılaştırmak için:

- Sadece gerekli paketleri yükleyin.
- Gereksiz servisleri ve portları kapatın.
- Dosya izinlerini kısıtlayın.
- Konteyner kaynaklarını sınırlayın (CPU, bellek).

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### 6. Güvenli İletişim

Servisler arasında güvenli iletişim sağlayın:

- Harici erişim için HTTPS kullanın.
- İç servisler için şifreli bağlantılar veya VPN kullanın.
- Güvenlik duvarı kuralları ile erişimi kısıtlayın.

## Kontrol Listesi

Deployment öncesi bu kontrol listesini kullanın:

- [ ] `next.config.js` dosyasında `output: 'standalone'` ayarı var mı?
- [ ] Dockerfile'da `.next/standalone` dizini kopyalanıyor mu?
- [ ] Dockerfile'da `CMD ["node", "server.js"]` komutu doğru mu?
- [ ] Docker Compose'da tüm gerekli çevre değişkenleri tanımlanmış mı?
- [ ] Kalıcı veri dizinleri doğru yapılandırılmış mı?
- [ ] Veritabanı migrasyonları entrypoint script'inde çalıştırılıyor mu?
- [ ] Admin kullanıcı oluşturma scripti entrypoint'te çağrılıyor mu?
- [ ] Güvenlik önlemleri alınmış mı?

## Yaygın Hatalar ve Çözümleri

### 1. "server.js not found" Hatası

**Sorun:** Docker konteynerinde `server.js` dosyası bulunamıyor.

**Çözüm:**
- `next.config.js` dosyasında `output: 'standalone'` ayarının olduğundan emin olun.
- Dockerfile'da `.next/standalone` dizininin kök dizine kopyalandığından emin olun:
  ```dockerfile
  COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
  ```
- Build aşamasında Next.js'in başarıyla derlendiğinden emin olun:
  ```bash
  docker logs your-app-name | grep "Creating an optimized production build"
  ```

### 2. Veritabanı Bağlantı Hataları

**Sorun:** Uygulama veritabanına bağlanamıyor.

**Çözüm:**
- Docker Compose'da veritabanı servisinin doğru yapılandırıldığından emin olun.
- Veritabanı bağlantı bilgilerinin doğru olduğundan emin olun:
  ```
  DATABASE_URL=postgresql://postgres:password@db:5432/postgres?schema=public
  ```
- Entrypoint script'inde veritabanı bağlantısının kontrol edildiğinden emin olun.
- Veritabanı konteynerinin önce başlatıldığından emin olmak için `depends_on` kullanın.

### 3. Prisma Migrasyonu Hataları

**Sorun:** Prisma migrasyonları çalıştırılamıyor.

**Çözüm:**
- Prisma şemasının doğru olduğundan emin olun.
- Entrypoint script'inde `npx prisma db push` veya `npx prisma migrate deploy` komutunun çalıştırıldığından emin olun.
- Prisma Client'ın build aşamasında oluşturulduğundan emin olun:
  ```dockerfile
  RUN npx prisma generate
  ```

### 4. Statik Dosya Erişim Sorunları

**Sorun:** CSS, JS veya resim dosyaları yüklenmiyor.

**Çözüm:**
- `.next/static` dizininin doğru kopyalandığından emin olun:
  ```dockerfile
  COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
  ```
- `public` dizininin doğru kopyalandığından emin olun:
  ```dockerfile
  COPY --from=builder --chown=nextjs:nodejs /app/public ./public
  ```

### 5. Çevre Değişkeni Sorunları

**Sorun:** Uygulama çevre değişkenlerine erişemiyor.

**Çözüm:**
- Build zamanı değişkenleri için `next.config.js` içinde `env` veya `publicRuntimeConfig` kullanın.
- Çalışma zamanı değişkenleri için Docker Compose'da `environment` bölümünü kullanın.
- Gizli değişkenler için `.env` dosyası yerine Docker Compose'da tanımlama yapın.

## En İyi Uygulamalar

1. **Multi-stage Build Kullanın:** Daha küçük ve güvenli Docker imajları için çok aşamalı build kullanın.

2. **Standalone Modu Etkinleştirin:** Next.js'in standalone modunu kullanarak daha optimize edilmiş bir dağıtım yapın.

3. **Sağlık Kontrolü Ekleyin:** Uygulamanızın durumunu kontrol etmek için bir sağlık kontrolü endpoint'i ekleyin:
   ```javascript
   // pages/api/health.js
   export default function handler(req, res) {
     res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
   }
   ```

4. **Otomatik Yedekleme Yapın:** Veritabanı verilerinizi düzenli olarak yedekleyin:
   ```bash
   # backup.sh
   #!/bin/bash
   BACKUP_DIR="./backups"
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   mkdir -p $BACKUP_DIR
   docker exec your-db-name pg_dump -U postgres postgres > $BACKUP_DIR/backup_$TIMESTAMP.sql
   ```

5. **Loglama Stratejisi Oluşturun:** Uygulamanızın loglarını düzenli olarak toplayın ve analiz edin:
   ```yaml
   volumes:
     - ./sinav-portali/persistent-data/logs:/app/logs
   ```

6. **Güvenlik Taramaları Yapın:** Docker imajlarınızı güvenlik açıkları için düzenli olarak tarayın:
   ```bash
   docker scan your-app-name
   ```

7. **Performans İzleme Ekleyin:** Uygulamanızın performansını izlemek için izleme araçları ekleyin.

Bu kontrol listesini ve en iyi uygulamaları takip ederek, Next.js uygulamalarınızı Docker ile sorunsuz bir şekilde dağıtabilirsiniz.

## Sonuç

Bu rehberde, Next.js uygulamalarını Docker ile dağıtmanın en iyi yöntemlerini ele aldık. Özellikle Next.js'in standalone modunun doğru yapılandırılması, Docker imajlarının optimize edilmesi ve veritabanı entegrasyonunun sağlanması konularına odaklandık.

Özetlemek gerekirse, başarılı bir Next.js Docker dağıtımı için şu adımları izleyin:

1. **Next.js Yapılandırması**: `next.config.js` dosyasında `output: 'standalone'` ayarını etkinleştirin.
2. **Dockerfile Optimizasyonu**: Çok aşamalı build kullanın ve `.next/standalone` dizinini doğru şekilde kopyalayın.
3. **Docker Compose**: Uygulamanızı ve veritabanınızı birlikte çalıştırmak için Docker Compose kullanın.
4. **Veritabanı Yönetimi**: Prisma migrasyonlarını entrypoint script'inde çalıştırın.
5. **Kullanıcı Yönetimi**: Admin kullanıcıları otomatik olarak oluşturun.
6. **Kalıcı Veri**: Kalıcı verileri Docker volume'ları ile yönetin.
7. **Güvenlik**: Root olmayan kullanıcı kullanın ve güvenlik taramaları yapın.
8. **İzleme**: Sağlık kontrolü ve loglama stratejisi oluşturun.

Bu rehberi takip ederek, Next.js uygulamalarınızı Docker ile sorunsuz bir şekilde dağıtabilir ve "server.js not found" gibi yaygın hataları önleyebilirsiniz.

Unutmayın ki, her projenin kendine özgü gereksinimleri olabilir. Bu rehberi kendi projenizin ihtiyaçlarına göre uyarlamaktan çekinmeyin.

---

**Son Güncelleme**: `$(date +%d.%m.%Y)`
