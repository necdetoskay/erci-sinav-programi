# Exchange Server 2019 E-posta Entegrasyonu Rehberi

Bu rehber, Bakım Onarım Uygulaması'nın Exchange Server 2019 ile entegrasyonunu ve e-posta gönderimini yapılandırmayı açıklamaktadır.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Gereksinimler](#gereksinimler)
3. [Exchange Server Yapılandırması](#exchange-server-yapılandırması)
4. [Node.js Entegrasyonu](#nodejs-entegrasyonu)
5. [Test Scriptleri](#test-scriptleri)
6. [Uygulama Entegrasyonu](#uygulama-entegrasyonu)
7. [Sorun Giderme](#sorun-giderme)

## Genel Bakış

Exchange Server 2019, Microsoft'un kurumsal e-posta ve iletişim çözümüdür. Bu rehber, Bakım Onarım Uygulaması'nın Exchange Server 2019 üzerinden e-posta göndermesini sağlamak için gerekli adımları açıklamaktadır.

Entegrasyon, aşağıdaki bileşenleri içerir:

1. Exchange Server 2019 yapılandırması
2. Node.js için Nodemailer kütüphanesi
3. E-posta gönderme modülü
4. Test scriptleri

## Gereksinimler

- Exchange Server 2019 (IP: 172.41.41.14)
- Node.js 14 veya üzeri
- Nodemailer kütüphanesi
- E-posta gönderme izinleri

## Exchange Server Yapılandırması

### 1. Exchange Server Bilgileri

Exchange Server'a erişim için aşağıdaki bilgilere ihtiyacınız olacak:

- **Sunucu Adresi**: 172.41.41.14
- **Port**: 25 (SMTP)
- **Güvenlik**: TLS (isteğe bağlı)
- **Kimlik Doğrulama**: Anonim (kimlik doğrulama olmadan)

### 2. Relay İzinleri

Exchange Server'ın uygulamanızdan gelen e-postaları relay etmesine izin vermek için:

1. Exchange Admin Center'a giriş yapın
2. **Mail Flow** > **Receive Connectors** bölümüne gidin
3. İlgili connector'ı seçin (genellikle "Default Frontend")
4. **Security** sekmesinde, "Anonymous users" seçeneğini etkinleştirin
5. IP adres kısıtlamalarını yapılandırın (güvenlik için)

### 3. Güvenlik Ayarları

Güvenlik nedeniyle, Exchange Server'ın yalnızca belirli IP adreslerinden gelen istekleri kabul etmesini sağlamak önemlidir:

1. Exchange Management Shell'i açın
2. Aşağıdaki komutu çalıştırın:

```powershell
Set-ReceiveConnector "Default Frontend <ServerName>" -RemoteIPRanges "172.41.41.0/24"
```

Bu, yalnızca belirtilen IP aralığından gelen isteklerin kabul edilmesini sağlar.

## Node.js Entegrasyonu

### 1. Nodemailer Kurulumu

Nodemailer, Node.js uygulamalarından e-posta göndermek için kullanılan popüler bir kütüphanedir:

```bash
npm install nodemailer
```

### 2. E-posta Gönderme Modülü

`src/utils/email.js` dosyasını oluşturun:

```javascript
/**
 * E-posta gönderme işlemleri için yardımcı fonksiyonlar
 */

const nodemailer = require('nodemailer');

/**
 * Exchange Server yapılandırması
 */
const exchangeConfig = {
  host: '172.41.41.14',  // Exchange Server adresi
  port: 25,              // SMTP port
  secure: false,         // TLS kullanımı (25 portu için false)
  auth: null,            // Kimlik doğrulama olmadan
  tls: {
    rejectUnauthorized: false  // Sertifika doğrulama sorunları için
  }
};

/**
 * E-posta gönderme fonksiyonu
 * @param {string} to - Alıcı e-posta adresi
 * @param {string} subject - E-posta konusu
 * @param {string} text - Düz metin içerik
 * @param {string} html - HTML içerik
 * @returns {Promise<object>} - Gönderim bilgileri
 */
async function sendEmail(to, subject, text, html) {
  try {
    // SMTP yapılandırması
    const transporter = nodemailer.createTransport(exchangeConfig);

    // E-posta içeriği
    const mailOptions = {
      from: process.env.MAIL_FROM || 'noskay@kentkonut.com.tr',
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    // E-postayı gönder
    const info = await transporter.sendMail(mailOptions);
    console.log('E-posta gönderildi:', info.messageId);
    return info;
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    throw error;
  }
}

/**
 * Admin hesap bilgilerini e-posta ile gönderir
 * @param {string} email - Admin e-posta adresi
 * @param {string} password - Admin şifresi
 * @returns {Promise<object>} - Gönderim bilgileri
 */
async function sendAdminCredentials(email, password) {
  const subject = 'Bakım Onarım Uygulaması - Admin Hesap Bilgileri';
  
  const text = `
Bakım Onarım Uygulaması - Admin Hesap Bilgileri

E-posta: ${email}
Şifre: ${password}

Bu bilgileri güvenli bir şekilde saklayınız.
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    .header { background-color: #f5f5f5; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { padding: 20px; }
    .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }
    .credentials { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Bakım Onarım Uygulaması</h2>
    </div>
    <div class="content">
      <h3>Admin Hesap Bilgileri</h3>
      <p>Aşağıda admin hesabınıza ait giriş bilgileri bulunmaktadır:</p>
      
      <div class="credentials">
        <p><strong>E-posta:</strong> ${email}</p>
        <p><strong>Şifre:</strong> ${password}</p>
      </div>
      
      <p>Bu bilgileri güvenli bir şekilde saklayınız.</p>
    </div>
    <div class="footer">
      <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
    </div>
  </div>
</body>
</html>
`;

  return await sendEmail(email, subject, text, html);
}

module.exports = {
  sendEmail,
  sendAdminCredentials
};
```

### 3. ESM Modülü için E-posta Modülü

ESM modülü kullanıyorsanız, `src/utils/email.mjs` dosyasını oluşturun:

```javascript
/**
 * E-posta gönderme işlemleri için yardımcı fonksiyonlar (ESM modülü)
 */

import nodemailer from 'nodemailer';

/**
 * Exchange Server yapılandırması
 */
const exchangeConfig = {
  host: '172.41.41.14',  // Exchange Server adresi
  port: 25,              // SMTP port
  secure: false,         // TLS kullanımı (25 portu için false)
  auth: null,            // Kimlik doğrulama olmadan
  tls: {
    rejectUnauthorized: false  // Sertifika doğrulama sorunları için
  }
};

/**
 * E-posta gönderme fonksiyonu
 */
export async function sendEmail(to, subject, text, html) {
  try {
    // SMTP yapılandırması
    const transporter = nodemailer.createTransport(exchangeConfig);

    // E-posta içeriği
    const mailOptions = {
      from: process.env.MAIL_FROM || 'noskay@kentkonut.com.tr',
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    // E-postayı gönder
    const info = await transporter.sendMail(mailOptions);
    console.log('E-posta gönderildi:', info.messageId);
    return info;
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    throw error;
  }
}

/**
 * Admin hesap bilgilerini e-posta ile gönderir
 */
export async function sendAdminCredentials(email, password) {
  // Yukarıdaki CommonJS modülündeki ile aynı içerik
  // ...
  
  return await sendEmail(email, subject, text, html);
}
```

## Test Scriptleri

### 1. Basit E-posta Gönderme Testi

`scripts/send-exchange-email.js` dosyasını oluşturun:

```javascript
/**
 * Exchange Server 2019 üzerinden e-posta gönderme testi
 * 
 * Kullanım:
 * node scripts/send-exchange-email.js [alici@email.com]
 */

const nodemailer = require('nodemailer');

// Komut satırı argümanlarını kontrol et
const args = process.argv.slice(2);
const recipient = args[0] || 'noskay@kentkonut.com.tr';

// Exchange Server ayarları
const exchangeConfig = {
  host: '172.41.41.14',  // Exchange Server adresi
  port: 25,              // SMTP port
  secure: false,         // TLS kullanımı (25 portu için false)
  auth: null,            // Kimlik doğrulama olmadan
  tls: {
    rejectUnauthorized: false  // Sertifika doğrulama sorunları için
  }
};

// E-posta içeriği
const emailOptions = {
  from: 'noskay@kentkonut.com.tr',  // Gönderen e-posta adresi
  to: recipient,                     // Alıcı e-posta adresi
  subject: 'Exchange Server Test E-postası',  // E-posta konusu
  text: 'Bu bir test e-postasıdır. Exchange Server 2019 üzerinden Node.js ile gönderilmiştir.',  // Düz metin içerik
  html: `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
      .header { background-color: #f5f5f5; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }
      .content { padding: 20px; }
      .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }
      .message { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>Bakım Onarım Uygulaması</h2>
      </div>
      <div class="content">
        <h3>Exchange Server Test E-postası</h3>
        <div class="message">
          <p>Bu bir test e-postasıdır. Exchange Server 2019 üzerinden Node.js ile gönderilmiştir.</p>
        </div>
      </div>
      <div class="footer">
        <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
      </div>
    </div>
  </body>
  </html>
  `  // HTML içerik
};

async function sendEmail() {
  console.log('Exchange Server E-posta Gönderme');
  console.log('='.repeat(50));
  
  // Exchange ayarlarını göster
  console.log('Exchange Server Ayarları:');
  console.log(`Host: ${exchangeConfig.host}`);
  console.log(`Port: ${exchangeConfig.port}`);
  console.log(`Secure: ${exchangeConfig.secure ? 'Evet' : 'Hayır'}`);
  console.log(`Auth: ${exchangeConfig.auth ? 'Evet' : 'Hayır'}`);
  console.log('='.repeat(50));
  
  // E-posta bilgilerini göster
  console.log('E-posta Bilgileri:');
  console.log(`From: ${emailOptions.from}`);
  console.log(`To: ${emailOptions.to}`);
  console.log(`Subject: ${emailOptions.subject}`);
  console.log('='.repeat(50));
  
  try {
    // SMTP yapılandırması
    const transporter = nodemailer.createTransport(exchangeConfig);
    
    console.log('E-posta gönderiliyor...');
    
    // E-postayı gönder
    const info = await transporter.sendMail(emailOptions);
    
    console.log('E-posta başarıyla gönderildi!');
    console.log(`Mesaj ID: ${info.messageId}`);
    
    return info;
  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    throw error;
  }
}

// Scripti çalıştır
sendEmail()
  .then(() => console.log('İşlem tamamlandı.'))
  .catch(error => {
    console.error('Beklenmeyen hata:', error);
    process.exit(1);
  });
```

### 2. Exchange Server Bağlantı Testi

`scripts/test-exchange-connection.js` dosyasını oluşturun:

```javascript
/**
 * Exchange Server 2019 bağlantısını test etmek için script
 * 
 * Kullanım:
 * node scripts/test-exchange-connection.js
 */

const nodemailer = require('nodemailer');

// Exchange Server ayarları
const exchangeConfig = {
  host: '172.41.41.14',  // Exchange Server adresi
  port: 25,              // SMTP port
  secure: false,         // TLS kullanımı (25 portu için false)
  auth: null,            // Kimlik doğrulama olmadan
  tls: {
    rejectUnauthorized: false  // Sertifika doğrulama sorunları için
  },
  debug: true  // Debug modunu etkinleştir
};

async function testExchangeConnection() {
  console.log('Exchange Server Bağlantı Testi');
  console.log('='.repeat(50));
  
  // Exchange ayarlarını göster
  console.log('Exchange Server Ayarları:');
  console.log(`Host: ${exchangeConfig.host}`);
  console.log(`Port: ${exchangeConfig.port}`);
  console.log(`Secure: ${exchangeConfig.secure ? 'Evet' : 'Hayır'}`);
  console.log(`Auth: ${exchangeConfig.auth ? 'Evet' : 'Hayır'}`);
  console.log('='.repeat(50));
  
  try {
    // SMTP yapılandırması
    const transporter = nodemailer.createTransport(exchangeConfig);
    
    console.log('Exchange Server\'a bağlanılıyor...');
    
    // SMTP bağlantısını doğrula
    const verification = await transporter.verify();
    console.log('Exchange Server bağlantısı başarılı!');
    console.log(`Sunucu yanıtı: ${verification}`);
    
    return verification;
  } catch (error) {
    console.error('Exchange Server bağlantı hatası:', error);
    throw error;
  }
}

// Scripti çalıştır
testExchangeConnection().catch(error => {
  console.error('Beklenmeyen hata:', error);
  process.exit(1);
});
```

## Uygulama Entegrasyonu

### 1. Admin Şifresi Oluşturma Scriptini Güncelleme

`scripts/create-admin.js` dosyasını güncelleyin:

```javascript
// E-posta modülünü içe aktar
const { sendAdminCredentials } = require('../src/utils/email');

// Admin şifresi oluşturma veya güncelleme işleminden sonra
// Admin bilgilerini e-posta ile gönder
try {
  await sendAdminCredentials(adminEmail, password);
  console.log('Admin bilgileri e-posta ile gönderildi.');
} catch (error) {
  console.error('E-posta gönderme hatası:', error.message);
}
```

### 2. Çevre Değişkenlerini Yapılandırma

`.env.docker` dosyasını güncelleyin:

```
# E-posta Ayarları
MAIL_FROM=noskay@kentkonut.com.tr
```

### 3. Diğer E-posta Bildirimleri

Uygulamanızda diğer e-posta bildirimleri için `sendEmail` fonksiyonunu kullanabilirsiniz:

```javascript
const { sendEmail } = require('../src/utils/email');

// Bildirim e-postası gönderme
await sendEmail(
  'alici@kentkonut.com.tr',
  'Bildirim: Yeni Bakım Talebi',
  'Yeni bir bakım talebi oluşturuldu.',
  '<h1>Yeni Bakım Talebi</h1><p>Yeni bir bakım talebi oluşturuldu.</p>'
);
```

## Sorun Giderme

### 1. Bağlantı Hataları

**Sorun**: "Connection refused" veya "Cannot connect to host"

**Çözüm**:
- Exchange Server'ın çalıştığından emin olun
- IP adresinin doğru olduğunu kontrol edin
- Port numarasının doğru olduğunu kontrol edin
- Firewall ayarlarını kontrol edin

### 2. Kimlik Doğrulama Hataları

**Sorun**: "Authentication unsuccessful" veya "Invalid login"

**Çözüm**:
- Exchange Server'ın anonim erişime izin verdiğinden emin olun
- Relay izinlerini kontrol edin
- IP adres kısıtlamalarını kontrol edin

### 3. TLS/SSL Hataları

**Sorun**: "Self signed certificate" veya "Certificate verification failed"

**Çözüm**:
- `tls: { rejectUnauthorized: false }` seçeneğini ekleyin
- Doğru port numarasını kullandığınızdan emin olun (25 veya 587)

### 4. E-posta Gönderim Hataları

**Sorun**: "Sender address rejected" veya "Recipient address rejected"

**Çözüm**:
- Gönderen e-posta adresinin geçerli olduğunu kontrol edin
- Alıcı e-posta adresinin geçerli olduğunu kontrol edin
- Exchange Server'ın relay izinlerini kontrol edin

---

Bu rehber, Bakım Onarım Uygulaması'nın Exchange Server 2019 ile entegrasyonunu ve e-posta gönderimini yapılandırmayı açıklamaktadır. Sorularınız veya sorunlarınız için lütfen iletişime geçin.
