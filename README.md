# Erci Sınav Programı

Eğitim dokümanlarından otomatik olarak sınav oluşturan, kullanıcıların bu sınavları çözmesini sağlayan ve detaylı istatistikler sunan modern bir web uygulaması.

## 🎯 Proje Hedefleri

- Eğitim dokümanlarından otomatik sınav oluşturma
- Kullanıcı dostu sınav çözme deneyimi
- Detaylı performans analizi ve raporlama
- Kolay yönetilebilir admin paneli

## 📋 Master Plan

### Faz 1: Temel Veritabanı ve Backend Altyapısı

#### Veritabanı Modelleri
- [ ] Document modeli
- [ ] Quiz modeli
- [ ] Question modeli
- [ ] QuizAttempt modeli
- [ ] AnswerLog modeli
- [ ] User model ilişkileri

#### API Rotaları
- [ ] `/api/documents` endpoints
- [ ] `/api/quizzes` endpoints
- [ ] `/api/quizzes/[id]/questions` endpoints
- [ ] `/api/attempts` endpoints

### Faz 2: Admin Paneli

#### Dashboard
- [ ] Doküman yükleme arayüzü
- [ ] Doküman listesi
- [ ] Sınav oluşturma formu
- [ ] Sınav listesi

#### Sınav Yönetimi
- [ ] Sınav düzenleme arayüzü
- [ ] Soru önizleme/düzenleme
- [ ] Sınav yayınlama sistemi
- [ ] Sınav istatistikleri

### Faz 3: LLM Entegrasyonu

#### OpenAI Entegrasyonu
- [ ] API yapılandırması
- [ ] Prompt şablonları
- [ ] Hata yönetimi

#### Soru Üretimi
- [ ] PDF/DOCX metin çıkarma
- [ ] Metin bölümleme sistemi
- [ ] Otomatik soru üretimi
- [ ] Kalite kontrol sistemi

### Faz 4: Kullanıcı Arayüzü

#### Sınav Listesi
- [ ] Aktif sınavlar görünümü
- [ ] Sınav detayları
- [ ] Geçmiş sınavlar

#### Sınav Çözüm Ekranı
- [ ] Tek soru gösterimi
- [ ] Soru zamanlayıcısı
- [ ] İlerleme göstergesi
- [ ] Anlık geri bildirim

#### Sonuç Sayfası
- [ ] Skor analizi
- [ ] Performans detayları
- [ ] Zaman analizi
- [ ] Doğru cevap gösterimi

### Faz 5: Analitik ve Raporlama

#### Admin Raporları
- [ ] Sınav istatistikleri
- [ ] Kullanıcı analizleri
- [ ] Soru zorluğu analizi
- [ ] Zaman bazlı raporlar

#### Kullanıcı Raporları
- [ ] Kişisel performans grafikleri
- [ ] Gelişim takibi
- [ ] Zayıf alan analizi

### Faz 6: Optimizasyon

#### Performans
- [ ] Veritabanı optimizasyonu
- [ ] Önbellekleme
- [ ] API optimizasyonu

#### Kullanıcı Deneyimi
- [ ] Mobil uyumluluk
- [ ] Erişilebilirlik
- [ ] UX iyileştirmeleri

#### Güvenlik
- [ ] Rate limiting
- [ ] Input validasyonu
- [ ] XSS/CSRF koruması

## 🛠️ Teknolojiler

- **Frontend & Backend**: Next.js
- **Veritabanı**: PostgreSQL + Prisma
- **LLM**: OpenAI API
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: JWT tabanlı kimlik doğrulama
- **Deployment**: Docker + Docker Compose

## 🐳 Docker Kurulumu

### Geliştirme Ortamı

Geliştirme ortamında uygulamayı çalıştırmak için:

```bash
# Gerekli dizinleri oluştur ve uygulamayı başlat
./start-development.sh

# veya manuel olarak
mkdir -p persistent-data-dev/postgres persistent-data-dev/pgadmin persistent-data-dev/uploads
docker-compose up -d
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

### Üretim Ortamı

Üretim ortamında uygulamayı çalıştırmak için:

```bash
# Gerekli dizinleri oluştur ve uygulamayı başlat
./start-production.sh

# veya manuel olarak
mkdir -p persistent-data-prod/postgres persistent-data-prod/pgadmin persistent-data-prod/uploads
docker-compose -f docker-compose.production.yml up -d
```

Uygulama http://localhost:3001 adresinde çalışacaktır.

### Docker Hub'dan Çalıştırma

Docker Hub'dan image'ları çekerek uygulamayı çalıştırmak için:

```bash
# Gerekli dizinleri oluştur ve uygulamayı başlat
./start-from-hub.sh

# veya manuel olarak
mkdir -p persistent-data-prod/postgres persistent-data-prod/pgadmin persistent-data-prod/uploads
docker-compose -f docker-compose.hub.yml --env-file .env.hub up -d
```

Uygulama http://localhost:3001 adresinde, pgAdmin ise http://localhost:5050 adresinde çalışacaktır.

> **Not:** Docker Hub'dan çalıştırmak için `.env.hub` dosyası kullanılmaktadır. Bu dosyayı kendi ortamınıza göre düzenleyebilirsiniz.

### Kullanıcı Bilgileri

- **Admin Kullanıcısı**: admin@kentkonut.com.tr
- **Şifre**: Bi41*42*

## 📝 Notlar

- Her faz tamamlandığında checklist güncellenecek
- Yeni özellikler ve iyileştirmeler için öneriler eklenebilir
- Faz sıralaması proje ihtiyaçlarına göre değiştirilebilir
- Docker konteynerlerini durdurmak için `docker-compose down` komutunu kullanabilirsiniz
