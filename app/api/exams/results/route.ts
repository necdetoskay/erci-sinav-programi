import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Tüm sınavların sonuçlarını getir
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rol kontrolü (ADMIN ve USER rollerine izin ver)
    if (session.user.role !== "ADMIN" && session.user.role !== "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Tüm sınavları getir
    const exams = await prisma.exam.findMany({
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
        // Sınava katılan kullanıcı sayısını hesapla
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    // Sınav sonuçlarını getir
    const examIds = exams.map((exam: any) => exam.id);

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

    // Sınav verilerini formatla
    const formattedExams = exams.map((exam: any) => {
      const scoreData = examScores.find((score: any) => score.examId === exam.id);

      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        status: exam.status,
        created_at: exam.created_at,
        duration_minutes: exam.duration_minutes,
        participantCount: exam._count.attempts,
        averageScore: scoreData?._avg.score ? scoreData._avg.score * 100 : null,
      };
    });

    return NextResponse.json(formattedExams);
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
