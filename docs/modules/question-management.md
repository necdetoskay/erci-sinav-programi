# Soru Yönetimi Modülü

Bu dokümantasyon, Kent Konut Sınav Portalı'ndaki Soru Yönetimi modülünün işlevlerini, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Soru Tipleri](#soru-tipleri)
3. [Soru Ekleme](#soru-ekleme)
4. [Soru Düzenleme](#soru-düzenleme)
5. [Soru Silme](#soru-silme)
6. [Soru Sıralaması](#soru-sıralaması)
7. [Yapay Zeka ile Soru Üretme](#yapay-zeka-ile-soru-üretme)
8. [API Referansı](#api-referansı)
9. [Veritabanı Şeması](#veritabanı-şeması)
10. [Sık Sorulan Sorular](#sık-sorulan-sorular)

## Genel Bakış

Soru Yönetimi modülü, Kent Konut Sınav Portalı'nda sınavlarda kullanılacak soruların oluşturulması, düzenlenmesi ve yönetilmesi için gerekli tüm işlevleri sağlar. Bu modül, farklı soru tiplerini destekler ve yapay zeka ile otomatik soru üretme özelliği sunar.

## Soru Tipleri

Sistem, aşağıdaki soru tiplerini destekler:

| Tip | Açıklama |
|-----|----------|
| MULTIPLE_CHOICE | Çoktan seçmeli (tek doğru cevap) |
| TRUE_FALSE | Doğru/Yanlış |
| MULTIPLE_ANSWER | Çoklu seçim (birden fazla doğru cevap) |
| SHORT_ANSWER | Kısa cevap |

### Soru Tipi Özellikleri

- **MULTIPLE_CHOICE**: 2-6 seçenek, tek doğru cevap
- **TRUE_FALSE**: Sadece "Doğru" ve "Yanlış" seçenekleri
- **MULTIPLE_ANSWER**: 2-6 seçenek, birden fazla doğru cevap
- **SHORT_ANSWER**: Metin girişi, anahtar kelimelerle eşleştirme

## Soru Ekleme

Bir sınava soru eklemek için:

1. Admin panelinde "Sınavlar" menüsüne tıklayın
2. İlgili sınavın yanındaki "Sorular" butonuna tıklayın
3. "Soru Ekle" butonuna tıklayın
4. Soru tipini seçin
5. Soru metnini girin
6. Seçenekleri girin (soru tipine göre)
7. Doğru cevabı işaretleyin
8. "Kaydet" butonuna tıklayın

### Önemli Notlar

- Soru ekleme işlemi yalnızca "draft" (taslak) durumdaki sınavlar için yapılabilir
- "published" (yayında) durumdaki sınavlara soru eklenemez
- Her sorunun bir puanı vardır (varsayılan: 1 puan)

## Soru Düzenleme

Mevcut bir soruyu düzenlemek için:

1. Admin panelinde "Sınavlar" menüsüne tıklayın
2. İlgili sınavın yanındaki "Sorular" butonuna tıklayın
3. Düzenlemek istediğiniz sorunun yanındaki "Düzenle" butonuna tıklayın
4. Gerekli değişiklikleri yapın
5. "Kaydet" butonuna tıklayın

### Önemli Notlar

- Soru düzenleme işlemi yalnızca "draft" (taslak) durumdaki sınavlar için yapılabilir
- "published" (yayında) durumdaki sınavların soruları düzenlenemez
- Soru tipi değiştirilebilir, ancak bu durumda seçenekler sıfırlanır

## Soru Silme

Bir soruyu silmek için:

1. Admin panelinde "Sınavlar" menüsüne tıklayın
2. İlgili sınavın yanındaki "Sorular" butonuna tıklayın
3. Silmek istediğiniz sorunun yanındaki "Sil" butonuna tıklayın
4. Onay iletişim kutusunda "Evet, Sil" butonuna tıklayın

### Önemli Notlar

- Soru silme işlemi yalnızca "draft" (taslak) durumdaki sınavlar için yapılabilir
- "published" (yayında) durumdaki sınavların soruları silinemez
- Silinen sorular geri alınamaz

## Soru Sıralaması

Soruların sırasını değiştirmek için:

1. Admin panelinde "Sınavlar" menüsüne tıklayın
2. İlgili sınavın yanındaki "Sorular" butonuna tıklayın
3. Soruları sürükleyip bırakarak sıralayın
4. "Sıralamayı Kaydet" butonuna tıklayın

### Önemli Notlar

- Soru sıralama işlemi yalnızca "draft" (taslak) durumdaki sınavlar için yapılabilir
- "published" (yayında) durumdaki sınavların soru sıralaması değiştirilemez
- Sınav esnasında sorular, belirlenen sıralamaya göre gösterilir

## Yapay Zeka ile Soru Üretme

Sistem, yapay zeka kullanarak otomatik soru üretme özelliği sunar.

### Yapay Zeka ile Soru Üretme Nasıl Çalışır?

1. Admin panelinde "Sınavlar" menüsüne tıklayın
2. İlgili sınavın yanındaki "Sorular" butonuna tıklayın
3. "Yapay Zeka ile Soru Üret" butonuna tıklayın
4. Soru üretme parametrelerini ayarlayın:
   - Konu
   - Zorluk seviyesi
   - Soru sayısı
   - Soru tipi
5. "Soru Üret" butonuna tıklayın
6. Üretilen soruları inceleyin ve düzenleyin
7. "Soruları Ekle" butonuna tıklayın

### Önemli Notlar

- Yapay zeka ile soru üretme işlemi yalnızca "draft" (taslak) durumdaki sınavlar için yapılabilir
- Üretilen sorular, eklenmeden önce düzenlenebilir
- Yapay zeka, OpenRouter API'si üzerinden çalışır ve internet bağlantısı gerektirir
- API anahtarı geçerli olmalıdır

## API Referansı

Soru Yönetimi modülü, aşağıdaki API endpoint'lerini sağlar:

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/exams/:examId/questions` | GET | Sınav sorularını getirir |
| `/api/exams/:examId/questions` | POST | Yeni soru ekler |
| `/api/questions/:id` | GET | Belirli bir sorunun bilgilerini getirir |
| `/api/questions/:id` | PUT | Belirli bir soruyu günceller |
| `/api/questions/:id` | DELETE | Belirli bir soruyu siler |
| `/api/exams/:examId/questions/reorder` | POST | Soru sıralamasını günceller |
| `/api/ai/generate-questions` | POST | Yapay zeka ile soru üretir |

## Veritabanı Şeması

Soru Yönetimi modülü, aşağıdaki veritabanı tablolarını kullanır:

### Question Tablosu

| Alan | Tür | Açıklama |
|------|-----|----------|
| id | Int | Benzersiz kimlik (Primary Key) |
| examId | Int | Sınav ID'si (Foreign Key) |
| type | Enum | Soru tipi (MULTIPLE_CHOICE, TRUE_FALSE, MULTIPLE_ANSWER, SHORT_ANSWER) |
| text | String | Soru metni |
| points | Float | Soru puanı |
| order | Int | Soru sırası |
| createdAt | DateTime | Oluşturulma tarihi |
| updatedAt | DateTime | Son güncelleme tarihi |

### Option Tablosu

| Alan | Tür | Açıklama |
|------|-----|----------|
| id | Int | Benzersiz kimlik (Primary Key) |
| questionId | Int | Soru ID'si (Foreign Key) |
| text | String | Seçenek metni |
| isCorrect | Boolean | Doğru cevap mı? |
| order | Int | Seçenek sırası |
| createdAt | DateTime | Oluşturulma tarihi |
| updatedAt | DateTime | Son güncelleme tarihi |

## Sık Sorulan Sorular

### Yapay zeka ile üretilen sorular neden bazen hatalı oluyor?

Yapay zeka ile üretilen sorular, dil modeli tarafından oluşturulur ve %100 doğruluk garantisi yoktur. Bu nedenle, üretilen soruları eklemeden önce gözden geçirmeniz ve gerekirse düzenlemeniz önerilir.

### Bir sorunun birden fazla doğru cevabı olabilir mi?

Evet, "MULTIPLE_ANSWER" tipi sorularda birden fazla doğru cevap olabilir. Bu tür sorularda, tüm doğru cevapların işaretlenmesi gerekir.

### Soru puanları nasıl belirlenir?

Her sorunun varsayılan puanı 1'dir, ancak bu değer soru ekleme veya düzenleme sırasında değiştirilebilir. Sınav toplam puanı, tüm soruların puanlarının toplamıdır.

### Yayınlanan bir sınavın soruları neden düzenlenemiyor?

Yayınlanan sınavların soruları, sınav bütünlüğünü korumak için düzenlenemez. Soruları düzenlemek için sınavı önce "draft" (taslak) durumuna almanız gerekir.
