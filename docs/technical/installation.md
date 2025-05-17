# Kurulum Kılavuzu

Bu kılavuz, Kent Konut Sınav Portalı'nın kurulumu ve yapılandırılması için adım adım talimatlar sağlar.

## İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Kurulum Adımları](#kurulum-adımları)
3. [Docker ile Kurulum](#docker-ile-kurulum)
4. [Manuel Kurulum](#manuel-kurulum)
5. [Veritabanı Kurulumu](#veritabanı-kurulumu)
6. [Çevre Değişkenleri](#çevre-değişkenleri)
7. [Superadmin Oluşturma](#superadmin-oluşturma)
8. [E-posta Yapılandırması](#e-posta-yapılandırması)
9. [Güvenlik Ayarları](#güvenlik-ayarları)
10. [Sorun Giderme](#sorun-giderme)

## Gereksinimler

### Donanım Gereksinimleri

- **CPU**: En az 2 çekirdek
- **RAM**: En az 4 GB
- **Disk**: En az 20 GB boş alan

### Yazılım Gereksinimleri

- **İşletim Sistemi**: Linux (Ubuntu 20.04+), Windows Server 2019+, macOS 11+
- **Node.js**: v16.x veya üzeri
- **PostgreSQL**: v13.x veya üzeri
- **Docker** (isteğe bağlı): v20.x veya üzeri
- **Docker Compose** (isteğe bağlı): v2.x veya üzeri

## Kurulum Adımları

Kent Konut Sınav Portalı'nı iki farklı yöntemle kurabilirsiniz:

1. **Docker ile Kurulum**: Önerilen yöntem, tüm bileşenleri Docker konteynerleri olarak çalıştırır
2. **Manuel Kurulum**: Tüm bileşenleri manuel olarak kurar ve yapılandırır

## Docker ile Kurulum

### 1. Depoyu Klonlama

```bash
git clone https://github.com/kentkonut/sinav-portali.git
cd sinav-portali
```

### 2. Çevre Değişkenlerini Yapılandırma

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değişkenleri düzenleyin:

```bash
cp .env.example .env
nano .env
```

Aşağıdaki değişkenleri düzenlediğinizden emin olun:

- `DATABASE_URL`: PostgreSQL bağlantı URL'si
- `JWT_SECRET`: JWT token'ları için gizli anahtar
- `SMTP_HOST`: E-posta sunucusu adresi
- `SMTP_PORT`: E-posta sunucusu portu
- `EMAIL_FROM`: Gönderen e-posta adresi
- `PUBLIC_SERVER_URL`: Sunucunun dışarıdan erişilebilir URL'si

### 3. Docker Compose ile Çalıştırma

```bash
docker-compose up -d
```

Bu komut, aşağıdaki konteynerleri başlatacaktır:

- **app**: Next.js uygulaması
- **db**: PostgreSQL veritabanı
- **pgadmin** (isteğe bağlı): PostgreSQL yönetim arayüzü

### 4. Veritabanı Migrasyonlarını Çalıştırma

```bash
docker-compose exec app npx prisma migrate deploy
```

### 5. Superadmin Kullanıcısı Oluşturma

```bash
docker-compose exec app node scripts/create-superadmin.js
```

### 6. Uygulamaya Erişim

Kurulum tamamlandıktan sonra, uygulamaya aşağıdaki URL'den erişebilirsiniz:

```
http://localhost:3001
```

## Manuel Kurulum

### 1. Node.js ve npm Kurulumu

#### Ubuntu/Debian

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Windows

Node.js web sitesinden indirin ve kurun: https://nodejs.org/

### 2. PostgreSQL Kurulumu

#### Ubuntu/Debian

```bash
sudo apt-get install postgresql postgresql-contrib
```

#### Windows

PostgreSQL web sitesinden indirin ve kurun: https://www.postgresql.org/download/windows/

### 3. Veritabanı Oluşturma

```bash
sudo -u postgres psql
CREATE DATABASE sinav_portali;
CREATE USER sinav_admin WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sinav_portali TO sinav_admin;
\q
```

### 4. Depoyu Klonlama

```bash
git clone https://github.com/kentkonut/sinav-portali.git
cd sinav-portali
```

### 5. Bağımlılıkları Yükleme

```bash
npm install
```

### 6. Çevre Değişkenlerini Yapılandırma

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değişkenleri düzenleyin:

```bash
cp .env.example .env
nano .env
```

### 7. Veritabanı Migrasyonlarını Çalıştırma

```bash
npx prisma migrate deploy
```

### 8. Superadmin Kullanıcısı Oluşturma

```bash
node scripts/create-superadmin.js
```

### 9. Uygulamayı Başlatma

Geliştirme modunda:

```bash
npm run dev
```

Üretim modunda:

```bash
npm run build
npm start
```

### 10. Uygulamaya Erişim

Kurulum tamamlandıktan sonra, uygulamaya aşağıdaki URL'den erişebilirsiniz:

```
http://localhost:3001
```

## Veritabanı Kurulumu

Veritabanı şeması, Prisma ORM kullanılarak yönetilir. Şema, `prisma/schema.prisma` dosyasında tanımlanmıştır.

### Veritabanı Migrasyonları

Veritabanı şemasını güncellemek için:

```bash
# Şema değişikliklerini uygulamak için
npx prisma migrate dev --name <migration_name>

# Üretim ortamında migrasyonları uygulamak için
npx prisma migrate deploy
```

### Veritabanı Seed

Örnek verilerle veritabanını doldurmak için:

```bash
npx prisma db seed
```

## Çevre Değişkenleri

Aşağıda, uygulamanın çalışması için gerekli çevre değişkenlerinin bir listesi bulunmaktadır:

### Temel Ayarlar

- `NODE_ENV`: Uygulama ortamı (development, production)
- `PORT`: Uygulamanın çalışacağı port (varsayılan: 3001)
- `PUBLIC_SERVER_URL`: Sunucunun dışarıdan erişilebilir URL'si

### Veritabanı Ayarları

- `DATABASE_URL`: PostgreSQL bağlantı URL'si

### JWT Ayarları

- `JWT_SECRET`: JWT token'ları için gizli anahtar
- `JWT_EXPIRES_IN`: JWT token'larının geçerlilik süresi (varsayılan: "1d")

### E-posta Ayarları

- `SMTP_HOST`: E-posta sunucusu adresi
- `SMTP_PORT`: E-posta sunucusu portu
- `SMTP_SECURE`: SSL/TLS kullanımı (true/false)
- `SMTP_AUTH_ENABLED`: SMTP kimlik doğrulama (true/false)
- `SMTP_USER`: SMTP kullanıcı adı
- `SMTP_PASS`: SMTP şifresi
- `EMAIL_FROM`: Gönderen e-posta adresi

### OpenRouter API Ayarları

- `OPENROUTER_API_KEY`: OpenRouter API anahtarı
- `OPENROUTER_API_URL`: OpenRouter API URL'si

## Superadmin Oluşturma

Sistem, ilk kurulumda otomatik olarak bir superadmin kullanıcısı oluşturur. Bu kullanıcı, `scripts/create-superadmin.js` script'i tarafından oluşturulur.

### Varsayılan Superadmin Bilgileri

- **E-posta**: superadmin@kentkonut.com.tr
- **Şifre**: 0+*stolenchild/-0
- **Rol**: SUPERADMIN

Güvenlik nedeniyle, ilk girişten sonra bu şifreyi değiştirmeniz önerilir.

### Manuel Superadmin Oluşturma

Eğer varsayılan superadmin hesabı oluşturulmadıysa veya yeni bir superadmin hesabı oluşturmak istiyorsanız:

```bash
node scripts/create-superadmin.js
```

## E-posta Yapılandırması

Sistem, aşağıdaki işlevler için e-posta gönderir:

- Hesap onayı
- Şifre sıfırlama
- Sınav davetiyeleri

### SMTP Yapılandırması

E-posta göndermek için, SMTP sunucusu bilgilerini `.env` dosyasında yapılandırmanız gerekir:

```
SMTP_HOST=172.41.41.14
SMTP_PORT=25
SMTP_SECURE=false
SMTP_AUTH_ENABLED=false
EMAIL_FROM=noskay@kentkonut.com.tr
```

### E-posta Şablonları

E-posta şablonları, `lib/email.ts` dosyasında tanımlanmıştır. Şablonları özelleştirmek için bu dosyayı düzenleyebilirsiniz.

## Güvenlik Ayarları

### HTTPS Yapılandırması

Üretim ortamında, uygulamayı HTTPS üzerinden sunmanız önerilir. Bunun için, bir SSL sertifikası edinmeniz ve web sunucunuzu (Nginx, Apache vb.) yapılandırmanız gerekir.

### Güvenlik Duvarı Yapılandırması

Aşağıdaki portların açık olduğundan emin olun:

- **HTTP**: 80 (yönlendirme için)
- **HTTPS**: 443
- **Uygulama Portu**: 3001 (varsayılan)
- **PostgreSQL**: 5432 (sadece yerel ağda)

## Sorun Giderme

### Veritabanı Bağlantı Sorunları

Veritabanı bağlantı sorunlarını çözmek için:

1. PostgreSQL servisinin çalıştığından emin olun
2. `.env` dosyasındaki `DATABASE_URL` değişkeninin doğru olduğunu kontrol edin
3. Veritabanı kullanıcısının gerekli izinlere sahip olduğunu kontrol edin

### E-posta Gönderme Sorunları

E-posta gönderme sorunlarını çözmek için:

1. SMTP sunucusunun erişilebilir olduğunu kontrol edin
2. `.env` dosyasındaki SMTP ayarlarının doğru olduğunu kontrol edin
3. Uygulama loglarını kontrol edin

### Uygulama Başlatma Sorunları

Uygulama başlatma sorunlarını çözmek için:

1. Node.js sürümünün uyumlu olduğunu kontrol edin
2. Tüm bağımlılıkların yüklendiğinden emin olun
3. `.env` dosyasının doğru yapılandırıldığından emin olun
4. Uygulama loglarını kontrol edin
