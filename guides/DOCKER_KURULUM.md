# Kent Konut Sınav Portalı - Docker Kurulum

Bu belge, Kent Konut Sınav Portalı'nın Docker kullanarak nasıl kurulacağını ve çalıştırılacağını açıklar.

## Gereksinimler

- [Docker](https://www.docker.com/products/docker-desktop/) (en son sürüm)
- [Docker Compose](https://docs.docker.com/compose/install/) (en son sürüm)
- PowerShell (Windows) veya Terminal (macOS/Linux)

## Kurulum ve Çalıştırma

### 1. Uygulamayı Başlatma

Uygulamayı başlatmak için aşağıdaki komutu çalıştırın:

```powershell
.\start.ps1
```

Bu komut:
- Gerekli dizinleri oluşturur
- Docker Compose ile uygulamayı başlatır
- Konteyner durumlarını gösterir
- Erişim bilgilerini gösterir

### 2. Uygulamayı Durdurma

Uygulamayı durdurmak için aşağıdaki komutu çalıştırın:

```powershell
.\stop.ps1
```

### 3. Uygulamayı Yeniden Oluşturma

Uygulama kodunda değişiklik yaptıysanız ve bu değişiklikleri Docker imajına yansıtmak istiyorsanız, aşağıdaki komutu çalıştırın:

```powershell
.\rebuild.ps1
```

Bu komut:
- Uygulamayı durdurur
- Docker imajını yeniden oluşturur
- Uygulamayı başlatır
- Konteyner durumlarını gösterir
- Erişim bilgilerini gösterir

## Erişim Bilgileri

Uygulama başlatıldıktan sonra aşağıdaki adresten erişebilirsiniz:

- **Sınav Portalı**: http://localhost:3003

### Admin Kullanıcı Bilgileri

- **Superadmin E-posta**: superadmin@kentkonut.com.tr
- **Superadmin Şifre**: 0+*stolenchild/-0
- **Superadmin Rolü**: SUPERADMIN

## Kalıcı Veriler

Tüm kalıcı veriler `sinav-portali/persistent-data` dizininde saklanır:

- **Veritabanı**: `sinav-portali/persistent-data/postgres`
- **Yüklemeler**: `sinav-portali/persistent-data/uploads`
- **Loglar**: `sinav-portali/persistent-data/logs`

## Sorun Giderme

### Veritabanı Bağlantı Hatası

Eğer uygulama veritabanına bağlanamıyorsa:

1. Veritabanı konteynerinin çalıştığından emin olun:
   ```powershell
   docker ps
   ```

2. Veritabanı loglarını kontrol edin:
   ```powershell
   docker logs kent-konut-postgres
   ```

### Uygulama Hatası

Eğer uygulama çalışmıyorsa:

1. Uygulama loglarını kontrol edin:
   ```powershell
   docker logs kent-konut-sinav-portali
   ```

2. Uygulamayı yeniden başlatın:
   ```powershell
   docker-compose restart app
   ```

### Tüm Verileri Sıfırlama

Eğer tüm verileri sıfırlamak istiyorsanız:

1. Uygulamayı durdurun:
   ```powershell
   .\stop.ps1
   ```

2. Kalıcı veri dizinini silin:
   ```powershell
   Remove-Item -Path "sinav-portali" -Recurse -Force
   ```

3. Uygulamayı yeniden başlatın:
   ```powershell
   .\start.ps1
   ```
