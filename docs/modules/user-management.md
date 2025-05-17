# Kullanıcı Yönetimi Modülü

Bu dokümantasyon, Kent Konut Sınav Portalı'ndaki Kullanıcı Yönetimi modülünün işlevlerini, özelliklerini ve kullanımını açıklar.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanıcı Rolleri](#kullanıcı-rolleri)
3. [Kullanıcı Oluşturma](#kullanıcı-oluşturma)
4. [Kullanıcı Düzenleme](#kullanıcı-düzenleme)
5. [Hesap Onayı](#hesap-onayı)
6. [Toplu Personel Girişi](#toplu-personel-girişi)
7. [Şifre Sıfırlama](#şifre-sıfırlama)
8. [API Referansı](#api-referansı)
9. [Veritabanı Şeması](#veritabanı-şeması)
10. [Sık Sorulan Sorular](#sık-sorulan-sorular)

## Genel Bakış

Kullanıcı Yönetimi modülü, Kent Konut Sınav Portalı'nda kullanıcıların oluşturulması, düzenlenmesi, silinmesi ve yönetilmesi için gerekli tüm işlevleri sağlar. Bu modül, farklı kullanıcı rollerini yönetmeyi, hesap onayını kontrol etmeyi ve toplu personel girişi yapmayı destekler.

## Kullanıcı Rolleri

Sistem, aşağıdaki kullanıcı rollerini destekler:

| Rol | Açıklama | Yetki Seviyesi |
|-----|----------|----------------|
| SUPERADMIN | Süper Yönetici | En yüksek (4) |
| ADMIN | Yönetici | Yüksek (3) |
| PERSONEL | Personel | Normal (2) |
| USER | Standart Kullanıcı | Düşük (1) |

### Rol Yetkileri

- **SUPERADMIN**: Tüm sistem ayarlarına ve tüm modüllere tam erişim
- **ADMIN**: Kullanıcı yönetimi, sınav oluşturma ve raporlama gibi yönetimsel işlevlere erişim
- **PERSONEL**: Sınavlara katılma ve kendi sonuçlarını görüntüleme
- **USER**: Temel işlevlere erişim (genellikle kullanılmaz)

## Kullanıcı Oluşturma

Yeni bir kullanıcı oluşturmak için:

1. Admin panelinde "Kullanıcılar" menüsüne tıklayın
2. "Kullanıcı Ekle" butonuna tıklayın
3. Gerekli bilgileri doldurun:
   - Ad Soyad
   - E-posta
   - Şifre
   - Rol
   - Hesap Onayı (isteğe bağlı)
4. "Kaydet" butonuna tıklayın

### Önemli Notlar

- E-posta adresi benzersiz olmalıdır
- Şifre en az 8 karakter uzunluğunda olmalıdır
- Bir kullanıcı, kendi rol seviyesinden daha yüksek bir role sahip kullanıcı oluşturamaz

## Kullanıcı Düzenleme

Mevcut bir kullanıcıyı düzenlemek için:

1. Admin panelinde "Kullanıcılar" menüsüne tıklayın
2. Düzenlemek istediğiniz kullanıcının yanındaki "Düzenle" butonuna tıklayın
3. Gerekli değişiklikleri yapın
4. "Kaydet" butonuna tıklayın

### Önemli Notlar

- Bir kullanıcı, kendi rol seviyesinden daha yüksek bir role sahip kullanıcıyı düzenleyemez
- Şifre alanı boş bırakılırsa, mevcut şifre değiştirilmez

## Hesap Onayı

Kullanıcı hesapları, sisteme giriş yapabilmeleri için onaylanmalıdır. Hesap onayı, `emailVerified` alanı ile yönetilir.

### Hesap Onayı Nasıl Çalışır?

1. Yeni bir kullanıcı oluşturulduğunda, hesap onayı durumu belirtilmelidir
2. Onaylanmış hesaplar için `emailVerified` alanı bir tarih değeri içerir
3. Onaylanmamış hesaplar için `emailVerified` alanı `null` değerindedir
4. Onaylanmamış hesaplar sisteme giriş yapamazlar ve "Hesabınız henüz onaylanmamıştır" hatası alırlar

### Hesap Onayı Yönetimi

Bir hesabı onaylamak için:

1. Kullanıcı düzenleme sayfasında "Hesap Onayı" seçeneğini işaretleyin
2. "Kaydet" butonuna tıklayın

## Toplu Personel Girişi

Çok sayıda personel hesabını hızlı bir şekilde oluşturmak için toplu personel girişi özelliği kullanılabilir.

### Toplu Personel Girişi Nasıl Yapılır?

1. Admin panelinde "Kullanıcılar" menüsüne tıklayın
2. "Toplu İçe Aktar" butonuna tıklayın
3. Personel listesini girin (her satırda bir personel, virgülle ayrılmış ad soyad ve e-posta)
4. Varsayılan şifreyi belirleyin
5. "Hesapları otomatik olarak onayla" seçeneğini işaretleyin veya işaretini kaldırın
6. "Personel Kayıtlarını Oluştur" butonuna tıklayın

### Örnek Personel Listesi Formatı

```
Ahmet Yılmaz,ahmet.yilmaz@kentkonut.com.tr
Ayşe Demir,ayse.demir@kentkonut.com.tr
Mehmet Kaya,mehmet.kaya@kentkonut.com.tr
```

### Otomatik Hesap Onayı

Toplu personel girişi yaparken, "Hesapları otomatik olarak onayla" seçeneği:

- İşaretlendiğinde: Oluşturulan tüm hesaplar otomatik olarak onaylanır (`emailVerified` alanı şimdiki tarih olarak ayarlanır)
- İşaretlenmediğinde: Oluşturulan hesaplar onaylanmaz (`emailVerified` alanı `null` olarak kalır) ve yöneticinin daha sonra manuel olarak onaylaması gerekir

## Şifre Sıfırlama

Kullanıcılar şifrelerini unuttuklarında, şifre sıfırlama işlemi yapabilirler.

### Şifre Sıfırlama Nasıl Çalışır?

1. Kullanıcı, giriş sayfasındaki "Şifremi Unuttum" bağlantısına tıklar
2. E-posta adresini girer ve "Şifre Sıfırlama Bağlantısı Gönder" butonuna tıklar
3. Sistem, kullanıcının e-posta adresine bir şifre sıfırlama bağlantısı gönderir
4. Kullanıcı, e-postadaki bağlantıya tıklayarak yeni bir şifre belirler

### Yönetici Tarafından Şifre Sıfırlama

Yöneticiler, kullanıcıların şifrelerini sıfırlama bağlantısı gönderebilirler:

1. Kullanıcı listesinde, şifresini sıfırlamak istediğiniz kullanıcıları seçin
2. "Toplu İşlemler" menüsünden "Şifre Sıfırlama Bağlantısı Gönder" seçeneğini tıklayın

## API Referansı

Kullanıcı Yönetimi modülü, aşağıdaki API endpoint'lerini sağlar:

| Endpoint | Metod | Açıklama |
|----------|-------|----------|
| `/api/users` | GET | Kullanıcı listesini getirir |
| `/api/users` | POST | Yeni kullanıcı oluşturur |
| `/api/users/:id` | GET | Belirli bir kullanıcının bilgilerini getirir |
| `/api/users/:id` | PUT | Belirli bir kullanıcıyı günceller |
| `/api/users/:id` | DELETE | Belirli bir kullanıcıyı siler |
| `/api/admin/users/bulk-import` | POST | Toplu personel girişi yapar |

## Veritabanı Şeması

Kullanıcı Yönetimi modülü, aşağıdaki veritabanı tablolarını kullanır:

### User Tablosu

| Alan | Tür | Açıklama |
|------|-----|----------|
| id | Int | Benzersiz kimlik (Primary Key) |
| name | String | Kullanıcının adı soyadı |
| email | String | Kullanıcının e-posta adresi (Unique) |
| password | String | Hashlenen şifre |
| role | Enum | Kullanıcı rolü (SUPERADMIN, ADMIN, PERSONEL, USER) |
| emailVerified | DateTime? | Hesap onay tarihi (null ise onaylanmamış) |
| createdAt | DateTime | Oluşturulma tarihi |
| updatedAt | DateTime | Son güncelleme tarihi |

## Sık Sorulan Sorular

### Kullanıcı hesabı neden onaylanmıyor?

Kullanıcı hesapları, güvenlik nedeniyle varsayılan olarak onaylanmamış durumdadır. Bir hesabı onaylamak için, kullanıcı düzenleme sayfasında "Hesap Onayı" seçeneğini işaretleyin.

### Toplu personel girişinde neden bazı kullanıcılar oluşturulamıyor?

Toplu personel girişinde, aşağıdaki durumlarda kullanıcılar oluşturulamaz:

- E-posta adresi geçersiz format
- E-posta adresi zaten kullanımda
- Ad soyad veya e-posta eksik

### Süper Yönetici hesabı nasıl oluşturulur?

Süper Yönetici hesabı, sistem kurulumu sırasında otomatik olarak oluşturulur. Ek Süper Yönetici hesapları, yalnızca mevcut bir Süper Yönetici tarafından oluşturulabilir.

### Kullanıcı şifresini unuttuğunda ne yapmalı?

Kullanıcı, giriş sayfasındaki "Şifremi Unuttum" bağlantısını kullanarak şifre sıfırlama işlemi yapabilir. Alternatif olarak, bir yönetici kullanıcı listesinden şifre sıfırlama bağlantısı gönderebilir.
