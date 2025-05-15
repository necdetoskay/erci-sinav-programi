// E-posta gönderim testi için script
const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getSettings() {
  try {
    // Tüm ayarları getir
    const allSettings = await prisma.setting.findMany();
    
    // Ayarları bir objeye dönüştür
    const settings = allSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {};
  }
}

async function createTransporter(settings) {
  console.log('Creating email transporter with settings:', {
    SMTP_HOST: settings.SMTP_HOST,
    SMTP_PORT: settings.SMTP_PORT,
    SMTP_SECURE: settings.SMTP_SECURE,
    SMTP_AUTH_ENABLED: settings.SMTP_AUTH_ENABLED,
    EMAIL_FROM: settings.EMAIL_FROM,
  });
  
  const config = {
    host: settings.SMTP_HOST,
    port: Number(settings.SMTP_PORT || '25'),
    secure: settings.SMTP_SECURE === 'true',
    tls: {
      rejectUnauthorized: settings.TLS_REJECT_UNAUTHORIZED !== 'false',
    }
  };
  
  // Kimlik doğrulama kullanılacaksa ekle
  if (settings.SMTP_AUTH_ENABLED === 'true' && settings.SMTP_USER && settings.SMTP_PASS) {
    config.auth = {
      user: settings.SMTP_USER,
      pass: settings.SMTP_PASS,
    };
  }
  
  return nodemailer.createTransport(config);
}

async function sendTestEmail() {
  try {
    console.log('Fetching email settings...');
    const settings = await getSettings();
    
    if (!settings.SMTP_HOST || !settings.EMAIL_FROM) {
      console.error('Missing required email settings (SMTP_HOST or EMAIL_FROM)');
      return;
    }
    
    const transporter = await createTransporter(settings);
    
    // Test alıcı e-posta adresi
    const testRecipient = process.argv[2] || settings.EMAIL_FROM;
    
    console.log(`Sending test email to ${testRecipient} from ${settings.EMAIL_FROM}`);
    
    const info = await transporter.sendMail({
      from: settings.EMAIL_FROM,
      to: testRecipient,
      subject: 'Erci Sınav Programı - Test E-postası',
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Erci Sınav Programı</h2>
            </div>
            <div class="content">
              <h3>Test E-postası</h3>
              <p>Bu bir test e-postasıdır. E-posta ayarlarınızın doğru çalıştığını doğrulamak için gönderilmiştir.</p>
              <p>Gönderen: ${settings.EMAIL_FROM}</p>
              <p>Alıcı: ${testRecipient}</p>
              <p>Tarih: ${new Date().toLocaleString('tr-TR')}</p>
            </div>
            <div class="footer">
              <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log('Email sent successfully:', info.messageId);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error sending test email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Scripti çalıştır
sendTestEmail();
