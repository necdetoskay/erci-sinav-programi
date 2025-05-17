# Sınav Yönetimi Modülü

Bu dokümantasyon, Kent Konut Sınav Portalı'ndaki Sınav Yönetimi modülünün işlevlerini, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Sınav Durumları](#sınav-durumları)
3. [Sınav Oluşturma](#sınav-oluşturma)
4. [Sınav Düzenleme](#sınav-düzenleme)
5. [Sınav Yayınlama](#sınav-yayınlama)
6. [Sınav Paylaşımı](#sınav-paylaşımı)
7. [Sınav Kodları](#sınav-kodları)
8. [Sınav Sonuçları](#sınav-sonuçları)
9. [API Referansı](#api-referansı)
10. [Veritabanı Şeması](#veritabanı-şeması)
11. [Sık Sorulan Sorular](#sık-sorulan-sorular)

## Genel Bakış

Sınav Yönetimi modülü, Kent Konut Sınav Portalı'nda sınavların oluşturulması, düzenlenmesi, yayınlanması ve yönetilmesi için gerekli tüm işlevleri sağlar. Bu modül, sınav içeriğini oluşturmayı, sınavları personele atamayı ve sınav sonuçlarını görüntülemeyi destekler.

## Sınav Durumları

Sistem, aşağıdaki sınav durumlarını destekler:

| Durum | Açıklama |
|-------|----------|
| draft | Taslak (hazırlık aşamasında) |
| published | Yayında (personelin erişimine açık) |

### Durum Geçişleri

- **draft → published**: Sınav hazırlandıktan sonra yayınlanır
- **published → draft**: Yayındaki bir sınav düzenleme için taslak durumuna alınabilir

## Sınav Oluşturma

Yeni bir sınav oluşturmak için:

1. Admin panelinde "Sınavlar" menüsüne tıklayın
2. "Sınav Ekle" butonuna tıklayın
3. Gerekli bilgileri doldurun:
   - Sınav Başlığı
   - Açıklama
   - Süre (dakika)
   - Sınav Durumu (varsayılan: draft)
4. "Kaydet" butonuna tıklayın
5. Sınav oluşturulduktan sonra, soru ekleme sayfasına yönlendirilirsiniz

### Önemli Notlar

- Yeni oluşturulan sınavlar varsayılan olarak "draft" (taslak) durumundadır
- Sınav kodu otomatik olarak oluşturulur
- Taslak durumdaki sınavlar personel tarafından görüntülenemez

## Sınav Düzenleme

Mevcut bir sınavı düzenlemek için:

1. Admin panelinde "Sınavlar" menüsüne tıklayın
2. Düzenlemek istediğiniz sınavın yanındaki "Düzenle" butonuna tıklayın
3. Gerekli değişiklikleri yapın
4. "Kaydet" butonuna tıklayın

### Önemli Notlar

- Yayında olan bir sınavı düzenlemek için önce taslak durumuna almanız gerekebilir
- Yayında olan sınavların soruları düzenlenemez, sadece sınav bilgileri güncellenebilir

## Sınav Yayınlama

Bir sınavı yayınlamak için:

1. Sınav düzenleme sayfasında "Durum" alanını "published" (yayında) olarak değiştirin
2. "Kaydet" butonuna tıklayın

### Önemli Notlar

- Sınav yayınlandıktan sonra, personel sınav kodunu kullanarak sınava erişebilir
- Yayınlanan bir sınav, personele e-posta ile gönderilebilir
- Yayınlanan sınavların soruları düzenlenemez

## Sınav Paylaşımı

Bir sınavı personel ile paylaşmak için:

1. Admin panelinde "Sınavlar" menüsüne tıklayın
2. Paylaşmak istediğiniz sınavın yanındaki "Paylaş" butonuna tıklayın
3. E-posta göndermek istediğiniz personeli seçin
4. E-posta şablonunu düzenleyin (isteğe bağlı)
5. "E-posta Gönder" butonuna tıklayın

### Önemli Notlar

- Sadece "published" (yayında) durumdaki sınavlar paylaşılabilir
- Taslak durumdaki sınavlar paylaşılamaz ve personel erişemez
- E-posta şablonunda aşağıdaki yer tutucuları kullanabilirsiniz:
  - `{EXAM_TITLE}` - Sınav adı
  - `{EXAM_CODE}` - Sınav kodu
  - `{EXAM_LINK}` - Sınav giriş linki
  - `{USER_NAME}` - Personel adı

## Sınav Kodları

Her sınav için benzersiz bir sınav kodu oluşturulur. Bu kod, personelin sınava erişmek için kullandığı koddur.

### Sınav Kodu Nasıl Çalışır?

1. Sınav oluşturulduğunda, sistem otomatik olarak benzersiz bir sınav kodu oluşturur
2. Bu kod, sınav paylaşım sayfasında görüntülenir ve kopyalanabilir
3. Personel, sınav giriş sayfasında bu kodu girerek sınava erişir
4. Sistem, girilen kodu veritabanındaki "published" (yayında) durumdaki sınavlarla karşılaştırır
5. Eşleşme bulunursa, personel sınava yönlendirilir

### Önemli Notlar

- Sınav kodları büyük/küçük harfe duyarlı değildir
- Taslak durumdaki sınavların kodları doğrulanmaz
- Personel, sadece "published" (yayında) durumdaki sınavlara erişebilir

## Sınav Sonuçları

Sınav sonuçlarını görüntülemek için:

1. Admin panelinde "Sınavlar" menüsüne tıklayın
2. İlgili sınavın yanındaki "Detaylar" butonuna tıklayın
3. "Sonuçlar" sekmesine tıklayın

### Sonuç Bilgileri

Sınav sonuçları aşağıdaki bilgileri içerir:

- Personel adı
- Başlama zamanı
- Bitiş zamanı
- Toplam süre
- Doğru sayısı
- Yanlış sayısı
- Boş sayısı
- Puan

## API Referansı

Sınav Yönetimi modülü, aşağıdaki API endpoint'lerini sağlar:

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/exams` | GET | Sınav listesini getirir |
| `/api/exams` | POST | Yeni sınav oluşturur |
| `/api/exams/:id` | GET | Belirli bir sınavın bilgilerini getirir |
| `/api/exams/:id` | PUT | Belirli bir sınavı günceller |
| `/api/exams/:id` | DELETE | Belirli bir sınavı siler |
| `/api/exams/:id/questions` | GET | Sınav sorularını getirir |
| `/api/exams/:id/results` | GET | Sınav sonuçlarını getirir |
| `/api/exams/validate-code` | POST | Sınav kodunu doğrular |
| `/api/exams/:id/start` | POST | Sınavı başlatır |
| `/api/exams/:id/submit` | POST | Sınav cevaplarını gönderir |
| `/api/admin/send-exam-invitations` | POST | Sınav davetiyelerini gönderir |

## Veritabanı Şeması

Sınav Yönetimi modülü, aşağıdaki veritabanı tablolarını kullanır:

### Exam Tablosu

| Alan | Tür | Açıklama |
|------|-----|----------|
| id | Int | Benzersiz kimlik (Primary Key) |
| title | String | Sınav başlığı |
| description | String? | Sınav açıklaması |
| duration_minutes | Int | Sınav süresi (dakika) |
| access_code | String | Sınav erişim kodu |
| status | Enum | Sınav durumu (draft, published) |
| createdAt | DateTime | Oluşturulma tarihi |
| updatedAt | DateTime | Son güncelleme tarihi |
| createdById | Int | Oluşturan kullanıcı ID'si |

### ExamAttempt Tablosu

| Alan | Tür | Açıklama |
|------|-----|----------|
| id | Int | Benzersiz kimlik (Primary Key) |
| examId | Int | Sınav ID'si (Foreign Key) |
| userId | Int | Kullanıcı ID'si (Foreign Key) |
| startedAt | DateTime | Başlama zamanı |
| completedAt | DateTime? | Tamamlanma zamanı |
| score | Float? | Puan |
| createdAt | DateTime | Oluşturulma tarihi |
| updatedAt | DateTime | Son güncelleme tarihi |

## Sık Sorulan Sorular

### Personel sınav kodunu girdiği halde "Yanlış sınav kodu" hatası alıyor. Neden?

Bu hatanın olası nedenleri:

1. Sınav "draft" (taslak) durumunda olabilir. Sınavın "published" (yayında) durumunda olduğundan emin olun.
2. Sınav kodu yanlış girilmiş olabilir. Büyük/küçük harf duyarlılığını kontrol edin.
3. Personel oturum açmamış olabilir. Personelin sisteme giriş yaptığından emin olun.
4. Personel hesabı onaylanmamış olabilir. Hesap onayını kontrol edin.

### Yayınlanan bir sınavın soruları neden düzenlenemiyor?

Yayınlanan sınavların soruları, sınav bütünlüğünü korumak için düzenlenemez. Soruları düzenlemek için:

1. Sınavı "draft" (taslak) durumuna alın
2. Soruları düzenleyin
3. Sınavı tekrar "published" (yayında) durumuna alın

### Sınav süresi dolduğunda ne olur?

Sınav süresi dolduğunda:

1. Sistem otomatik olarak sınavı sonlandırır
2. O ana kadar işaretlenen cevaplar kaydedilir
3. Personel sonuç sayfasına yönlendirilir

### Personel sınava birden fazla kez girebilir mi?

Varsayılan olarak, personel bir sınava yalnızca bir kez girebilir. Ancak, sistem ayarlarına bağlı olarak, yöneticiler personelin sınavı tekrar almasına izin verebilir.
