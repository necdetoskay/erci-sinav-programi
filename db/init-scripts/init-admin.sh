#!/bin/sh
# Bu script, veritabanı migrasyonlarını çalıştırır ve superadmin kullanıcısını oluşturur/günceller

# Renkli konsol çıktısı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo "${BOLD}${CYAN}Veritabanı hazırlık işlemleri başlatılıyor...${NC}"

# Veritabanının hazır olmasını bekle
echo "${YELLOW}Veritabanının hazır olması bekleniyor...${NC}"
npx wait-on tcp:db:5432 -t 300000

# Veritabanının tamamen başlaması için biraz daha bekle
echo "${YELLOW}Veritabanının tamamen başlaması için 30 saniye bekleniyor...${NC}"
sleep 30

# Veritabanı bağlantısını test et
echo "${YELLOW}Veritabanı bağlantısı test ediliyor...${NC}"
# pg_isready komutunu kullanmak yerine basit bir bağlantı testi yapalım
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if nc -z db 5432; then
    echo "${GREEN}Veritabanı bağlantısı başarılı.${NC}"

    # Prisma migrasyonlarını çalıştır
    echo "${YELLOW}Veritabanı migrasyonları çalıştırılıyor...${NC}"
    npx prisma migrate deploy

    # Prisma client'ı yeniden oluştur
    echo "${YELLOW}Prisma client yeniden oluşturuluyor...${NC}"
    npx prisma generate

    # Superadmin kullanıcısını oluştur/güncelle
    echo "${YELLOW}Superadmin kullanıcısı oluşturuluyor/güncelleniyor...${NC}"
    node /app/db/init-scripts/create-superadmin.js

    break
  else
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "${YELLOW}Veritabanı bağlantısı kurulamadı. Deneme: $RETRY_COUNT/$MAX_RETRIES. 5 saniye sonra tekrar denenecek...${NC}"
    sleep 5
  fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "${RED}Veritabanı bağlantısı kurulamadı. Maksimum deneme sayısına ulaşıldı.${NC}"
  echo "${YELLOW}Prisma işlemleri atlanıyor...${NC}"
fi

echo "${BOLD}${GREEN}Veritabanı hazırlık işlemleri tamamlandı.${NC}"

# Uygulamayı başlat
echo "${BOLD}${CYAN}Uygulama başlatılıyor...${NC}"
exec "$@"
