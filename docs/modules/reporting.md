# Raporlama Modülü

Bu dokümantasyon, Kent Konut Sınav Portalı'ndaki Raporlama modülünün işlevlerini, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Rapor Tipleri](#rapor-tipleri)
3. [Rapor Oluşturma](#rapor-oluşturma)
4. [Rapor Filtreleme](#rapor-filtreleme)
5. [Rapor Dışa Aktarma](#rapor-dışa-aktarma)
6. [Grafikler ve Görselleştirmeler](#grafikler-ve-görselleştirmeler)
7. [API Referansı](#api-referansı)
8. [Veritabanı Şeması](#veritabanı-şeması)
9. [Sık Sorulan Sorular](#sık-sorulan-sorular)

## Genel Bakış

Raporlama modülü, Kent Konut Sınav Portalı'nda sınav sonuçları, kullanıcı performansı ve sistem kullanımı hakkında detaylı raporlar oluşturmak için gerekli tüm işlevleri sağlar. Bu modül, farklı rapor tiplerini, filtreleme seçeneklerini ve dışa aktarma özelliklerini destekler.

## Rapor Tipleri

Sistem, aşağıdaki rapor tiplerini destekler:

### Sınav Raporları

| Rapor | Açıklama |
|-------|----------|
| Sınav Sonuçları | Belirli bir sınavın tüm katılımcılarının sonuçları |
| Soru Analizi | Belirli bir sınavdaki soruların zorluk ve doğruluk analizi |
| Sınav Karşılaştırma | Farklı sınavların sonuçlarının karşılaştırılması |

### Kullanıcı Raporları

| Rapor | Açıklama |
|-------|----------|
| Kullanıcı Performansı | Belirli bir kullanıcının tüm sınavlardaki performansı |
| Departman Performansı | Belirli bir departmandaki kullanıcıların performansı |
| Kullanıcı Karşılaştırma | Farklı kullanıcıların performanslarının karşılaştırılması |

### Sistem Raporları

| Rapor | Açıklama |
|-------|----------|
| Sistem Kullanımı | Sistem kullanım istatistikleri (giriş sayısı, sınav sayısı vb.) |
| Aktivite Günlüğü | Sistem aktivitelerinin günlüğü |
| Hata Günlüğü | Sistem hatalarının günlüğü |

## Rapor Oluşturma

Rapor oluşturmak için:

1. Admin panelinde "Raporlar" menüsüne tıklayın
2. Rapor tipini seçin
3. Gerekli parametreleri belirleyin
4. "Rapor Oluştur" butonuna tıklayın

### Örnek: Sınav Sonuçları Raporu Oluşturma

1. "Raporlar" menüsüne tıklayın
2. "Sınav Sonuçları" rapor tipini seçin
3. Sınav seçin
4. Tarih aralığı belirleyin (isteğe bağlı)
5. "Rapor Oluştur" butonuna tıklayın

### Örnek: Kullanıcı Performansı Raporu Oluşturma

1. "Raporlar" menüsüne tıklayın
2. "Kullanıcı Performansı" rapor tipini seçin
3. Kullanıcı seçin
4. Tarih aralığı belirleyin (isteğe bağlı)
5. "Rapor Oluştur" butonuna tıklayın

## Rapor Filtreleme

Raporlar, çeşitli kriterlere göre filtrelenebilir:

### Zaman Filtreleri

- Belirli bir tarih aralığı
- Son 7 gün
- Son 30 gün
- Son 3 ay
- Son 6 ay
- Son 1 yıl
- Özel tarih aralığı

### Kullanıcı Filtreleri

- Belirli bir kullanıcı
- Belirli bir departman
- Belirli bir rol
- Aktif/pasif kullanıcılar

### Sınav Filtreleri

- Belirli bir sınav
- Belirli bir sınav kategorisi
- Belirli bir zorluk seviyesi
- Belirli bir durum (draft, published)

### Sonuç Filtreleri

- Belirli bir puan aralığı
- Belirli bir başarı durumu (başarılı/başarısız)
- Belirli bir tamamlanma durumu (tamamlandı/tamamlanmadı)

## Rapor Dışa Aktarma

Raporlar, aşağıdaki formatlarda dışa aktarılabilir:

| Format | Açıklama |
|--------|----------|
| PDF | Yazdırılabilir PDF belgesi |
| Excel | Microsoft Excel dosyası (.xlsx) |
| CSV | Virgülle ayrılmış değerler dosyası (.csv) |
| JSON | JSON formatında veri dosyası (.json) |

### Rapor Dışa Aktarma Adımları

1. Rapor oluşturun
2. "Dışa Aktar" butonuna tıklayın
3. Format seçin
4. "İndir" butonuna tıklayın

## Grafikler ve Görselleştirmeler

Raporlar, aşağıdaki görsel öğeleri içerebilir:

### Çubuk Grafikler

- Sınav sonuçlarının karşılaştırılması
- Kullanıcı performanslarının karşılaştırılması
- Soru zorluklarının dağılımı

### Pasta Grafikler

- Doğru/yanlış/boş cevap dağılımı
- Kullanıcı rol dağılımı
- Sınav durum dağılımı

### Çizgi Grafikler

- Zaman içinde kullanıcı performansı
- Zaman içinde sistem kullanımı
- Zaman içinde sınav katılımı

### Isı Haritaları

- Soru zorluklarının görselleştirilmesi
- Kullanıcı aktivite zamanlarının görselleştirilmesi
- Sınav başarı oranlarının görselleştirilmesi

## API Referansı

Raporlama modülü, aşağıdaki API endpoint'lerini sağlar:

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/reports/exam-results` | GET | Sınav sonuçları raporunu getirir |
| `/api/reports/question-analysis` | GET | Soru analizi raporunu getirir |
| `/api/reports/user-performance` | GET | Kullanıcı performansı raporunu getirir |
| `/api/reports/department-performance` | GET | Departman performansı raporunu getirir |
| `/api/reports/system-usage` | GET | Sistem kullanımı raporunu getirir |
| `/api/reports/export` | POST | Raporu dışa aktarır |

## Veritabanı Şeması

Raporlama modülü, diğer modüllerin tablolarını kullanır ve ek olarak aşağıdaki tabloları içerir:

### Report Tablosu

| Alan | Tür | Açıklama |
|------|-----|----------|
| id | Int | Benzersiz kimlik (Primary Key) |
| type | Enum | Rapor tipi |
| parameters | Json | Rapor parametreleri |
| createdById | Int | Oluşturan kullanıcı ID'si (Foreign Key) |
| createdAt | DateTime | Oluşturulma tarihi |
| updatedAt | DateTime | Son güncelleme tarihi |

### ReportExport Tablosu

| Alan | Tür | Açıklama |
|------|-----|----------|
| id | Int | Benzersiz kimlik (Primary Key) |
| reportId | Int | Rapor ID'si (Foreign Key) |
| format | Enum | Dışa aktarma formatı (PDF, Excel, CSV, JSON) |
| filePath | String | Dosya yolu |
| createdById | Int | Oluşturan kullanıcı ID'si (Foreign Key) |
| createdAt | DateTime | Oluşturulma tarihi |

## Sık Sorulan Sorular

### Raporlar ne kadar süreyle saklanır?

Raporlar, sistem ayarlarına bağlı olarak belirli bir süre (varsayılan: 30 gün) saklanır. Bu süre sonunda, otomatik olarak silinebilir veya arşivlenebilir.

### Raporlar otomatik olarak oluşturulabilir mi?

Evet, raporlar zamanlanmış görevler aracılığıyla otomatik olarak oluşturulabilir. Örneğin, her ayın sonunda departman performans raporu otomatik olarak oluşturulabilir ve ilgili yöneticilere e-posta ile gönderilebilir.

### Raporlar e-posta ile gönderilebilir mi?

Evet, raporlar e-posta ile gönderilebilir. Rapor oluşturulduktan sonra, "E-posta ile Gönder" butonuna tıklayarak raporu belirli kullanıcılara veya e-posta adreslerine gönderebilirsiniz.

### Özel raporlar oluşturulabilir mi?

Evet, özel raporlar oluşturulabilir. "Özel Rapor" seçeneğini kullanarak, istediğiniz parametreleri ve filtreleri belirleyebilir ve kendi özel raporunuzu oluşturabilirsiniz.
