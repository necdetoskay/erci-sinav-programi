#!/bin/bash
# Bu script, Docker Hub'dan image'ları çekerek uygulamayı başlatmak için gerekli dizinleri oluşturur ve Docker Compose'u çalıştırır.

# Renkli konsol çıktısı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo "${BOLD}${CYAN}Erci Sınav Programı - Docker Hub'dan Kurulum${NC}"

# Gerekli dizinleri oluştur
echo "${YELLOW}Gerekli dizinler oluşturuluyor...${NC}"
mkdir -p persistent-data-prod/postgres persistent-data-prod/pgadmin persistent-data-prod/uploads
mkdir -p logs

# .env.hub dosyasını kontrol et
if [ ! -f .env.hub ]; then
    echo "${RED}.env.hub dosyası bulunamadı. Örnek dosya oluşturuluyor...${NC}"
    cat > .env.hub << EOL
# Database connection string
DATABASE_URL=postgresql://postgres:P@ssw0rd@db:5432/kentkonutdb?schema=public

# JWT secrets
JWT_SECRET=cpFZHH5zLazWQ0n5+iq+Fmk0AVS1j6fd/tRbai7suMQ=
REFRESH_TOKEN_SECRET=cpFZHH5zLazWQ0n5+iq+Fmk0AVS1j6fd/tRbai7suMQ=

# Token süreleri
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Uygulama URL'i
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Node environment
NODE_ENV=production

# Admin şifresi
ADMIN_PASSWORD=Bi41*42*

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=P@ssw0rd
POSTGRES_DB=kentkonutdb
EOL
    echo "${YELLOW}.env.hub dosyası oluşturuldu. Lütfen gerekli değişiklikleri yapın.${NC}"
fi

# docker-compose.hub.yml dosyasını kontrol et
if [ ! -f docker-compose.hub.yml ]; then
    echo "${RED}docker-compose.hub.yml dosyası bulunamadı. Örnek dosya oluşturuluyor...${NC}"
    cat > docker-compose.hub.yml << EOL
version: '3.8'

services:
  app:
    container_name: erci-sinav-programi
    image: necdetoskay/erci-sinav-programi:latest
    restart: always
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=\${NODE_ENV}
      - DATABASE_URL=\${DATABASE_URL}
      - JWT_SECRET=\${JWT_SECRET}
      - REFRESH_TOKEN_SECRET=\${REFRESH_TOKEN_SECRET}
      - ACCESS_TOKEN_EXPIRES_IN=\${ACCESS_TOKEN_EXPIRES_IN}
      - REFRESH_TOKEN_EXPIRES_IN=\${REFRESH_TOKEN_EXPIRES_IN}
      - NEXT_PUBLIC_APP_URL=\${NEXT_PUBLIC_APP_URL}
      - ADMIN_PASSWORD=\${ADMIN_PASSWORD}
    depends_on:
      - db
    volumes:
      - uploads-data:/app/uploads
      - ./logs:/app/logs
    entrypoint: ["/bin/sh", "/app/db/init-scripts/init-admin.sh"]
    command: ["node", "server.js"]

  db:
    container_name: erci-sinav-db
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${POSTGRES_DB}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d kentkonutdb"]
      interval: 5s
      timeout: 3s
      retries: 5

  pgadmin:
    container_name: erci-sinav-pgadmin
    image: dpage/pgadmin4
    restart: always
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@example.com
      - PGADMIN_DEFAULT_PASSWORD=admin
    ports:
      - "5050:80"
    volumes:
      - pgadmin-data:/var/lib/pgadmin
    depends_on:
      - db

volumes:
  postgres-data:
  pgadmin-data:
  uploads-data:
EOL
    echo "${YELLOW}docker-compose.hub.yml dosyası oluşturuldu. Lütfen gerekli değişiklikleri yapın.${NC}"
fi

# Docker Compose ile uygulamayı başlat
echo "${YELLOW}Docker Compose ile uygulama başlatılıyor...${NC}"
docker-compose -f docker-compose.hub.yml --env-file .env.hub up -d

# Uygulama durumunu kontrol et
echo "${YELLOW}Uygulama durumu kontrol ediliyor...${NC}"
docker-compose -f docker-compose.hub.yml ps

echo "${BOLD}${GREEN}Kurulum tamamlandı!${NC}"
echo "${BOLD}${BLUE}Uygulama http://localhost:3001 adresinde çalışıyor.${NC}"
echo "${BOLD}${BLUE}pgAdmin http://localhost:5050 adresinde çalışıyor.${NC}"
echo "${BOLD}${BLUE}Admin kullanıcısı: admin@kentkonut.com.tr${NC}"
echo "${BOLD}${BLUE}Şifre: Bi41*42*${NC}"
