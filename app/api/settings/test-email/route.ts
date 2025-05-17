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

    // İstek verilerini al (sadece bir kez)
    const requestData = await request.json();

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
      USER_ID, // Hangi kullanıcı için ayarları kaydedeceğimizi belirten ID
      CUSTOM_SUBJECT,
      CUSTOM_TEXT,
      CUSTOM_HTML
    } = requestData;

    console.log('Test email request data:', {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_SECURE: String(SMTP_SECURE),
      EMAIL_FROM,
      TLS_REJECT_UNAUTHORIZED: String(TLS_REJECT_UNAUTHORIZED)
    });

    if (!SMTP_HOST) {
      return NextResponse.json({ message: 'SMTP host is required' }, { status: 400 });
    }

    if (!SMTP_PORT) {
      return NextResponse.json({ message: 'SMTP port is required' }, { status: 400 });
    }

    if (!EMAIL_FROM) {
      return NextResponse.json({ message: 'Sender email is required' }, { status: 400 });
    }

    // Anonim SMTP yapılandırması kullan
    const transportConfig: any = {
      host: SMTP_HOST || '172.41.41.14',
      port: Number(SMTP_PORT || '25'),
      secure: SMTP_SECURE === true || SMTP_SECURE === 'true',
      auth: null, // Kimlik doğrulama kullanma
      tls: {
        rejectUnauthorized: TLS_REJECT_UNAUTHORIZED === true || TLS_REJECT_UNAUTHORIZED === 'true'
      }
    };

    console.log('Using transport config:', transportConfig);

    // Create a transporter using the provided settings
    const transporter = nodemailer.createTransport(transportConfig);

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

    // Daha detaylı hata mesajı
    let errorMessage = error.message || 'Unknown error';

    // Nodemailer hata detaylarını kontrol et
    if (error.code) {
      errorMessage += ` (Code: ${error.code})`;
    }

    if (error.command) {
      errorMessage += ` (Command: ${error.command})`;
    }

    // SMTP sunucu yanıtını kontrol et
    if (error.response) {
      errorMessage += ` - Server response: ${error.response}`;
    }

    return NextResponse.json({
      message: 'Error sending test email',
      error: errorMessage,
      details: {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        stack: error.stack
      }
    }, { status: 500 });
  }
}
