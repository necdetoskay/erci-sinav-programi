# Sınav Sistemi Uygulama Planı

## 1. Veri Modeli (PostgreSQL) 

```sql
-- Sınavlar tablosu
CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft' veya 'published'
  duration_minutes INTEGER DEFAULT 60, -- Sınav süresi (dk)
  access_code VARCHAR(20) -- Personel girişi için opsiyonel kod
);

-- Sorular tablosu
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Seçenekler JSON dizisi olarak
  correct_answer VARCHAR(10) NOT NULL, -- 'A', 'B', 'C', 'D' gibi
  explanation TEXT,
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  position INTEGER -- Soru sırası
);

-- Sınav sonuçları
CREATE TABLE exam_results (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL,
  participant_email VARCHAR(255),
  score INTEGER,
  total_questions INTEGER,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  answers JSONB, -- Verilen cevaplar JSON olarak
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Admin Panel Arayüzleri

### 2.1. Admin Sınav Listesi 
```
+--------------------------------------------------------------+
|                                                              |
|  SINAVLAR                                   [Yeni Sınav +]   |
|                                                              |
|  +----------------------------------------------------------+|
|  |                                                          ||
|  |  Sınav Adı              Durum      Katılım    İşlem      ||
|  |  --------------------- ---------- ---------- ------------ ||
|  |                                                          ||
|  |  Matematik Testi       Yayında     12/50     [...▼]      ||
|  |  Türkçe Sınavı         Taslak      0/0       [...▼]      ||
|  |  Fen Bilgisi Final     Yayında     48/50     [...▼]      ||
|  |                                                          ||
|  |                                                          ||
|  |                     Sayfa: < 1 2 3 >                     ||
|  +----------------------------------------------------------+|
|                                                              |
|  İşlemler: Düzenle, Görüntüle, Sonuçlar, Sil, Paylaş        |
|                                                              |
+--------------------------------------------------------------+
```

### 2.2. Yeni Sınav Oluşturma - Adım 1: Sınav Bilgileri (Admin)
```
+--------------------------------------------------------------+
|                                                              |
|  YENİ SINAV OLUŞTUR                                         |
|                                                              |
|  +----------------------------------------------------------+|
|  |                                                          ||
|  |  Sınav Adı*                                              ||
|  |  +------------------------------------------------------+||
|  |  |                                                      |||
|  |  +------------------------------------------------------+||
|  |                                                          ||
|  |  Açıklama                                                ||
|  |  +------------------------------------------------------+||
|  |  |                                                      |||
|  |  |                                                      |||
|  |  +------------------------------------------------------+||
|  |                                                          ||
|  |  Sınav Süresi: [60 dk ▼]                                 ||
|  |                                                          ||
|  |  Erişim Kodu: [    ] (Boş bırakılırsa otomatik oluşturulur)||
|  |                                                          ||
|  |                                    [İptal] [Devam Et >]  ||
|  +----------------------------------------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

### 2.3. Soru Kaynağı Seçme - Adım 2
```
+--------------------------------------------------------------+
|                                                              |
|  SORU KAYNAĞI SEÇİMİ                                         |
|                                                              |
|  +----------------------------------------------------------+|
|  |  Soruları nasıl oluşturmak istersiniz?                   ||
|  |                                                          ||
|  |  [ ] Dosya Yükle (PDF, DOC, TXT)                         ||
|  |      +------------------------------------------------+  ||
|  |      | Dosya seçin veya sürükleyip bırakın           |  ||
|  |      +------------------------------------------------+  ||
|  |                                                          ||
|  |  [ ] Metin Giriş                                         ||
|  |      +------------------------------------------------+  ||
|  |      |                                                |  ||
|  |      |                                                |  ||
|  |      +------------------------------------------------+  ||
|  |                                                          ||
|  |  [ ] LLM ile Konu Başlığından Oluştur                    ||
|  |      +------------------------------------------------+  ||
|  |      | Konu başlığı girin                             |  ||
|  |      +------------------------------------------------+  ||
|  |                                                          ||
|  |      Model: [Gemini 2.0 ▼]                               ||
|  |      Soru Sayısı: [10 ▼]                                 ||
|  |      Zorluk: [Orta ▼]                                    ||
|  |                                                          ||
|  |                         [< Geri] [Soruları Oluştur >]    ||
|  +----------------------------------------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

### 2.4. Soruları Onaylama - Adım 3
```
+--------------------------------------------------------------+
|                                                              |
|  SORULARI ONAYLA                                             |
|                                                              |
|  +----------------------------------------------------------+|
|  |                                                          ||
|  |  [✓] Soru 1:                                             ||
|  |      Türkiye'nin başkenti hangi şehirdir?                ||
|  |                                                          ||
|  |      A) İstanbul                                         ||
|  |      B) Ankara  ✓                                        ||
|  |      C) İzmir                                            ||
|  |      D) Bursa                                            ||
|  |                                                          ||
|  |      Açıklama: Türkiye Cumhuriyeti'nin başkenti 13 Ekim  ||
|  |      1923'ten beri Ankara'dır.                           ||
|  |                                                          ||
|  |      [Düzenle]                                           ||
|  |                                                          ||
|  |  [✓] Soru 2:                                             ||
|  |      ...                                                 ||
|  |                                                          ||
|  |                                                          ||
|  |  [ ] Başka Sorular Ekle                                  ||
|  |                                                          ||
|  |                                                          ||
|  |                      [< Geri] [Sınavı Tamamla >]         ||
|  +----------------------------------------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

