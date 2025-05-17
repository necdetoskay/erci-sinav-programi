import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // Sadece geliştirme ortamında test maili gönder
    if (process.env.NODE_ENV === 'development' && process.env.SEND_TEST_EMAIL === 'true') {
      // Anonim SMTP yapılandırması kullan
      const exchangeConfig = {
        host: '172.41.41.14',  // Exchange Server adresi
        port: 25,              // SMTP port
        secure: false,         // TLS kullanımı (25 portu için false)
        auth: null,            // Kimlik doğrulama olmadan
        tls: {
          rejectUnauthorized: false  // Sertifika doğrulama sorunları için
        }
      };

      console.log('Using Exchange Server config:', exchangeConfig);

      // Transporter oluştur
      const transporter = nodemailer.createTransport(exchangeConfig);

      // Test e-postası gönder
      const info = await transporter.sendMail({
        from: 'noskay@kentkonut.com.tr',
        to: "noskay@kentkonut.com.tr",
        subject: "Kent Konut Sınav Portalı - Test E-postası",
        text: "Bu bir test e-postasıdır",
        html: "<b>Bu bir test e-postasıdır</b>",
      });

      console.log('Message sent:', info.messageId);

      return NextResponse.json({
        success: true,
        message: 'Test email sent',
        messageId: info.messageId
      });
    } else {
      console.log('Test email sending is disabled in this environment');
      return NextResponse.json({
        success: true,
        message: 'Test email sending is disabled in this environment'
      });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
