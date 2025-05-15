import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getServerSession } from '@/lib/session';
import { updateSettings } from '@/lib/settings';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE,
      SMTP_USER,
      SMTP_PASS,
      EMAIL_FROM,
      TLS_REJECT_UNAUTHORIZED,
      RECIPIENT_EMAIL, // Alıcı e-posta adresi
      SMTP_AUTH_ENABLED, // Kimlik doğrulama kullanılıp kullanılmayacağı
      SAVE_SETTINGS, // Ayarları kaydetme seçeneği
      USER_ID // Hangi kullanıcı için ayarları kaydedeceğimizi belirten ID
    } = await request.json();

    if (!SMTP_HOST) {
      return NextResponse.json({ message: 'SMTP host is required' }, { status: 400 });
    }

    if (!SMTP_PORT) {
      return NextResponse.json({ message: 'SMTP port is required' }, { status: 400 });
    }

    if (!EMAIL_FROM) {
      return NextResponse.json({ message: 'Sender email is required' }, { status: 400 });
    }

    // Create transporter config
    const transportConfig: any = {
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === true || SMTP_PORT == 465, // Use provided value or assume based on port
      tls: {
        rejectUnauthorized: TLS_REJECT_UNAUTHORIZED !== false, // Default to true unless explicitly set to false
      },
    };

    // Only add auth if auth is enabled and credentials are provided
    if (SMTP_AUTH_ENABLED === true && SMTP_USER && SMTP_PASS) {
      transportConfig.auth = {
        user: SMTP_USER,
        pass: SMTP_PASS,
      };
    }

    // Create a transporter using the provided settings
    const transporter = nodemailer.createTransport(transportConfig);

    // İstek verilerini al
    const requestData = await request.json();

    // Özel e-posta içeriği varsa kullan
    const CUSTOM_SUBJECT = requestData.CUSTOM_SUBJECT;
    const CUSTOM_TEXT = requestData.CUSTOM_TEXT;
    const CUSTOM_HTML = requestData.CUSTOM_HTML;

    // Send a test email
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: RECIPIENT_EMAIL || EMAIL_FROM, // Use recipient email if provided, otherwise use sender address
      subject: CUSTOM_SUBJECT || 'Kentkonut Sınav Portalı - Test E-postası',
      text: CUSTOM_TEXT || 'Bu bir test e-postasıdır.',
      html: CUSTOM_HTML || `
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
              <h2>Kentkonut Sınav Portalı</h2>
            </div>
            <div class="content">
              <h3>Test E-postası</h3>
              <div class="message">
                <p>Bu bir test e-postasıdır. E-posta ayarlarınızın doğru çalıştığını doğrulamak için gönderilmiştir.</p>
                <p>Gönderen: ${EMAIL_FROM}</p>
                <p>Alıcı: ${RECIPIENT_EMAIL || EMAIL_FROM}</p>
                <p>Tarih: ${new Date().toLocaleString('tr-TR')}</p>
              </div>
              <p>E-posta ayarlarınız başarıyla yapılandırılmıştır.</p>
            </div>
            <div class="footer">
              <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Ayarları kaydet (eğer isteniyorsa)
    if (SAVE_SETTINGS) {
      const settingsToSave = {
        SMTP_HOST,
        SMTP_PORT: SMTP_PORT.toString(),
        SMTP_SECURE: SMTP_SECURE ? 'true' : 'false',
        SMTP_USER,
        SMTP_PASS,
        EMAIL_FROM,
        TLS_REJECT_UNAUTHORIZED: TLS_REJECT_UNAUTHORIZED ? 'true' : 'false',
        SMTP_AUTH_ENABLED: SMTP_AUTH_ENABLED ? 'true' : 'false'
      };

      // Eğer USER_ID belirtilmişse, o kullanıcının ayarlarını güncelle
      if (USER_ID) {
        console.log(`Saving test email settings for user ${USER_ID}`);
        await updateSettings(settingsToSave, USER_ID);
      } else {
        // Aksi takdirde global ayarları güncelle
        console.log(`Saving test email settings globally`);
        await updateSettings(settingsToSave);
      }
    }

    return NextResponse.json({ message: 'Test email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ message: 'Error sending test email', error: error.message }, { status: 500 });
  }
}