### 2.5. Sınav Sonuçları Sayfası (Admin)
```
+--------------------------------------------------------------+
|                                                              |
|  SINAV SONUÇLARI: Matematik Testi                            |
|                                                              |
|  +----------------------------------------------------------+|
|  |                                     [Dışa Aktar (.xlsx)]  ||
|  |  Toplam Katılımcı: 12/50                                 ||
|  |  Ortalama Puan: 72/100                                   ||
|  |                                                          ||
|  |  +--------------------------------------------------------+
|  |  |                                                        |
|  |  |  Ad Soyad            E-posta            Puan   Detay   |
|  |  |  ------------------- ------------------ ------ ------- |
|  |  |  Ahmet Yılmaz        ahmet@ornek.com    85/100 [Gör]   |
|  |  |  Ayşe Demir          ayse@ornek.com     90/100 [Gör]   |
|  |  |  Mehmet Kaya         mehmet@ornek.com   65/100 [Gör]   |
|  |  |  ...                                                   |
|  |  |                                                        |
|  |  +--------------------------------------------------------+
|  |                                                          ||
|  |                                                          ||
|  |                           [< Geri] [Tümünü Yazdır]       ||
|  +----------------------------------------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

### 2.6. Sınav Paylaşım Sayfası (Admin)
```
+--------------------------------------------------------------+
|                                                              |
|  SINAVI PAYLAŞ: Matematik Testi                              |
|                                                              |
|  +----------------------------------------------------------+|
|  |                                                          ||
|  |  Sınav Erişim Bağlantısı:                                ||
|  |  +------------------------------------------------------+||
|  |  | https://sinav.ornek.com/s/MT2023                    |||
|  |  +------------------------------------------------------+||
|  |  [Kopyala]                                               ||
|  |                                                          ||
|  |  Erişim Kodu: MT2023                                     ||
|  |                                                          ||
|  |  QR Kod:                                                 ||
|  |  +-------------------+                                   ||
|  |  |                   |                                   ||
|  |  |       QR          |                                   ||
|  |  |                   |                                   ||
|  |  +-------------------+                                   ||
|  |  [QR Kodu İndir]                                         ||
|  |                                                          ||
|  |  [✓] Sınav sonuçlarını katılımcılara e-posta ile gönder  ||
|  |                                                          ||
|  |                                     [Kapat]              ||
|  +----------------------------------------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

## 3. Personel Arayüzleri

