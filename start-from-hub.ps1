# Docker Hub'dan İmajı Çekip Çalıştırma Betiği

# Renkli çıktı için fonksiyonlar
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Green($text) {
    Write-ColorOutput Green $text
}

function Write-Yellow($text) {
    Write-ColorOutput Yellow $text
}

function Write-Cyan($text) {
    Write-ColorOutput Cyan $text
}

# Başlık
Write-Green "====================================================="
Write-Green "  Kent Konut Sınav Portalı - Docker Hub Deployment"
Write-Green "====================================================="

# Kalıcı veri dizinleri oluştur
Write-Yellow "Kalıcı veri dizinleri oluşturuluyor..."
New-Item -Path "sinav-portali/persistent-data/postgres", "sinav-portali/persistent-data/uploads", "sinav-portali/persistent-data/logs" -ItemType Directory -Force | Out-Null
Write-Green "Kalıcı veri dizinleri oluşturuldu."

# Mevcut konteynerleri durdur
Write-Yellow "Mevcut konteynerler durduruluyor (varsa)..."
docker-compose down | Out-Null
Write-Green "Mevcut konteynerler durduruldu."

# Docker Hub'dan en son imajları çek
Write-Yellow "Docker Hub'dan en son imajlar çekiliyor..."
docker pull necdetoskay/kentkonut-sinav-portali:latest --no-cache
docker pull postgres:15-alpine --no-cache
Write-Green "İmajlar başarıyla çekildi."

# Docker Compose ile uygulamayı başlat
Write-Yellow "Uygulama başlatılıyor..."
docker-compose -f docker-compose.prod.yml up -d
Write-Green "Uygulama başlatıldı!"

# Konteyner durumlarını göster
Write-Yellow "Konteyner durumları:"
docker ps

# Bilgi mesajı
Write-Cyan "`nUygulama başarıyla başlatıldı!"
Write-Cyan "Uygulamaya şu adresten erişebilirsiniz: http://localhost:3003"
Write-Cyan "Superadmin kullanıcı bilgileri:"
Write-Cyan "  E-posta: superadmin@kentkonut.com.tr"
Write-Cyan "  Şifre: 0+*stolenchild/-0"
