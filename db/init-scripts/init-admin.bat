@echo off
:: Bu script, veritabanı migrasyonlarını çalıştırır ve admin kullanıcısını oluşturur/günceller

:: Renkli konsol çıktısı için
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "MAGENTA=[95m"
set "CYAN=[96m"
set "BOLD=[1m"
set "NC=[0m"

echo %BOLD%%CYAN%Veritabanı hazırlık işlemleri başlatılıyor...%NC%

:: Veritabanının hazır olmasını bekle
echo %YELLOW%Veritabanının hazır olması bekleniyor...%NC%
npx wait-on tcp:db:5432 -t 60000

:: Prisma migrasyonlarını çalıştır
echo %YELLOW%Veritabanı migrasyonları çalıştırılıyor...%NC%
npx prisma migrate deploy

:: Admin kullanıcısını oluştur/güncelle
echo %YELLOW%Admin kullanıcısı oluşturuluyor/güncelleniyor...%NC%
node /app/db/init-scripts/create-admin-user.js

echo %BOLD%%GREEN%Veritabanı hazırlık işlemleri tamamlandı.%NC%

:: Uygulamayı başlat
echo %BOLD%%CYAN%Uygulama başlatılıyor...%NC%
%*