### 3.1. Sınav Giriş Sayfası (Personel)
```
+--------------------------------------------------------------+
|                                                              |
|  SINAV SİSTEMİ                                               |
|                                                              |
|  +----------------------------------------------------------+|
|  |                                                          ||
|  |                                                          ||
|  |     Sınava Hoş Geldiniz                                  ||
|  |                                                          ||
|  |     Sınava başlamak için lütfen bilgilerinizi girin.     ||
|  |                                                          ||
|  |     Adınız Soyadınız*                                    ||
|  |     +--------------------------------------------------+ ||
|  |     |                                                  | ||
|  |     +--------------------------------------------------+ ||
|  |                                                          ||
|  |     E-posta Adresiniz*                                   ||
|  |     +--------------------------------------------------+ ||
|  |     |                                                  | ||
|  |     +--------------------------------------------------+ ||
|  |                                                          ||
|  |     Sınav Erişim Kodu*                                   ||
|  |     +--------------------------------------------------+ ||
|  |     |                                                  | ||
|  |     +--------------------------------------------------+ ||
|  |                                                          ||
|  |                                   [Sınava Başla]         ||
|  |                                                          ||
|  +----------------------------------------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

### 3.2. Sınav Ekranı (Personel)
```
+--------------------------------------------------------------+
|                                                              |
|  MATEMATİK TESTİ                Kalan Süre: 42:15            |
|                                                              |
|  +----------------------------------------------------------+|
|  |                                                          ||
|  |  Soru 3/10                                               ||
|  |                                                          ||
|  |  Bir üçgenin iç açıları toplamı kaç derecedir?           ||
|  |                                                          ||
|  |  ◯ A) 90°                                                ||
|  |  ◯ B) 180°                                               ||
|  |  ◯ C) 270°                                               ||
|  |  ◯ D) 360°                                               ||
|  |                                                          ||
|  |                                                          ||
|  |  +------+------+------+------+------+                    ||
|  |  |  1   |  2   |  3   |  4   |  5   |                    ||
|  |  +------+------+------+------+------+                    ||
|  |  |  6   |  7   |  8   |  9   |  10  |                    ||
|  |  +------+------+------+------+------+                    ||
|  |                                                          ||
|  |                                                          ||
|  |  [< Önceki]                               [Sonraki >]    ||
|  |                                                          ||
|  |                           [Sınavı Bitir]                 ||
|  +----------------------------------------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

### 3.3. Sınav Sonucu Ekranı (Personel)
```
+--------------------------------------------------------------+
|                                                              |
|  SINAV SONUCU: Matematik Testi                               |
|                                                              |
|  +----------------------------------------------------------+|
|  |                                                          ||
|  |  Tebrikler, Ahmet Yılmaz!                                ||
|  |                                                          ||
|  |  Sınavınız tamamlanmıştır.                               ||
|  |                                                          ||
|  |  +--------------------------------------------------+    ||
|  |  |                                                  |    ||
|  |  |                 85/100                           |    ||
|  |  |                                                  |    ||
|  |  +--------------------------------------------------+    ||
|  |                                                          ||
|  |  Doğru Sayısı: 17                                        ||
|  |  Yanlış Sayısı: 3                                        ||
|  |  Toplam Soru: 20                                         ||
|  |                                                          ||
|  |  Sonuç detayları e-posta adresinize gönderilecektir.     ||
|  |                                                          ||
|  |                                                          ||
|  |                     [Ana Sayfaya Dön]                    ||
|  +----------------------------------------------------------+|
|                                                              |
+--------------------------------------------------------------+
```

## 4. Geliştirme Adımları ve Takvimi

### 4.1. Admin Panel Özellikleri
- [ ] Sınav listeleme sayfası
- [ ] Sınav oluşturma formu
- [ ] Sınav düzenleme sayfası
- [ ] Soru ekleme/düzenleme arayüzü
- [ ] PDF, DOC, TXT dosyalarından metin çıkarma
- [ ] LLM ile soru oluşturma entegrasyonu
- [ ] Soruları düzenleme ve onaylama
- [ ] Sınav paylaşım ve erişim kodu oluşturma
- [ ] QR kod oluşturma
- [ ] Sınav sonuçları sayfası
- [ ] Sonuç raporlarını dışa aktarma (Excel, PDF)

### 4.2. Personel Sınavı Özellikleri
- [ ] Sınav giriş ekranı
- [ ] Sınav oturum yönetimi
- [ ] Soru görüntüleme arayüzü
- [ ] Sınav zamanlayıcı
- [ ] Soru navigasyonu
- [ ] Cevapları kaydetme
- [ ] Sınav sonuç sayfası
- [ ] E-posta bildirim sistemi

### 4.3. Teknik Özellikler
- [ ] PostgreSQL tabloları oluşturma
- [ ] API endpoint'leri
- [ ] Dosya işleme servisleri
- [ ] OpenRouter API entegrasyonu
- [ ] E-posta gönderim servisi
- [ ] Sınav skorlama motoru
- [ ] Veri yedekleme ve koruma

## 5. Gelecek Geliştirmeler
- Gelişmiş analitik raporlar
- Soru bankası oluşturma
- Farklı soru tiplerini destekleme (çoktan seçmeli dışında)
- Mobil uygulama desteği
- Kurumsal kimlik doğrulama
- Sınav şablonları 