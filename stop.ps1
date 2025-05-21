# Kent Konut Sınav Portalı - Durdurma Betiği

# Uygulamayı durdur
Write-Host "Uygulama durduruluyor..." -ForegroundColor Yellow
docker-compose down

Write-Host "`nKent Konut Sınav Portalı başarıyla durduruldu!" -ForegroundColor Cyan
Write-Host "Kalıcı verileriniz 'sinav-portali/persistent-data' dizininde saklanmaktadır." -ForegroundColor Cyan
