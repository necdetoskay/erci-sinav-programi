#!/bin/bash
echo "Kentkonut Geliştirme Ortamı Başlatılıyor..."

echo "1. Veritabanı ve pgAdmin başlatılıyor..."
docker-compose -f docker-compose.db.yml up -d

echo "2. Backend API'yi başlatıyorum..."
cd kentwebadminpanel/server && npm run dev & 
cd ../../

echo "3. Frontend uygulamasını başlatıyorum..."
cd kentwebadminpanel && npm run dev &

echo "Tüm servisler başlatıldı!"
echo "- Veritabanı: localhost:5433"
echo "- pgAdmin: http://localhost:5050"
echo "- Backend API: http://localhost:5000"
echo "- Frontend: http://localhost:5173"

echo "Tarayıcınızı http://localhost:5173 adresine yönlendirin" 