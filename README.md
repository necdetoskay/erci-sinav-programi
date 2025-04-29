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
- **Auth**: NextAuth.js

## 📝 Notlar

- Her faz tamamlandığında checklist güncellenecek
- Yeni özellikler ve iyileştirmeler için öneriler eklenebilir
- Faz sıralaması proje ihtiyaçlarına göre değiştirilebilir
