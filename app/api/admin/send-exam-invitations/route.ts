import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    // Oturum kontrolü
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sadece ADMIN ve SUPERADMIN rollerine izin ver
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // İstek gövdesini al
    const body = await req.json();
    const { examId, users, subject, body: emailBody } = body;

    if (!examId || !users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Sınavı kontrol et
    const exam = await db.exam.findUnique({
      where: { id: parseInt(examId) },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Her kullanıcıya e-posta gönder
    console.log("E-posta gönderiliyor...");

    // Promise.all ile tüm e-postaları gönder
    const results = await Promise.all(
      users.map(async (user: { name: string; email: string }) => {
        try {
          const emailText = emailBody ||
            `Sayın ${user.name},\n\n${exam.title} sınavına katılmanız için davet edildiniz.\n\nSınav Kodu: ${exam.access_code}\n\nSınava giriş yapmak için aşağıdaki linki kullanabilirsiniz:\n${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/exam/enter-code\n\nSaygılarımızla,\nKent Konut A.Ş.`;

          const emailSubject = subject || `${exam.title} - Sınav Davetiyesi`;

          console.log(`E-posta gönderiliyor: ${user.email}`);

          // Test email sayfasındaki ayarları kullan
          console.log("Test email sayfasındaki ayarlar kullanılıyor...");

          // Transporter oluştur
          const transporter = nodemailer.createTransport({
            host: "172.41.41.14", // Sabit IP adresi
            port: 25, // Sabit port
            secure: false, // SSL/TLS kapalı
            auth: null, // Kimlik doğrulama kullanma
            tls: {
              rejectUnauthorized: false // TLS sertifika doğrulaması kapalı
            }
          });

          // E-posta gönder
          const info = await transporter.sendMail({
            from: "noskay@kentkonut.com.tr", // Sabit gönderen adresi
            to: user.email,
            subject: emailSubject,
            text: emailText,
            html: emailText.replace(/\n/g, "<br>")
          });

          console.log(`E-posta başarıyla gönderildi: ${user.email}, messageId: ${info.messageId}`);

          return {
            email: user.email,
            success: true,
            messageId: info.messageId,
            testMode: false
          };
        } catch (error) {
          console.error(`E-posta gönderilirken hata: ${user.email}:`, error);
          return {
            email: user.email,
            success: false,
            error: error.message || "Bilinmeyen hata"
          };
        }
      })
    );

    // Başarılı ve başarısız gönderimler
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const testMode = false; // Artık test modu kullanmıyoruz

    return NextResponse.json({
      message: `${successful} e-posta başarıyla gönderildi, ${failed} e-posta gönderilemedi.`,
      results,
      testMode
    });
  } catch (error) {
    console.error("Error sending exam invitations:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
