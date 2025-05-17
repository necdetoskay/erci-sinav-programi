// Doğrulama e-postası gönderim testi için script
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

async function sendVerificationEmail(to, token) {
  try {
    console.log('Fetching email settings...');
    const settings = await getSettings();

    if (!settings.SMTP_HOST || !settings.EMAIL_FROM) {
      console.error('Missing required email settings (SMTP_HOST or EMAIL_FROM)');
      return;
    }

    // Doğrulama URL'i oluştur
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;

    console.log('==== VERIFICATION LINK ====');
    console.log(verificationUrl);
    console.log('==========================');

    // Transporter oluştur
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

    const transporter = nodemailer.createTransport(config);

    console.log(`Sending verification email to ${to} from ${settings.EMAIL_FROM}`);

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
          .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Erci Sınav Programı</h2>
          </div>
          <div class="content">
            <h3>Hesabınızı Onaylayın</h3>
            <p>Merhaba,</p>
            <p>Erci Sınav Programı'na kaydolduğunuz için teşekkür ederiz. Hesabınızı etkinleştirmek için lütfen aşağıdaki bağlantıya tıklayın:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Hesabımı Onayla</a>
            </p>
            <p>Veya aşağıdaki bağlantıyı tarayıcınıza kopyalayın:</p>
            <p>${verificationUrl}</p>
            <p>Bu bağlantı 24 saat boyunca geçerlidir.</p>
          </div>
          <div class="footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: settings.EMAIL_FROM,
      to,
      subject: 'Erci Sınav Programı - Hesap Onayı',
      html,
    });

    console.log('Email sent successfully:', info.messageId);
    console.log('Verification email sent successfully!');
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Komut satırı argümanlarını al
const email = process.argv[2];
const token = process.argv[3] || 'test-token-' + Math.random().toString(36).substring(2, 15);

if (!email) {
  console.error('Usage: node scripts/send-verification-email.js <email> [token]');
  process.exit(1);
}

// Scripti çalıştır
sendVerificationEmail(email, token);
