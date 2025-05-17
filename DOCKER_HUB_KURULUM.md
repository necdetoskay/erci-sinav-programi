# Kent Konut Sınav Portalı - Docker Hub Kurulum Talimatları

Bu belge, Kent Konut Sınav Portalı'nı Docker Hub'dan çekip çalıştırmak için gerekli adımları içerir.

## Gereksinimler

- Docker ve Docker Compose yüklü olmalıdır
- İnternet bağlantısı (Docker Hub'dan imajları çekmek için)
- En az 2GB RAM ve 10GB disk alanı

## Kurulum Adımları

1. Öncelikle gerekli dizinleri oluşturun:

```bash
mkdir -p persistent-data/postgres persistent-data/pgadmin persistent-data/uploads logs
```

2. `docker-compose.hub.yml` dosyasını indirin:

```bash
wget https://raw.githubusercontent.com/necdetoskay/kent-konut-sinav-portali/main/docker-compose.hub.yml -O docker-compose.yml
```

3. Sunucu IP adresini ayarlayın:

```bash
# Sunucu IP adresini ve portunu ayarlayın (örnek: 172.41.42.51:3003)
export PUBLIC_SERVER_URL=http://SUNUCU_IP_ADRESI:3003
```

4. Docker Compose ile uygulamayı başlatın:

```bash
docker-compose up -d
```

5. Uygulamanın başlamasını bekleyin ve logları kontrol edin:

```bash
docker-compose logs -f app
```

## Erişim Bilgileri

- **Uygulama:** http://SUNUCU_IP_ADRESI:3003
- **PgAdmin:** http://SUNUCU_IP_ADRESI:8080
  - Kullanıcı adı: admin@example.com
  - Şifre: admin

## Varsayılan Kullanıcılar

Uygulama ilk çalıştırıldığında aşağıdaki kullanıcılar otomatik olarak oluşturulur:

1. **Admin Kullanıcısı**
   - E-posta: noskay@kentkonut.com.tr
   - Şifre: 0renegade*

2. **Superadmin Kullanıcısı**
   - E-posta: superadmin
   - Şifre: 0+*stolenchild/-0

## Sorun Giderme

1. **Uygulama başlatılamıyor:**
   ```bash
   docker-compose logs app
   ```
   komutunu çalıştırarak hata mesajlarını kontrol edin.

2. **Veritabanı bağlantı hatası:**
   ```bash
   docker-compose logs db
   ```
   komutunu çalıştırarak veritabanı loglarını kontrol edin.

3. **E-posta gönderimi çalışmıyor:**
   Sunucu IP adresinin doğru ayarlandığından emin olun. E-posta ayarlarını admin panelinden kontrol edin.

## Güncelleme

Yeni bir sürüm yayınlandığında, aşağıdaki adımları izleyerek uygulamayı güncelleyebilirsiniz:

```bash
# En son imajı çek
docker pull necdetoskay/kent-konut-sinav-portali:latest

# Uygulamayı yeniden başlat
docker-compose down
docker-compose up -d
```

## Yedekleme

Veritabanını yedeklemek için:

```bash
docker exec kent-konut-db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql
```

## Geri Yükleme

Veritabanını geri yüklemek için:

```bash
cat backup_YYYYMMDD.sql | docker exec -i kent-konut-db psql -U postgres postgres
```
