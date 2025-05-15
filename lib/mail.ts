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

    // Sabit mail ayarları kullan
    const mailConfig = {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      username: "kentkonut.sinav@gmail.com",
      password: "Kent.Konut.2024",
      from: "kentkonut.sinav@gmail.com"
    };

    console.log("Mail ayarları:", mailConfig);

    // Transporter oluştur
    const transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: {
        user: mailConfig.username,
        pass: mailConfig.password,
      },
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
