import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Sınav denemesini tamamla
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; attemptId: string } }
) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.id);
    const attemptId = params.attemptId;

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    // Sınav denemesini getir
    const attempt = await prisma.examAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        attemptAnswers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Exam attempt not found" },
        { status: 404 }
      );
    }

    // Sınavı getir
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
      include: {
        questions: true,
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Doğru cevap sayısını hesapla
    const correctAnswers = attempt.attemptAnswers.filter(
      (answer) => answer.isCorrect
    ).length;

    // Toplam soru sayısı
    const totalQuestions = exam.questions.length;

    // Skoru hesapla (0-1 arasında)
    const score = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;

    // Sınav denemesini tamamla
    const updatedAttempt = await prisma.examAttempt.update({
      where: {
        id: attemptId,
      },
      data: {
        status: "SUBMITTED",
        endTime: new Date(),
        score: score,
      },
    });

    return NextResponse.json({
      message: "Exam attempt submitted successfully",
      score: score,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
    });
  } catch (error) {
    console.error("Error submitting exam attempt:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
