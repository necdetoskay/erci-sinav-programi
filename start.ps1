# Kent Konut Sınav Portalı - Başlatma Betiği

# Gerekli dizinleri oluştur
Write-Host "Kalıcı veri dizinleri oluşturuluyor..." -ForegroundColor Green
New-Item -Path "sinav-portali/persistent-data/postgres", "sinav-portali/persistent-data/uploads", "sinav-portali/persistent-data/logs" -ItemType Directory -Force

# Docker Compose ile uygulamayı başlat
Write-Host "Uygulama başlatılıyor..." -ForegroundColor Green
docker-compose up -d

# Konteyner durumlarını göster
Write-Host "Konteyner durumları:" -ForegroundColor Green
docker ps

Write-Host "`nKent Konut Sınav Portalı başarıyla başlatıldı!" -ForegroundColor Cyan
Write-Host "Uygulamaya şu adreslerden erişebilirsiniz:" -ForegroundColor Cyan
Write-Host "- Sınav Portalı: http://localhost:3003" -ForegroundColor Yellow

Write-Host "`nAdmin kullanıcıları bilgileri:" -ForegroundColor Cyan
Write-Host "- Superadmin E-posta: superadmin@kentkonut.com.tr" -ForegroundColor Yellow
Write-Host "- Superadmin Şifre: 0+*stolenchild/-0" -ForegroundColor Yellow
Write-Host "- Superadmin Rolü: SUPERADMIN" -ForegroundColor Yellow
