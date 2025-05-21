import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";
import { getGlobalSettings } from "@/lib/settings";

export const dynamic = 'force-dynamic'; // Force dynamic rendering

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

    // Sınav durumunu kontrol et - taslak sınavlar için e-posta gönderimi engelle
    if (exam.status !== "active") { // "active" durumu, UI'da "Yayında" olarak gösterilir
      return NextResponse.json(
        { error: "Taslak durumdaki sınavlar için e-posta gönderilemez. Lütfen önce sınavı yayınlayın." },
        { status: 400 }
      );
    }

    // Global ayarları getir
    const globalSettings = await getGlobalSettings();
    const publicServerUrl = globalSettings.PUBLIC_SERVER_URL || process.env.PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    console.log("Dış erişim URL'si:", publicServerUrl);

    // Her kullanıcıya e-posta gönder
    console.log("E-posta gönderiliyor...");

    // Promise.all ile tüm e-postaları gönder
    const results = await Promise.all(
      users.map(async (user: { name: string; email: string }) => {
        try {
          // Varsayılan şablon - yer tutucularla
          let defaultTemplate = `Sayın {USER_NAME},\n\n{EXAM_TITLE} sınavına katılmanız için davet edildiniz.\n\nSınav Kodu: {EXAM_CODE}\n\nSınava giriş yapmak için aşağıdaki linki kullanabilirsiniz:\n{EXAM_LINK}\n\nSaygılarımızla,\nKent Konut A.Ş.`;

          // Gelen şablonda yer tutucuları değiştir
          let processedEmailBody = emailBody || defaultTemplate;

          // Düz metin versiyonu için yer tutucuları gerçek değerlerle değiştir
          const plainTextBody = processedEmailBody
            .replace(/\{EXAM_TITLE\}/g, exam.title)
            .replace(/\{EXAM_CODE\}/g, exam.access_code)
            .replace(/\{EXAM_LINK\}/g, `${publicServerUrl}/exam`)
            .replace(/\{USER_NAME\}/g, user.name);

          // HTML versiyonu için yer tutucuları kalın (bold) gerçek değerlerle değiştir
          const examLink = `${publicServerUrl}/exam`;
          let htmlBody = processedEmailBody
            .replace(/\{EXAM_TITLE\}/g, `<strong>${exam.title}</strong>`)
            .replace(/\{EXAM_CODE\}/g, `<strong>${exam.access_code}</strong>`)
            .replace(/\{EXAM_LINK\}/g, `<a href="${examLink}"><strong>${examLink}</strong></a>`)
            .replace(/\{USER_NAME\}/g, `<strong>${user.name}</strong>`);

          // Konu satırındaki yer tutucuları değiştir
          let processedSubject = subject || `{EXAM_TITLE} - Sınav Davetiyesi`;
          processedSubject = processedSubject.replace(/\{EXAM_TITLE\}/g, exam.title);

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

          // HTML içeriğini satır sonlarını <br> etiketlerine dönüştür
          htmlBody = htmlBody.replace(/\n/g, "<br>");

          // HTML içeriğini daha profesyonel bir şablona yerleştir
          htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .email-container {
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
    }
    .email-header {
      border-bottom: 2px solid #f0f0f0;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .email-footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #f0f0f0;
      font-size: 12px;
      color: #777;
    }
    strong {
      color: #0056b3;
    }
    a {
      color: #0056b3;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="https://kentkonut.com.tr/wp-content/uploads/2023/05/kent-konut-logo.png" alt="Kent Konut Logo" style="max-width: 150px;">
    </div>
    <div class="email-content">
      ${htmlBody}
    </div>
    <div class="email-footer">
      Bu e-posta Kent Konut A.Ş. Sınav Portalı tarafından otomatik olarak gönderilmiştir.
    </div>
  </div>
</body>
</html>
          `;

          // E-posta gönder
          const info = await transporter.sendMail({
            from: "noskay@kentkonut.com.tr", // Sabit gönderen adresi
            to: user.email,
            subject: processedSubject,
            text: plainTextBody, // Düz metin versiyonu
            html: htmlBody // HTML versiyonu (kalın değerlerle)
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
