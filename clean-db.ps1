# Kent Konut Sınav Portalı - Veritabanı Temizleme Betiği

# Uygulamayı durdur
Write-Host "Uygulama durduruluyor..." -ForegroundColor Yellow
docker-compose down

# Veritabanı verilerini temizle
Write-Host "Veritabanı verilerini temizleniyor..." -ForegroundColor Red
Remove-Item -Path "sinav-portali/persistent-data/postgres" -Recurse -Force -ErrorAction SilentlyContinue

# Gerekli dizinleri oluştur
Write-Host "Kalıcı veri dizinleri oluşturuluyor..." -ForegroundColor Green
New-Item -Path "sinav-portali/persistent-data/postgres" -ItemType Directory -Force

Write-Host "`nVeritabanı başarıyla temizlendi!" -ForegroundColor Cyan
Write-Host "Şimdi uygulamayı yeniden başlatmak için 'start.ps1' betiğini çalıştırabilirsiniz." -ForegroundColor Cyan
