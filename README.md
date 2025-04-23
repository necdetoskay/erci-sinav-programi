# Kent Konut Platform

Bu proje, Kent Konut için geliştirilmiş web platformudur. İki ana bileşenden oluşur:

1. Kent Konut Web (Ana Site)
2. Kent Konut Admin Panel

## Teknolojiler

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express
- Veritabanı: PostgreSQL
- Konteynerizasyon: Docker

## Kurulum

### Docker ile Tam Kurulum

Projeyi tamamen Docker üzerinde çalıştırmak için Docker ve Docker Compose gereklidir.

```bash
# Projeyi klonlayın
git clone https://github.com/your-username/kentkonut-platform.git
cd kentkonut-platform

# Docker container'larını başlatın
docker-compose up -d
```

### Yerel Geliştirme Kurulumu

Sadece veritabanını Docker'da çalıştırıp, frontend ve backend'i yerel olarak çalıştırabilirsiniz. Bu yaklaşım, geliştirme sırasında kod değişikliklerinin anında uygulanmasını sağlar.

#### Windows

```bash
# Sadece veritabanını çalıştırın
run-local.bat
```

#### Linux/Mac

```bash
# Çalıştırma iznini ayarlayın
chmod +x run-local.sh

# Sadece veritabanını çalıştırın
./run-local.sh
```

Veya manuel olarak:

```bash
# Sadece veritabanı servislerini başlatın
docker-compose -f docker-compose.db.yml up -d

# Backend API'yi başlatın (ayrı bir terminalde)
cd kentwebadminpanel/server
npm install
npm run dev

# Frontend uygulamasını başlatın (ayrı bir terminalde)
cd kentwebadminpanel
npm install
npm run dev
```

## Servisler

Proje aşağıdaki servisleri içerir:

1. Ana Site: http://localhost:3000
2. Admin Panel: http://localhost:5173 (yerel geliştirme) veya http://localhost:8080 (Docker)
3. Admin API: http://localhost:5000
4. PostgreSQL: localhost:5433
5. pgAdmin: http://localhost:5050
   - Email: admin@kentwebadmin.com
   - Şifre: admin

## Geliştirme

Her iki proje de (web ve admin panel) kendi klasörlerinde bağımsız olarak geliştirilebilir:

```bash
# Ana site için
cd kentkonut-web
npm install
npm run dev

# Admin panel için
cd kentwebadminpanel
npm install
npm run dev
```

## Lisans

Bu proje özel lisans altında geliştirilmiştir. Tüm hakları saklıdır. 