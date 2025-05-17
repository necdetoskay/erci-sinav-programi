# Sınav Katılımı Modülü

Bu dokümantasyon, Kent Konut Sınav Portalı'ndaki Sınav Katılımı modülünün işlevlerini, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Sınava Erişim](#sınava-erişim)
3. [Sınav Başlatma](#sınav-başlatma)
4. [Sınav Arayüzü](#sınav-arayüzü)
5. [Sınav Tamamlama](#sınav-tamamlama)
6. [Sınav Sonuçları](#sınav-sonuçları)
7. [Sınav Güvenliği](#sınav-güvenliği)
8. [API Referansı](#api-referansı)
9. [Veritabanı Şeması](#veritabanı-şeması)
10. [Sık Sorulan Sorular](#sık-sorulan-sorular)

## Genel Bakış

Sınav Katılımı modülü, Kent Konut Sınav Portalı'nda personelin sınavlara katılması, soruları cevaplaması ve sonuçları görüntülemesi için gerekli tüm işlevleri sağlar. Bu modül, sınav erişimini, sınav arayüzünü ve sınav güvenliğini yönetir.

## Sınava Erişim

Personel, aşağıdaki yöntemlerle sınavlara erişebilir:

### Sınav Kodu ile Erişim

1. Personel, sınav portalına giriş yapar
2. "Sınava Katıl" sayfasına gider
3. Sınav kodunu girer
4. "Sınava Katıl" butonuna tıklar

### E-posta Daveti ile Erişim

1. Personel, e-posta davetindeki bağlantıya tıklar
2. Sınav portalına yönlendirilir
3. Giriş yapar (henüz giriş yapmadıysa)
4. Doğrudan sınav sayfasına yönlendirilir

### Önemli Notlar

- Personel, yalnızca "published" (yayında) durumdaki sınavlara erişebilir
- Personel hesabı onaylanmış olmalıdır
- Personel, bir sınava yalnızca bir kez katılabilir (sistem ayarlarına bağlı olarak değişebilir)

## Sınav Başlatma

Sınav başlatma işlemi şu şekilde gerçekleşir:

1. Personel, sınav bilgilerini görüntüler (başlık, açıklama, süre)
2. "Sınavı Başlat" butonuna tıklar
3. Sistem, sınav başlangıç zamanını kaydeder
4. Sınav süresi başlar
5. İlk soru gösterilir

### Önemli Notlar

- Sınav başlatıldıktan sonra, süre otomatik olarak işlemeye başlar
- Sınav süresi, tarayıcı kapatılsa bile devam eder
- Sınav başlatıldıktan sonra, personel sınavı tamamlayana kadar veya süre dolana kadar devam eder

## Sınav Arayüzü

Sınav arayüzü, aşağıdaki bileşenleri içerir:

### Üst Bilgi Çubuğu

- Sınav başlığı
- Kalan süre (geri sayım)
- İlerleme durumu (örn. "5/20 soru")

### Soru Alanı

- Soru metni
- Soru tipi
- Seçenekler (soru tipine göre)
- Cevap giriş alanı (kısa cevap soruları için)

### Navigasyon Kontrolleri

- "Önceki Soru" butonu
- "Sonraki Soru" butonu
- Soru numaraları (hızlı erişim için)
- "Sınavı Tamamla" butonu

### Önemli Notlar

- Cevaplar otomatik olarak kaydedilir
- Personel, sorular arasında serbestçe gezinebilir
- Cevaplanmış ve cevaplanmamış sorular görsel olarak belirtilir
- Kalan süre sürekli olarak güncellenir

## Sınav Tamamlama

Sınav tamamlama işlemi şu şekilde gerçekleşir:

### Manuel Tamamlama

1. Personel, tüm soruları cevapladıktan sonra "Sınavı Tamamla" butonuna tıklar
2. Onay iletişim kutusu gösterilir
3. Personel, "Evet, Tamamla" butonuna tıklar
4. Sistem, sınav bitiş zamanını kaydeder
5. Cevaplar değerlendirilir
6. Sonuç sayfası gösterilir

### Otomatik Tamamlama

1. Sınav süresi dolduğunda, sistem otomatik olarak sınavı sonlandırır
2. Sistem, sınav bitiş zamanını kaydeder
3. O ana kadar işaretlenen cevaplar değerlendirilir
4. Sonuç sayfası gösterilir

### Önemli Notlar

- Sınav tamamlandıktan sonra, cevaplar değiştirilemez
- Sınav süresi dolduğunda, cevaplanmamış sorular yanlış olarak değerlendirilir
- Sınav tamamlandıktan sonra, personel sınava tekrar giremez (sistem ayarlarına bağlı olarak değişebilir)

## Sınav Sonuçları

Sınav sonuçları, aşağıdaki bilgileri içerir:

### Genel Sonuç Bilgileri

- Toplam puan
- Doğru sayısı
- Yanlış sayısı
- Boş sayısı
- Başlama zamanı
- Bitiş zamanı
- Toplam süre

### Detaylı Sonuç Bilgileri

- Her soru için:
  - Soru metni
  - Personelin cevabı
  - Doğru cevap
  - Puan

### Önemli Notlar

- Sonuçlar, sınav tamamlandıktan hemen sonra gösterilir
- Personel, sonuçları daha sonra da görüntüleyebilir
- Yöneticiler, tüm personelin sonuçlarını görüntüleyebilir

## Sınav Güvenliği

Sınav güvenliği, aşağıdaki önlemlerle sağlanır:

### Oturum Güvenliği

- Personel, sınava başlamadan önce giriş yapmış olmalıdır
- Oturum süresi dolduğunda, cevaplar otomatik olarak kaydedilir
- Farklı bir cihazdan veya tarayıcıdan giriş yapıldığında, mevcut oturum sonlandırılır

### Kopya Önleme

- Tam ekran modu (isteğe bağlı)
- Sağ tıklama ve kopyalama engelleme
- Tarayıcı sekmesi değiştirildiğinde uyarı
- Ekran yakalama engelleme (platform desteğine bağlı)

### Veri Güvenliği

- Cevaplar düzenli olarak sunucuya kaydedilir
- İnternet bağlantısı kesildiğinde, yerel olarak saklanır ve bağlantı kurulduğunda senkronize edilir
- Şifreli iletişim (HTTPS)

## API Referansı

Sınav Katılımı modülü, aşağıdaki API endpoint'lerini sağlar:

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/exams/validate-code` | POST | Sınav kodunu doğrular |
| `/api/exams/:id/start` | POST | Sınavı başlatır |
| `/api/exams/:id/questions` | GET | Sınav sorularını getirir |
| `/api/exams/:id/save-answer` | POST | Cevabı kaydeder |
| `/api/exams/:id/submit` | POST | Sınavı tamamlar |
| `/api/exams/:id/result` | GET | Sınav sonucunu getirir |
| `/api/user/exam-history` | GET | Kullanıcının sınav geçmişini getirir |

## Veritabanı Şeması

Sınav Katılımı modülü, aşağıdaki veritabanı tablolarını kullanır:

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

### Answer Tablosu

| Alan | Tür | Açıklama |
|------|-----|----------|
| id | Int | Benzersiz kimlik (Primary Key) |
| attemptId | Int | Sınav girişimi ID'si (Foreign Key) |
| questionId | Int | Soru ID'si (Foreign Key) |
| selectedOptions | Json? | Seçilen seçenekler (çoktan seçmeli sorular için) |
| textAnswer | String? | Metin cevabı (kısa cevap soruları için) |
| isCorrect | Boolean? | Doğru mu? |
| points | Float? | Kazanılan puan |
| createdAt | DateTime | Oluşturulma tarihi |
| updatedAt | DateTime | Son güncelleme tarihi |

## Sık Sorulan Sorular

### Sınav sırasında internet bağlantısı kesilirse ne olur?

Sınav sırasında internet bağlantısı kesilirse:

1. Sistem, cevapları yerel olarak saklar
2. Bağlantı yeniden kurulduğunda, cevaplar otomatik olarak senkronize edilir
3. Personel, sınava kaldığı yerden devam edebilir
4. Sınav süresi, bağlantı kesilse bile devam eder

### Sınav sırasında tarayıcı kazara kapatılırsa ne olur?

Sınav sırasında tarayıcı kazara kapatılırsa:

1. Personel, tekrar giriş yaparak sınava kaldığı yerden devam edebilir
2. O ana kadar kaydedilen cevaplar korunur
3. Sınav süresi, tarayıcı kapatılsa bile devam eder

### Sınav sonuçları ne zaman görüntülenebilir?

Sınav sonuçları, sınav tamamlandıktan hemen sonra görüntülenebilir. Personel, sonuçları daha sonra da "Sınav Geçmişi" sayfasından görüntüleyebilir.

### Bir sınava birden fazla kez girilebilir mi?

Varsayılan olarak, personel bir sınava yalnızca bir kez girebilir. Ancak, sistem ayarlarına bağlı olarak, yöneticiler personelin sınavı tekrar almasına izin verebilir.
