# Yönetici Kılavuzu

Bu kılavuz, Kent Konut Sınav Portalı'nın yönetici kullanıcıları için hazırlanmıştır. Sistemin yönetimsel işlevlerini ve özelliklerini açıklar.

## İçindekiler

1. [Giriş](#giriş)
2. [Yönetici Paneline Erişim](#yönetici-paneline-erişim)
3. [Kullanıcı Yönetimi](#kullanıcı-yönetimi)
4. [Sınav Yönetimi](#sınav-yönetimi)
5. [Soru Yönetimi](#soru-yönetimi)
6. [Raporlama](#raporlama)
7. [Sistem Ayarları](#sistem-ayarları)
8. [Sık Sorulan Sorular](#sık-sorulan-sorular)

## Giriş

Kent Konut Sınav Portalı, personel sınavlarının oluşturulması, yönetilmesi ve değerlendirilmesi için tasarlanmış bir web uygulamasıdır. Bu kılavuz, yönetici rolüne sahip kullanıcılar için sistemin nasıl kullanılacağını açıklar.

### Yönetici Rolleri

Sistem, iki farklı yönetici rolü sunar:

- **SUPERADMIN**: Tüm sistem ayarlarına ve tüm modüllere tam erişim
- **ADMIN**: Kullanıcı yönetimi, sınav oluşturma ve raporlama gibi yönetimsel işlevlere erişim

## Yönetici Paneline Erişim

Yönetici paneline erişmek için:

1. Web tarayıcınızda Kent Konut Sınav Portalı'na gidin
2. Giriş sayfasında e-posta adresinizi ve şifrenizi girin
3. "Giriş Yap" butonuna tıklayın
4. Başarılı giriş sonrası, otomatik olarak yönetici paneline yönlendirileceksiniz

### Önemli Notlar

- Yönetici hesabınızın onaylanmış olması gerekir
- Şifrenizi unuttuysanız, giriş sayfasındaki "Şifremi Unuttum" bağlantısını kullanabilirsiniz
- Güvenlik nedeniyle, belirli bir süre işlem yapılmadığında oturumunuz otomatik olarak sonlandırılabilir

## Kullanıcı Yönetimi

Kullanıcı yönetimi, aşağıdaki işlevleri içerir:

### Kullanıcı Listesi Görüntüleme

1. Yönetici panelinde "Kullanıcılar" menüsüne tıklayın
2. Tüm kullanıcıların listesi görüntülenecektir
3. Kullanıcıları ada, e-postaya veya role göre filtreleyebilirsiniz
4. Kullanıcıları ada, e-postaya, role veya oluşturulma tarihine göre sıralayabilirsiniz

### Yeni Kullanıcı Ekleme

1. Kullanıcı listesi sayfasında "Kullanıcı Ekle" butonuna tıklayın
2. Gerekli bilgileri doldurun:
   - Ad Soyad
   - E-posta
   - Şifre
   - Rol
   - Hesap Onayı (isteğe bağlı)
3. "Kaydet" butonuna tıklayın

### Kullanıcı Düzenleme

1. Kullanıcı listesinde, düzenlemek istediğiniz kullanıcının yanındaki "Düzenle" butonuna tıklayın
2. Gerekli değişiklikleri yapın
3. "Kaydet" butonuna tıklayın

### Toplu Personel Girişi

1. Kullanıcı listesi sayfasında "Toplu İçe Aktar" butonuna tıklayın
2. Personel listesini girin (her satırda bir personel, virgülle ayrılmış ad soyad ve e-posta)
3. Varsayılan şifreyi belirleyin
4. "Hesapları otomatik olarak onayla" seçeneğini işaretleyin veya işaretini kaldırın
5. "Personel Kayıtlarını Oluştur" butonuna tıklayın

### Şifre Sıfırlama

1. Kullanıcı listesinde, şifresini sıfırlamak istediğiniz kullanıcıları seçin
2. "Toplu İşlemler" menüsünden "Şifre Sıfırlama Bağlantısı Gönder" seçeneğini tıklayın

## Sınav Yönetimi

Sınav yönetimi, aşağıdaki işlevleri içerir:

### Sınav Listesi Görüntüleme

1. Yönetici panelinde "Sınavlar" menüsüne tıklayın
2. Tüm sınavların listesi görüntülenecektir
3. Sınavları başlığa, duruma veya oluşturulma tarihine göre filtreleyebilirsiniz
4. Sınavları başlığa, duruma veya oluşturulma tarihine göre sıralayabilirsiniz

### Yeni Sınav Oluşturma

1. Sınav listesi sayfasında "Sınav Ekle" butonuna tıklayın
2. Gerekli bilgileri doldurun:
   - Sınav Başlığı
   - Açıklama
   - Süre (dakika)
   - Sınav Durumu (varsayılan: draft)
3. "Kaydet" butonuna tıklayın
4. Sınav oluşturulduktan sonra, soru ekleme sayfasına yönlendirileceksiniz

### Sınav Düzenleme

1. Sınav listesinde, düzenlemek istediğiniz sınavın yanındaki "Düzenle" butonuna tıklayın
2. Gerekli değişiklikleri yapın
3. "Kaydet" butonuna tıklayın

### Sınav Paylaşımı

1. Sınav listesinde, paylaşmak istediğiniz sınavın yanındaki "Paylaş" butonuna tıklayın
2. E-posta göndermek istediğiniz personeli seçin
3. E-posta şablonunu düzenleyin (isteğe bağlı)
4. "E-posta Gönder" butonuna tıklayın

### Sınav Sonuçlarını Görüntüleme

1. Sınav listesinde, sonuçlarını görüntülemek istediğiniz sınavın yanındaki "Detaylar" butonuna tıklayın
2. "Sonuçlar" sekmesine tıklayın

## Soru Yönetimi

Soru yönetimi, aşağıdaki işlevleri içerir:

### Soru Listesi Görüntüleme

1. Sınav listesinde, sorularını görüntülemek istediğiniz sınavın yanındaki "Sorular" butonuna tıklayın
2. Tüm soruların listesi görüntülenecektir

### Yeni Soru Ekleme

1. Soru listesi sayfasında "Soru Ekle" butonuna tıklayın
2. Soru tipini seçin
3. Soru metnini girin
4. Seçenekleri girin (soru tipine göre)
5. Doğru cevabı işaretleyin
6. "Kaydet" butonuna tıklayın

### Soru Düzenleme

1. Soru listesinde, düzenlemek istediğiniz sorunun yanındaki "Düzenle" butonuna tıklayın
2. Gerekli değişiklikleri yapın
3. "Kaydet" butonuna tıklayın

### Yapay Zeka ile Soru Üretme

1. Soru listesi sayfasında "Yapay Zeka ile Soru Üret" butonuna tıklayın
2. Soru üretme parametrelerini ayarlayın:
   - Konu
   - Zorluk seviyesi
   - Soru sayısı
   - Soru tipi
3. "Soru Üret" butonuna tıklayın
4. Üretilen soruları inceleyin ve düzenleyin
5. "Soruları Ekle" butonuna tıklayın

## Raporlama

Raporlama, aşağıdaki işlevleri içerir:

### Rapor Oluşturma

1. Yönetici panelinde "Raporlar" menüsüne tıklayın
2. Rapor tipini seçin
3. Gerekli parametreleri belirleyin
4. "Rapor Oluştur" butonuna tıklayın

### Rapor Dışa Aktarma

1. Rapor oluşturun
2. "Dışa Aktar" butonuna tıklayın
3. Format seçin (PDF, Excel, CSV, JSON)
4. "İndir" butonuna tıklayın

## Sistem Ayarları

Sistem ayarları, aşağıdaki işlevleri içerir (yalnızca SUPERADMIN rolü için):

### E-posta Ayarları

1. Yönetici panelinde "Ayarlar" menüsüne tıklayın
2. "E-posta Ayarları" sekmesine tıklayın
3. SMTP sunucu bilgilerini girin:
   - SMTP Sunucu
   - SMTP Port
   - SMTP Kullanıcı Adı
   - SMTP Şifre
   - Gönderen E-posta
4. "Kaydet" butonuna tıklayın

### Genel Ayarlar

1. Yönetici panelinde "Ayarlar" menüsüne tıklayın
2. "Genel Ayarlar" sekmesine tıklayın
3. Genel sistem ayarlarını yapılandırın:
   - Sistem Adı
   - Logo
   - Tema
   - Dil
   - Zaman Dilimi
4. "Kaydet" butonuna tıklayın

## Sık Sorulan Sorular

### Yeni eklenen kullanıcılar neden giriş yapamıyor?

Yeni eklenen kullanıcıların hesapları varsayılan olarak onaylanmamış durumdadır. Kullanıcı düzenleme sayfasında "Hesap Onayı" seçeneğini işaretleyerek hesabı onaylayabilirsiniz.

### Yayınlanan bir sınavın soruları neden düzenlenemiyor?

Yayınlanan sınavların soruları, sınav bütünlüğünü korumak için düzenlenemez. Soruları düzenlemek için sınavı önce "draft" (taslak) durumuna almanız gerekir.

### Personel sınav kodunu girdiği halde sınava erişemiyor. Neden?

Bu durumun olası nedenleri:

1. Sınav "draft" (taslak) durumunda olabilir. Sınavın "published" (yayında) durumunda olduğundan emin olun.
2. Personel hesabı onaylanmamış olabilir. Hesap onayını kontrol edin.

### Sistem ayarlarına neden erişemiyorum?

Sistem ayarlarına yalnızca SUPERADMIN rolüne sahip kullanıcılar erişebilir. ADMIN rolüne sahip kullanıcılar, sistem ayarlarını görüntüleyemez veya değiştiremez.
