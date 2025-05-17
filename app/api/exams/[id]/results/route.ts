import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic'; // Force dynamic rendering

// GET: Belirli bir sınavın sonuçlarını getir
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rol kontrolü (ADMIN, USER ve SUPERADMIN rollerine izin ver)
    if (session.user.role !== "ADMIN" && session.user.role !== "USER" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const examId = parseInt(params.id);

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    // Sınav detaylarını getir
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
      include: {
        questions: {
          select: {
            id: true,
            question_text: true,
            attemptAnswers: {
              select: {
                isCorrect: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Sınav katılımcılarını getir
    const participants = await prisma.examAttempt.findMany({
      where: {
        examId,
      },
      orderBy: {
        score: {
          sort: "desc",
          nulls: "last",
        },
      },
      select: {
        id: true,
        participantName: true,
        participantEmail: true,
        score: true,
        startTime: true,
        endTime: true,
        status: true,
        attemptAnswers: {
          select: {
            isCorrect: true,
          },
        },
      },
    });

    // İstatistikleri hesapla
    const participantCount = participants.length;

    // Ortalama, en yüksek ve en düşük puanları hesapla
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 100;

    if (participantCount > 0) {
      const completedParticipants = participants.filter(
        (p: any) => p.score !== null && (p.status === "SUBMITTED" || p.status === "TIMED_OUT" || p.status === "GRADED")
      );

      if (completedParticipants.length > 0) {
        const totalScore = completedParticipants.reduce(
          (sum: number, p: any) => sum + (p.score || 0),
          0
        );

        averageScore = (totalScore / completedParticipants.length) * 100;

        highestScore = Math.max(...completedParticipants.map((p: any) => (p.score || 0) * 100));
        lowestScore = Math.min(...completedParticipants.map((p: any) => (p.score || 0) * 100));
      }
    }

    // Ortalama tamamlama süresini hesapla (dakika cinsinden)
    let averageCompletionTime = 0;
    const completedWithEndTime = participants.filter(
      (p: any) => p.endTime !== null && p.startTime !== null
    );

    if (completedWithEndTime.length > 0) {
      const totalMinutes = completedWithEndTime.reduce((sum: number, p: any) => {
        const startTime = new Date(p.startTime).getTime();
        const endTime = new Date(p.endTime!).getTime();
        const minutes = (endTime - startTime) / (1000 * 60);
        return sum + minutes;
      }, 0);

      averageCompletionTime = Math.round(totalMinutes / completedWithEndTime.length);
    }

    // En zor ve en kolay soruları bul
    let hardestQuestion = null;
    let easiestQuestion = null;

    if (exam.questions.length > 0 && participantCount > 0) {
      const questionStats = exam.questions.map((question: any) => {
        const totalAnswers = question.attemptAnswers.length;

        if (totalAnswers === 0) return null;

        const correctAnswers = question.attemptAnswers.filter(
          (answer: { isCorrect: boolean }) => answer.isCorrect
        ).length;

        const incorrectAnswers = totalAnswers - correctAnswers;

        return {
          id: question.id,
          question_text: question.question_text,
          correctAnswerRate: correctAnswers / totalAnswers,
          incorrectAnswerRate: incorrectAnswers / totalAnswers,
        };
      }).filter((stat: any): stat is NonNullable<typeof stat> => stat !== null);

      if (questionStats.length > 0) {
        // En zor soru (en yüksek yanlış oranı)
        hardestQuestion = questionStats.reduce((hardest: any, current: any) => {
          if (!hardest) return current;
          return current.incorrectAnswerRate > hardest.incorrectAnswerRate
            ? current
            : hardest;
        }, questionStats[0]);

        // En kolay soru (en yüksek doğru oranı)
        easiestQuestion = questionStats.reduce((easiest: any, current: any) => {
          if (!easiest) return current;
          return current.correctAnswerRate > easiest.correctAnswerRate
            ? current
            : easiest;
        }, questionStats[0]);
      }
    }

    // Katılımcı verilerini formatla
    const formattedParticipants = participants.map((participant: any) => {
      const correctAnswers = participant.attemptAnswers.filter(
        (answer: { isCorrect: boolean }) => answer.isCorrect
      ).length;

      const incorrectAnswers = participant.attemptAnswers.length - correctAnswers;

      let completionTime = null;
      if (participant.startTime && participant.endTime) {
        const startTime = new Date(participant.startTime).getTime();
        const endTime = new Date(participant.endTime).getTime();
        completionTime = Math.round((endTime - startTime) / (1000 * 60)); // dakika cinsinden
      }

      return {
        id: participant.id,
        participantName: participant.participantName,
        participantEmail: participant.participantEmail,
        score: (participant.score || 0) * 100,
        correctAnswers,
        incorrectAnswers,
        startTime: participant.startTime,
        endTime: participant.endTime,
        completionTime,
        status: participant.status,
      };
    });

    // Yanıt verilerini hazırla
    const response = {
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        status: exam.status,
        created_at: exam.created_at,
        duration_minutes: exam.duration_minutes,
        question_count: exam.questions.length,
      },
      statistics: {
        participantCount,
        averageScore,
        highestScore,
        lowestScore,
        averageCompletionTime,
        hardestQuestion,
        easiestQuestion,
      },
      participants: formattedParticipants,
    };

    // Önbellek kontrolü için başlıklar ekleyin
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
