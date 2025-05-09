# Erci Sınav Programı - Güvenli Deployment Kılavuzu

Bu belge, Erci Sınav Programı uygulamasının production ortamına güvenli bir şekilde deploy edilmesi için gereken adımları içerir.

## Ön Gereksinimler

- Docker ve Docker Compose
- SSL sertifikaları (Let's Encrypt veya benzer bir servis)
- Domain adı
- Yeterli RAM ve CPU'ya sahip bir sunucu (minimum 2GB RAM önerilir)

## Güvenli Deployment Adımları

### 1. Ortam Değişkenlerini Ayarlama

`.env.production` dosyasını gerçek değerlerle güncelleyin:

```bash
# Güçlü bir NEXTAUTH_SECRET oluşturun
openssl rand -base64 32

# Güçlü bir ENCRYPTION_KEY oluşturun (32 karakter)
openssl rand -hex 16
```

`.env.production` dosyasını aşağıdaki gibi düzenleyin:

```
# Database connection string
DATABASE_URL="postgresql://username:secure-password@db:5432/kentkonutdb"

# JWT secrets
JWT_SECRET="<openssl ile oluşturulan değer>"
REFRESH_TOKEN_SECRET="<openssl ile oluşturulan değer>"

# Token süreleri
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Uygulama URL'i
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Şifreleme anahtarı
ENCRYPTION_KEY="<openssl ile oluşturulan değer>"

# Node environment
NODE_ENV=production

# PostgreSQL
POSTGRES_USER=username
POSTGRES_PASSWORD=secure-password
POSTGRES_DB=kentkonutdb
```

### 2. SSL Sertifikalarını Ayarlama

Eğer SSL kullanmak istiyorsanız, bir reverse proxy (örneğin Caddy veya Traefik) kullanabilirsiniz. Bu kılavuzda doğrudan Next.js uygulamasını kullanacağız.

### 3. Uygulama Yapılandırmasını Güncelleme

`docker-compose.production.yml` dosyasında `NEXT_PUBLIC_APP_URL` değerini kendi domain adınızla değiştirin.

### 4. Docker Compose ile Deployment

```bash
# Uygulamayı build edin ve başlatın
docker-compose -f docker-compose.production.yml up -d

# Logları kontrol edin
docker-compose -f docker-compose.production.yml logs -f
```

### 5. Veritabanı Migrasyonlarını Çalıştırma

```bash
# Container içinde Prisma migrasyonlarını çalıştırın
docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy
```

### 6. Güvenlik Kontrolleri

Deployment sonrası aşağıdaki güvenlik kontrollerini yapın:

- SSL Labs testi: https://www.ssllabs.com/ssltest/
- Security Headers testi: https://securityheaders.com/
- CORS yapılandırması kontrolü
- Rate limiting kontrolü
- Firewall yapılandırması

### 7. Yedekleme Stratejisi

Düzenli veritabanı yedeklemeleri için bir cron job oluşturun:

```bash
# /etc/cron.d/database-backup
0 2 * * * root docker-compose -f /path/to/docker-compose.production.yml exec -T db pg_dump -U username kentkonutdb > /path/to/backups/kentkonutdb_$(date +\%Y\%m\%d).sql
```

### 8. Monitoring ve Logging

Prometheus ve Grafana gibi araçlarla monitoring yapılandırması yapın.

## Güvenlik En İyi Uygulamaları

1. **Hassas Bilgilerin Yönetimi**
   - Tüm hassas bilgileri (API anahtarları, şifreler) environment variable olarak saklayın
   - Production ortamında `.env` dosyalarını `.gitignore` ile hariç tutun
   - Şifreleme anahtarlarını düzenli olarak değiştirin

2. **Veritabanı Güvenliği**
   - Güçlü ve benzersiz şifreler kullanın
   - Veritabanına dış erişimi kısıtlayın
   - Düzenli yedeklemeler yapın

3. **API Güvenliği**
   - Rate limiting uygulayın
   - CORS politikalarını sıkı tutun
   - JWT token'ları için kısa ömür belirleyin

4. **Docker Güvenliği**
   - Container'ları root olmayan kullanıcılarla çalıştırın
   - Sadece gerekli portları açın
   - Resource limitleri belirleyin

5. **Düzenli Güncellemeler**
   - Güvenlik yamalarını düzenli olarak uygulayın
   - Bağımlılıkları güncel tutun
   - Güvenlik açıklarını düzenli olarak tarayın

## Sorun Giderme

- **Veritabanı Bağlantı Hataları**: DATABASE_URL'in doğru olduğundan emin olun
- **SSL Hataları**: Sertifika dosyalarının doğru konumda olduğunu kontrol edin
- **API Hataları**: Logları kontrol edin ve rate limiting ayarlarını gözden geçirin

## İletişim

Sorunlar veya sorular için: [iletişim-email@example.com]
