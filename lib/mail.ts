import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

// Doğrudan bir Prisma istemcisi oluştur
const prisma = new PrismaClient();

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: MailOptions) {
  try {
    console.log("E-posta gönderme işlemi başlatılıyor...");

    // Anonim SMTP yapılandırması kullan
    const mailConfig = {
      host: "172.41.41.14",  // Exchange Server adresi
      port: 25,              // SMTP port
      secure: false,         // TLS kullanımı (25 portu için false)
      from: "noskay@kentkonut.com.tr"
    };

    console.log("Mail ayarları:", mailConfig);

    // Transporter oluştur
    const transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: null,            // Kimlik doğrulama olmadan
      tls: {
        rejectUnauthorized: false  // Sertifika doğrulama sorunları için
      }
    });

    // E-posta gönder
    const info = await transporter.sendMail({
      from: mailConfig.from,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br>"),
    });

    console.log("E-posta başarıyla gönderildi:", info.messageId);
    return info;
  } catch (error) {
    console.error("E-posta gönderme hatası:", error);
    throw new Error("E-posta gönderilirken bir hata oluştu: " + error.message);
  } finally {
    // Prisma bağlantısını kapat
    await prisma.$disconnect();
  }
}
