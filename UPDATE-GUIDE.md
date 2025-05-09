# Erci Sınav Programı - Güncelleme ve Veri Koruma Kılavuzu

Bu belge, Erci Sınav Programı uygulamasının nasıl güvenli bir şekilde güncellenebileceğini ve verilerin nasıl korunacağını açıklar.

## Veri Dizinleri

Uygulama, aşağıdaki veri dizinlerini kullanır:

- **PostgreSQL Veritabanı**: Tüm veritabanı verileri
- **pgAdmin Yapılandırması**: pgAdmin ayarları ve bağlantıları
- **Uygulama Yüklemeleri**: Kullanıcılar tarafından yüklenen dosyalar

Bu veriler, Docker volume'ları aracılığıyla host makinede kalıcı olarak saklanır. Varsayılan olarak:

- Geliştirme ortamı: `./persistent-data-dev/` dizini
- Production ortamı: `/var/lib/erci-sinav-data/` dizini

## İlk Kurulum

İlk kurulum için, veri dizinlerini oluşturmak üzere sağlanan script'i çalıştırın:

```bash
# Geliştirme ortamı için
chmod +x setup-data-dirs.sh
./setup-data-dirs.sh

# Production ortamı için
chmod +x setup-data-dirs.sh
./setup-data-dirs.sh production
```

## Uygulama Güncelleme Adımları

Uygulamayı güncellerken verilerin korunması için aşağıdaki adımları izleyin:

### 1. Yedekleme

Öncelikle mevcut verileri yedekleyin:

```bash
# Veritabanı yedeği
docker-compose exec db pg_dump -U postgres -d kentkonutdb > backup_$(date +%Y%m%d).sql

# Veri dizinlerini yedekle
# Geliştirme ortamı için
cp -r ./persistent-data-dev ./persistent-data-dev-backup-$(date +%Y%m%d)

# Production ortamı için
sudo cp -r /var/lib/erci-sinav-data /var/lib/erci-sinav-data-backup-$(date +%Y%m%d)
```

### 2. Uygulamayı Durdurma

```bash
# Geliştirme ortamı için
docker-compose down

# Production ortamı için
docker-compose -f docker-compose.production.yml down
```

### 3. Kodları Güncelleme

```bash
# Güncellemeleri çek
git pull

# Veya belirli bir sürüme geç
git checkout v1.x.x
```

### 4. Uygulamayı Yeniden Başlatma

```bash
# Geliştirme ortamı için
docker-compose up -d

# Production ortamı için
docker-compose -f docker-compose.production.yml up -d
```

### 5. Veritabanı Migrasyonlarını Çalıştırma

```bash
# Geliştirme ortamı için
docker-compose exec app npx prisma migrate deploy

# Production ortamı için
docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy
```

## Veri Koruma Stratejileri

### Düzenli Yedekleme

Veritabanını düzenli olarak yedeklemek için bir cron job oluşturun:

```bash
# /etc/cron.d/erci-sinav-backup
0 2 * * * root docker-compose -f /path/to/docker-compose.production.yml exec -T db pg_dump -U postgres -d kentkonutdb > /path/to/backups/kentkonutdb_$(date +\%Y\%m\%d).sql
```

### Yedekleri Dış Depolama Alanına Taşıma

Yedekleri güvenli bir dış depolama alanına (örn. NAS, bulut depolama) taşımak için bir script oluşturun:

```bash
#!/bin/bash
# /usr/local/bin/backup-transfer.sh

BACKUP_DIR="/path/to/backups"
REMOTE_DIR="/mnt/remote-storage/erci-sinav-backups"

# Son yedeği dış depolama alanına kopyala
LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.sql | head -1)
cp $LATEST_BACKUP $REMOTE_DIR/

# 30 günden eski yedekleri temizle
find $BACKUP_DIR -name "*.sql" -type f -mtime +30 -delete
```

## Sorun Giderme

### Veri Dizinleri Erişim Sorunları

Veri dizinlerine erişim sorunları yaşıyorsanız, izinleri kontrol edin:

```bash
# Geliştirme ortamı için
chmod -R 777 ./persistent-data-dev

# Production ortamı için
sudo chmod -R 777 /var/lib/erci-sinav-data
```

### Veritabanı Bağlantı Hataları

Veritabanı bağlantı hataları alıyorsanız:

1. Docker container'larının çalıştığını kontrol edin:
   ```bash
   docker-compose ps
   ```

2. Veritabanı loglarını kontrol edin:
   ```bash
   docker-compose logs db
   ```

3. Veritabanı volume'unun doğru şekilde bağlandığını kontrol edin:
   ```bash
   docker-compose exec db ls -la /var/lib/postgresql/data
   ```

## Önemli Notlar

- **Asla** veri dizinlerini manuel olarak silmeyin
- Uygulama güncellemelerinden önce her zaman yedek alın
- Önemli değişikliklerden sonra veritabanı ve uygulama verilerinin bütünlüğünü kontrol edin
- Production ortamında değişiklik yapmadan önce geliştirme ortamında test edin
