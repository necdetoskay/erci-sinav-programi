import nodemailer from 'nodemailer';
import { getSettings } from './settings';
import { getServerSession } from './session';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

// Transporter önbelleği
let cachedTransporter: any = null;
let cachedSettings: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 dakika

// Dinamik olarak ayarlardan transporter oluşturma
async function createTransporter(userId?: string) {
  const now = Date.now();

  // Önbellekteki transporter'ı kullan (eğer varsa ve süresi dolmadıysa)
  if (cachedTransporter && cachedSettings && (now - lastCacheTime < CACHE_TTL)) {
    console.log('Using cached email transporter');
    return cachedTransporter;
  }

  try {
    // Kullanıcı ID'si belirtilmişse, o kullanıcının ayarlarını al
    // Aksi takdirde global ayarları al
    const settings = userId ? await getSettings(userId) : await getSettings();

    console.log('Using email settings from database:', {
      SMTP_HOST: settings.SMTP_HOST,
      SMTP_PORT: settings.SMTP_PORT,
      SMTP_SECURE: settings.SMTP_SECURE,
      SMTP_AUTH_ENABLED: settings.SMTP_AUTH_ENABLED,
      EMAIL_FROM: settings.EMAIL_FROM,
    });

    // Anonim SMTP yapılandırması kullan
    const smtpHost = settings.SMTP_HOST || process.env.SMTP_HOST || '172.41.41.14';
    const emailFrom = settings.EMAIL_FROM || process.env.EMAIL_FROM || 'noskay@kentkonut.com.tr';

    console.log('Using SMTP host:', smtpHost);
    console.log('Using email from:', emailFrom);

    const config: any = {
      host: smtpHost,
      port: Number(settings.SMTP_PORT || process.env.SMTP_PORT || '25'),
      secure: false,
      auth: null, // Kimlik doğrulama kullanma
      tls: {
        rejectUnauthorized: false // TLS sertifika doğrulaması kapalı
      }
    };

    const transporter = nodemailer.createTransport(config);

    // Transporter'ı önbelleğe al
    cachedTransporter = transporter;
    cachedSettings = settings;
    lastCacheTime = now;

    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
}

export async function sendEmail({ to, subject, html }: SendEmailParams, userId?: string) {
  try {
    console.log(`Attempting to send email to ${to}`);
    const transporter = await createTransporter(userId);
    const settings = cachedSettings || await getSettings(userId);

    // Gönderen e-posta adresi
    const fromEmail = settings.EMAIL_FROM || process.env.EMAIL_FROM || 'noreply@kentkonut.com.tr';

    console.log(`Sending email to ${to} from ${fromEmail}`);
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Şifre sıfırlama e-postası gönderme
export async function sendPasswordResetEmail(to: string, token: string, name?: string) {
  try {
    console.log('Sending password reset email to:', to);

    // Şifre sıfırlama URL'i oluştur - PUBLIC_SERVER_URL değişkenini kullan
    const baseUrl = process.env.PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    console.log('Using base URL for password reset:', baseUrl);

    // Şifre sıfırlama bağlantısını her zaman konsola yazdır (geliştirme amaçlı)
    console.log('==== PASSWORD RESET LINK (FOR DEVELOPMENT) ====');
    console.log(resetUrl);
    console.log('===========================================');

    console.log('==== PASSWORD RESET LINK ====');
    console.log(resetUrl);
    console.log('==========================');

    // Oturum bilgisini almaya çalış
    let userId: string | undefined;
    try {
      const session = await getServerSession();
      userId = session?.user?.id;
    } catch (e) {
      console.warn('Failed to get session, using default settings:', e);
    }

    const transporter = await createTransporter(userId);
    const settings = cachedSettings || await getSettings(userId);

    // Gönderen e-posta adresi
    const fromEmail = settings.EMAIL_FROM || process.env.EMAIL_FROM || 'noreply@kentkonut.com.tr';

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
            <h2>Kentkonut Sınav Portalı</h2>
          </div>
          <div class="content">
            <h3>Şifre Sıfırlama</h3>
            <p>Merhaba ${name ? name : ''},</p>
            <p>Kentkonut Sınav Portalı hesabınız için şifre sıfırlama talebinde bulunuldu. Şifrenizi sıfırlamak için lütfen aşağıdaki bağlantıya tıklayın:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
            </p>
            <p>Veya aşağıdaki bağlantıyı tarayıcınıza kopyalayın:</p>
            <p>${resetUrl}</p>
            <p>Bu bağlantı 24 saat boyunca geçerlidir.</p>
            <p>Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          </div>
          <div class="footer">
            <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // E-posta gönderme işlemi
    console.log(`Sending password reset email to ${to} from ${fromEmail}`);
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject: 'Kentkonut Sınav Portalı - Şifre Sıfırlama',
      html,
    });

    console.log('Password reset email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);

    // Hata detaylarını logla
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
      if ('response' in error) {
        console.error('SMTP response:', (error as any).response);
      }
    }

    // Hatayı fırlatmıyoruz, böylece işlem devam edebilir
    // Ancak hatayı logluyoruz
    return false;
  }
}

// E-posta doğrulama e-postası gönderme
export async function sendVerificationEmail(to: string, token: string) {
  try {
    console.log('Sending verification email to:', to);

    // Doğrulama URL'i oluştur - PUBLIC_SERVER_URL değişkenini kullan
    const baseUrl = process.env.PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;

    console.log('Using base URL for verification:', baseUrl);

    // Doğrulama bağlantısını her zaman konsola yazdır (geliştirme amaçlı)
    console.log('==== VERIFICATION LINK (FOR DEVELOPMENT) ====');
    console.log(verificationUrl);
    console.log('===========================================');

    console.log('==== VERIFICATION LINK ====');
    console.log(verificationUrl);
    console.log('==========================');

    // Oturum bilgisini almaya çalış
    let userId: string | undefined;
    try {
      const session = await getServerSession();
      userId = session?.user?.id;
    } catch (e) {
      console.warn('Failed to get session, using default settings:', e);
    }

    const transporter = await createTransporter(userId);
    const settings = cachedSettings || await getSettings(userId);

    // Gönderen e-posta adresi
    const fromEmail = settings.EMAIL_FROM || process.env.EMAIL_FROM || 'noreply@kentkonut.com.tr';

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
            <h2>Kentkonut Sınav Portalı</h2>
          </div>
          <div class="content">
            <h3>Hesabınızı Onaylayın</h3>
            <p>Merhaba,</p>
            <p>Kentkonut Sınav Portalı'na kaydolduğunuz için teşekkür ederiz. Hesabınızı etkinleştirmek için lütfen aşağıdaki bağlantıya tıklayın:</p>
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

    // E-posta gönderme işlemi
    console.log(`Sending verification email to ${to} from ${fromEmail}`);
    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject: 'Kentkonut Sınav Portalı - Hesap Onayı',
      html,
    });

    console.log('Verification email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);

    // Hata detaylarını logla
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if ('code' in error) {
        console.error('Error code:', (error as any).code);
      }
      if ('response' in error) {
        console.error('SMTP response:', (error as any).response);
      }
    }

    // Hatayı fırlatmıyoruz, böylece kullanıcı kaydı tamamlanabilir
    // Ancak hatayı logluyoruz
    return false;
  }
}