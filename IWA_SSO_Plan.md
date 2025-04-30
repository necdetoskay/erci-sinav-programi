# IWA/SSO Entegrasyon Planı ve Mevcut Durum

Bu belge, e-posta gönderme sorununa alternatif olarak kullanıcıları sınavlarla ilişkilendirmek için Active Directory (AD) Entegre Windows Kimlik Doğrulaması (IWA) / Single Sign-On (SSO) entegrasyonu planını ve şu ana kadar yapılan testleri özetlemektedir.

## 1. E-posta Gönderme Sorunu

Uygulamadaki e-posta gönderme işlevi şu anda çalışmamaktadır. Bu durum, kullanıcıların sınava giriş için e-posta doğrulama kodlarını alamamasına neden olmaktadır. E-posta gönderme sorununu gidermek için yapılan testlerde, Exchange Web Services (EWS) üzerinden gönderim denemesi "440 Login Timeout" hatası ile sonuçlanmıştır. Bu hata, EWS kimlik bilgilerinde veya sunucu tarafında bir sorun olduğunu düşündürmektedir.

## 2. Active Directory (AD) Bağlantı Testi

E-posta doğrulama yerine kullanıcıları AD kimlikleriyle tanımlamak için AD bağlantısı test edilmiştir.

- **Test Scripti:** `test-ad-connection.js` adında bir Node.js scripti oluşturulmuştur.
- **Test Edilen Bilgiler:**
    - AD Sunucu IP'si: `172.41.41.5`
    - Kullanıcı Adı: `noskay@kentkonut.local`
    - Şifre: Sağlanan şifre
    - Portlar: 389 (LDAP) ve 636 (LDAPS)
- **Test Sonucu:** Script, `172.41.41.5` IP adresine 389 portu üzerinden `noskay@kentkonut.local` kullanıcı adı ve sağlanan şifre ile başarılı bir şekilde bağlanmıştır. 636 portu denenmiş ancak 389 başarılı olduğu için test tamamlanmıştır.

Bu testin başarısı, uygulamanın backend'inden Active Directory ile iletişim kurmanın mümkün olduğunu göstermektedir.

## 3. IWA/SSO Entegrasyon Planı

AD bağlantısının başarılı olması üzerine, kullanıcıları sınavlarla ilişkilendirmek için IWA/SSO entegrasyonu planlanmaktadır. Genel adımlar şunlardır:

- **Backend API Rotası Geliştirme:** Gelen HTTP isteklerinden kullanıcının AD kimliğini (örneğin, Kerberos veya NTLM başlıklarından) alacak ve bu kimliği doğrulayacak bir Next.js API rotası oluşturulacaktır. Bu rota, AD ile iletişim kurmak için `ldapjs` gibi Node.js kütüphanelerini kullanabilir.
- **Kullanıcı Tanımlama ve İlişkilendirme:** Backend'de doğrulanan AD kullanıcı kimliği, uygulamadaki kullanıcı hesaplarıyla eşleştirilecek veya yeni bir kullanıcı kaydı oluşturulacaktır. Ardından, bu kullanıcı kimliği sınava giriş ve takip için kullanılacaktır.
- **Frontend Entegrasyonu:** Sınav giriş sayfasının, kullanıcının AD kimliğini backend'den alacak şekilde güncellenmesi. Kullanıcı, AD'ye giriş yapmışsa otomatik olarak tanınacaktır.
- **Sunucu Ortamı Yapılandırması:** IWA/SSO'nun çalışması için uygulamanın dağıtılacağı web sunucusunda (örneğin, IIS, Nginx) ek yapılandırmalar gerekebilir.

## 4. Sonraki Adımlar

- Backend API rotası geliştirme ile IWA/SSO entegrasyonuna başlanması.
- Geliştirme ortamında AD kimlik doğrulamasının test edilmesi.
- Frontend entegrasyonunun yapılması.
- Dağıtım ortamı için sunucu yapılandırmasının tamamlanması.

Bu belge, IWA/SSO entegrasyonu sürecindeki ilerlemeyi takip etmek için kullanılacaktır.
