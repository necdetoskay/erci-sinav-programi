import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Sınav kodunu doğrula
export async function POST(req: NextRequest) {
  try {
    // Oturum kontrolünü kaldırdık - sınav kodunu doğrulamak için oturum gerekmez
    // Kullanıcı sınava başlamak istediğinde oturum kontrolü yapılacak

    // Request body'den sınav kodunu al
    const { accessCode } = await req.json();

    if (!accessCode) {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    console.log("API: Doğrulanacak sınav kodu:", accessCode);

    // Sınav kodunu temizle (boşluk, tire vb. karakterleri kaldır)
    const cleanedAccessCode = accessCode.replace(/[\s-]/g, '');
    console.log("API: Temizlenmiş sınav kodu:", cleanedAccessCode);

    // Tüm sınavları getir ve kod karşılaştırmasını manuel yapalım
    const allActiveExams = await prisma.exam.findMany({
      where: {
        status: "published", // Sadece yayındaki sınavları kontrol et
      },
      select: {
        id: true,
        title: true,
        duration_minutes: true,
        access_code: true,
      },
    });

    console.log("API: Tüm yayındaki sınavlar:", allActiveExams);

    // Sınav kodlarını karşılaştır
    let exam = null;
    for (const activeExam of allActiveExams) {
      if (!activeExam.access_code) continue;

      const dbCode = activeExam.access_code;
      const cleanedDbCode = dbCode.replace(/[\s-]/g, '');

      console.log(`API: Karşılaştırma - Girilen: ${cleanedAccessCode}, DB: ${dbCode}, Temizlenmiş DB: ${cleanedDbCode}`);

      if (cleanedAccessCode === cleanedDbCode || cleanedAccessCode === dbCode || accessCode === dbCode) {
        exam = activeExam;
        console.log("API: Eşleşme bulundu:", exam);
        break;
      }
    }

    console.log("API: Bulunan sınav:", exam);

    if (!exam) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 404 }
      );
    }

    // Sınav bilgilerini döndür
    return NextResponse.json({
      examId: exam.id,
      title: exam.title,
      duration_minutes: exam.duration_minutes,
    });
  } catch (error) {
    console.error("Error validating exam code:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
