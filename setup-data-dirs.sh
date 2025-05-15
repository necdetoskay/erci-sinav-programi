#!/bin/bash
# Bu script, gerekli veri dizinlerini oluşturur.

# Renkli konsol çıktısı için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Ortam parametresini kontrol et
ENVIRONMENT="dev"
if [ "$1" == "production" ]; then
    ENVIRONMENT="prod"
fi

echo "${BOLD}${CYAN}Erci Sınav Programı - Veri Dizinleri Kurulumu (${ENVIRONMENT})${NC}"

# Geliştirme ortamı için
if [ "$ENVIRONMENT" == "dev" ]; then
    echo "${YELLOW}Geliştirme ortamı için veri dizinleri oluşturuluyor...${NC}"
    mkdir -p persistent-data-dev/postgres persistent-data-dev/pgadmin persistent-data-dev/uploads
    mkdir -p logs
    echo "${GREEN}Geliştirme ortamı için veri dizinleri oluşturuldu.${NC}"
# Üretim ortamı için
else
    echo "${YELLOW}Üretim ortamı için veri dizinleri oluşturuluyor...${NC}"
    mkdir -p persistent-data-prod/postgres persistent-data-prod/pgadmin persistent-data-prod/uploads
    mkdir -p logs
    echo "${GREEN}Üretim ortamı için veri dizinleri oluşturuldu.${NC}"
fi

echo "${BOLD}${GREEN}Veri dizinleri kurulumu tamamlandı!${NC}"
