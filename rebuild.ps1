# Kent Konut Sınav Portalı - Yeniden Oluşturma Betiği

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

Write-Host "`nKent Konut Sınav Portalı başarıyla yeniden oluşturuldu ve başlatıldı!" -ForegroundColor Cyan
Write-Host "Uygulamaya şu adreslerden erişebilirsiniz:" -ForegroundColor Cyan
Write-Host "- Sınav Portalı: http://localhost:3003" -ForegroundColor Yellow

Write-Host "`nAdmin kullanıcıları bilgileri:" -ForegroundColor Cyan
Write-Host "- Superadmin E-posta: superadmin@kentkonut.com.tr" -ForegroundColor Yellow
Write-Host "- Superadmin Şifre: 0+*stolenchild/-0" -ForegroundColor Yellow
Write-Host "- Superadmin Rolü: SUPERADMIN" -ForegroundColor Yellow
