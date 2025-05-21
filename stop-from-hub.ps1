# Docker Hub'dan Çekilen Uygulamayı Durdurma Betiği

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
Write-Yellow "====================================================="
Write-Yellow "  Kent Konut Sınav Portalı - Durdurma"
Write-Yellow "====================================================="

# Uygulamayı durdur
Write-Yellow "Uygulama durduruluyor..."
docker-compose -f docker-compose.prod.yml down
Write-Green "Uygulama başarıyla durduruldu!"

# Bilgi mesajı
Write-Cyan "`nUygulama başarıyla durduruldu!"
Write-Cyan "Kalıcı verileriniz 'sinav-portali/persistent-data' dizininde saklanmaktadır."
