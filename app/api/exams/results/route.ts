import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Tüm sınavların sonuçlarını getir
export async function GET(req: NextRequest) {
  console.log("[ExamsResultsAPI] API isteği alındı:", new Date().toISOString());
  const startTime = performance.now();

  try {
    console.log("[ExamsResultsAPI] Oturum bilgisi alınıyor...");
    const session = await getSession(req);
    console.log("[ExamsResultsAPI] Oturum bilgisi:", session ? `Kullanıcı: ${session.user.email}, Rol: ${session.user.role}` : "Oturum yok");

    // Oturum kontrolü
    if (!session) {
      console.error("[ExamsResultsAPI] Oturum bulunamadı, 401 Unauthorized dönülüyor");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rol kontrolü (ADMIN, USER ve SUPERADMIN rollerine izin ver)
    if (session.user.role !== "ADMIN" && session.user.role !== "USER" && session.user.role !== "SUPERADMIN") {
      console.error(`[ExamsResultsAPI] Yetkisiz rol: ${session.user.role}, 403 Forbidden dönülüyor`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log(`[ExamsResultsAPI] Yetkilendirme başarılı, kullanıcı: ${session.user.email}, rol: ${session.user.role}`);

    // Kullanıcı bazlı filtreleme için where koşulu
    const whereCondition = {
      createdById: session.user.id
    };

    // Admin ve SUPERADMIN kullanıcılar tüm sınavları görebilir
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN';
    const where = isAdmin ? {} : whereCondition;
    console.log(`[ExamsResultsAPI] Sorgu koşulu:`, where);

    console.log("[ExamsResultsAPI] Sınavlar veritabanından alınıyor...");
    // Kullanıcıya ait sınavları getir
    const exams = await prisma.exam.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        created_at: true,
        duration_minutes: true,
        createdById: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        // Sınava katılan kullanıcı sayısını hesapla
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    console.log(`[ExamsResultsAPI] ${exams.length} sınav bulundu`);

    // Sınav sonuçlarını getir
    const examIds = exams.map((exam: any) => exam.id);
    console.log(`[ExamsResultsAPI] Sınav ID'leri:`, examIds);

    console.log("[ExamsResultsAPI] Sınav puanları hesaplanıyor...");
    // Her sınav için ortalama puanı hesapla
    const examScores = await prisma.examAttempt.groupBy({
      by: ["examId"],
      where: {
        examId: {
          in: examIds,
        },
        score: {
          not: null,
        },
      },
      _avg: {
        score: true,
      },
    });

    console.log(`[ExamsResultsAPI] ${examScores.length} sınav için puan bilgisi bulundu`);
    console.log("[ExamsResultsAPI] Puan bilgileri:", examScores);

    console.log("[ExamsResultsAPI] Sınav verileri formatlanıyor...");
    // Sınav verilerini formatla
    const formattedExams = exams.map((exam: any) => {
      const scoreData = examScores.find((score: any) => score.examId === exam.id);

      const formattedExam = {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        status: exam.status,
        created_at: exam.created_at,
        duration_minutes: exam.duration_minutes,
        createdById: exam.createdById,
        createdBy: exam.createdBy,
        participantCount: exam._count.attempts,
        averageScore: scoreData?._avg.score ? scoreData._avg.score * 100 : null,
      };

      return formattedExam;
    });

    console.log(`[ExamsResultsAPI] ${formattedExams.length} sınav formatlandı`);

    const endTime = performance.now();
    console.log(`[ExamsResultsAPI] İşlem tamamlandı, süre: ${(endTime - startTime).toFixed(2)}ms`);

    return NextResponse.json(formattedExams);
  } catch (error) {
    console.error("[ExamsResultsAPI] Hata oluştu:", error);

    // Hata detaylarını log'a yaz
    if (error instanceof Error) {
      console.error("[ExamsResultsAPI] Hata mesajı:", error.message);
      console.error("[ExamsResultsAPI] Hata stack:", error.stack);
    }

    const endTime = performance.now();
    console.log(`[ExamsResultsAPI] Hata ile sonlandı, süre: ${(endTime - startTime).toFixed(2)}ms`);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
