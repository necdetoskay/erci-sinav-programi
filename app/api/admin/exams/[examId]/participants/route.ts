import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: Sınav katılımcılarını getir
export async function GET(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession();

    // Oturum kontrolü
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sadece ADMIN ve SUPERADMIN rollerine izin ver
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    // Sınavın varlığını kontrol et
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, createdById: true }
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Admin kullanıcıları sadece kendi oluşturdukları sınavları görebilir
    if (session.user.role === "ADMIN" && exam.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Sınav katılımcılarını getir
    const participants = await prisma.examAttempt.findMany({
      where: {
        examId,
      },
      select: {
        id: true,
        participantName: true,
        participantEmail: true,
        status: true,
        startTime: true,
        endTime: true,
        score: true,
        attemptAnswers: {
          select: {
            isCorrect: true,
          },
        },
      },
      orderBy: [
        { participantName: 'asc' },
        { startTime: 'desc' }
      ],
    });

    // Katılımcı verilerini işle
    const formattedParticipants = participants.map(participant => {
      // Doğru ve yanlış cevap sayılarını hesapla
      const correctAnswers = participant.attemptAnswers.filter(a => a.isCorrect).length;
      const wrongAnswers = participant.attemptAnswers.length - correctAnswers;
      
      // Puanı hesapla (0-100 arası)
      const score = participant.score !== null 
        ? Math.round(participant.score * 100) 
        : null;

      return {
        id: participant.id,
        name: participant.participantName,
        email: participant.participantEmail,
        status: participant.status,
        startTime: participant.startTime,
        endTime: participant.endTime,
        correctAnswers,
        wrongAnswers,
        score,
      };
    });

    return NextResponse.json(formattedParticipants);
  } catch (error) {
    console.error("Error fetching exam participants:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
