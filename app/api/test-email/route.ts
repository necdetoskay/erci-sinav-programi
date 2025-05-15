import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // Ethereal test hesabı oluştur
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Test account created:', {
      user: testAccount.user,
      pass: testAccount.pass,
      smtp: {
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure
      }
    });
    
    // Test transporter oluştur
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    // Test e-postası gönder
    const info = await transporter.sendMail({
      from: '"Test Gönderici" <test@example.com>',
      to: "test@example.com",
      subject: "Test E-postası",
      text: "Bu bir test e-postasıdır",
      html: "<b>Bu bir test e-postasıdır</b>",
    });
    
    console.log('Message sent:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent',
      previewUrl: nodemailer.getTestMessageUrl(info),
      testAccount: {
        user: testAccount.user,
        pass: testAccount.pass,
        smtp: {
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure
        }
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
