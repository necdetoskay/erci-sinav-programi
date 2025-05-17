#!/bin/bash

# Kent Konut Sınav Portalı Kurulum Scripti
# Bu script, Kent Konut Sınav Portalı'nı Docker Hub'dan çekip çalıştırır

# Renkli çıktı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Kent Konut Sınav Portalı Kurulum Scripti${NC}"
echo "======================================"

# Docker ve Docker Compose kontrolü
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker bulunamadı. Lütfen Docker'ı yükleyin.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose bulunamadı. Lütfen Docker Compose'u yükleyin.${NC}"
    exit 1
fi

echo -e "${GREEN}Docker ve Docker Compose bulundu.${NC}"

# Gerekli dizinleri oluştur
echo -e "${YELLOW}Gerekli dizinler oluşturuluyor...${NC}"
mkdir -p persistent-data/postgres persistent-data/pgadmin persistent-data/uploads logs
echo -e "${GREEN}Dizinler oluşturuldu.${NC}"

# Docker Compose dosyasını indir
echo -e "${YELLOW}Docker Compose dosyası indiriliyor...${NC}"
if [ -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}docker-compose.yml dosyası zaten mevcut. Yedekleniyor...${NC}"
    mv docker-compose.yml docker-compose.yml.bak
fi

# Docker Compose Hub dosyasını indir veya kopyala
if [ -f "docker-compose.hub.yml" ]; then
    echo -e "${YELLOW}docker-compose.hub.yml dosyası mevcut. Kopyalanıyor...${NC}"
    cp docker-compose.hub.yml docker-compose.yml
else
    echo -e "${YELLOW}docker-compose.hub.yml dosyası indiriliyor...${NC}"
    wget https://raw.githubusercontent.com/necdetoskay/kent-konut-sinav-portali/main/docker-compose.hub.yml -O docker-compose.yml || {
        echo -e "${RED}Docker Compose dosyası indirilemedi.${NC}"
        exit 1
    }
fi

echo -e "${GREEN}Docker Compose dosyası hazır.${NC}"

# Sunucu IP adresini al
echo -e "${YELLOW}Sunucu IP adresi ve port ayarlanıyor...${NC}"
read -p "Sunucu IP adresi (varsayılan: localhost): " SERVER_IP
SERVER_IP=${SERVER_IP:-localhost}

read -p "Sunucu portu (varsayılan: 3003): " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-3003}

export PUBLIC_SERVER_URL="http://${SERVER_IP}:${SERVER_PORT}"
echo -e "${GREEN}PUBLIC_SERVER_URL=${PUBLIC_SERVER_URL} olarak ayarlandı.${NC}"

# Docker Compose ile uygulamayı başlat
echo -e "${YELLOW}Uygulama başlatılıyor...${NC}"
docker-compose pull
docker-compose up -d

echo -e "${GREEN}Uygulama başlatıldı.${NC}"
echo -e "${BLUE}Uygulamaya erişim: http://${SERVER_IP}:${SERVER_PORT}${NC}"
echo -e "${BLUE}PgAdmin erişim: http://${SERVER_IP}:8080${NC}"
echo -e "${BLUE}PgAdmin kullanıcı adı: admin@example.com${NC}"
echo -e "${BLUE}PgAdmin şifre: admin${NC}"

echo -e "${YELLOW}Logları kontrol etmek için:${NC} docker-compose logs -f app"
echo -e "${YELLOW}Uygulamayı durdurmak için:${NC} docker-compose down"
echo -e "${YELLOW}Uygulamayı güncellemek için:${NC} docker-compose pull && docker-compose up -d"

echo -e "${GREEN}Kurulum tamamlandı.${NC}"
