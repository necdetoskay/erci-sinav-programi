import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = await request.json();

    // Create a transporter using the provided settings
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_PORT == 465, // Assuming secure is true for port 465, false otherwise
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates for testing
      },
    });

    // Send a test email
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: EMAIL_FROM, // Sending test email to the sender address
      subject: 'Test Email from Exam Program Settings',
      html: '<p>This is a test email sent from the exam program settings page.</p>',
    });

    return NextResponse.json({ message: 'Test email sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json({ message: 'Error sending test email', error: error.message }, { status: 500 });
  }
}
