#!/bin/bash
# Bu script, üretim ortamında uygulamayı başlatmak için gerekli dizinleri oluşturur ve Docker Compose'u çalıştırır.

# Renkli konsol çıktısı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo "${BOLD}${CYAN}Erci Sınav Programı - Üretim Ortamı Kurulumu${NC}"

# Gerekli dizinleri oluştur
echo "${YELLOW}Gerekli dizinler oluşturuluyor...${NC}"
mkdir -p persistent-data-prod/postgres persistent-data-prod/pgadmin persistent-data-prod/uploads
mkdir -p logs

# Docker Compose ile uygulamayı başlat
echo "${YELLOW}Docker Compose ile uygulama başlatılıyor...${NC}"
docker-compose -f docker-compose.production.yml up -d

# Uygulama durumunu kontrol et
echo "${YELLOW}Uygulama durumu kontrol ediliyor...${NC}"
docker-compose -f docker-compose.production.yml ps

echo "${BOLD}${GREEN}Kurulum tamamlandı!${NC}"
echo "${BOLD}${BLUE}Uygulama http://localhost:3001 adresinde çalışıyor.${NC}"
echo "${BOLD}${BLUE}Admin kullanıcısı: admin@kentkonut.com.tr${NC}"
echo "${BOLD}${BLUE}Şifre: Bi41*42*${NC}"
