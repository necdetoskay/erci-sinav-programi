/**
 * Exchange Server 2019 üzerinden anonim e-posta gönderme testi
 * 
 * Bu script, kimlik doğrulama olmadan Exchange Server üzerinden
 * test e-postası gönderir (rehberde belirtildiği gibi).
 * 
 * Kullanım:
 * node scripts/send-test-email-anonymous.js
 */

const nodemailer = require('nodemailer');

// E-posta bilgileri
const FROM_EMAIL = 'noskay@kentkonut.com.tr';
const TO_EMAIL = 'noskay@kentkonut.com.tr';
const SUBJECT = 'Exchange Server Anonim Test E-postası';

// Exchange Server ayarları (anonim)
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
  from: FROM_EMAIL,
  to: TO_EMAIL,
  subject: SUBJECT,
  text: 'Bu bir test e-postasıdır. Exchange Server 2019 üzerinden anonim olarak gönderilmiştir.',
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
        <h2>Erci Sınav Programı</h2>
      </div>
      <div class="content">
        <h3>Exchange Server Anonim Test E-postası</h3>
        <div class="message">
          <p>Bu bir test e-postasıdır. Exchange Server 2019 üzerinden anonim olarak gönderilmiştir.</p>
          <p>Gönderen: ${FROM_EMAIL}</p>
          <p>Alıcı: ${TO_EMAIL}</p>
          <p>Tarih: ${new Date().toLocaleString('tr-TR')}</p>
        </div>
      </div>
      <div class="footer">
        <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
      </div>
    </div>
  </body>
  </html>
  `
};

async function sendEmail() {
  console.log('Exchange Server Anonim E-posta Gönderme Testi');
  console.log('='.repeat(50));
  
  // Exchange ayarlarını göster
  console.log('Exchange Server Ayarları:');
  console.log(`Host: ${exchangeConfig.host}`);
  console.log(`Port: ${exchangeConfig.port}`);
  console.log(`Secure: ${exchangeConfig.secure ? 'Evet' : 'Hayır'}`);
  console.log(`Auth: Anonim (kimlik doğrulama yok)`);
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
