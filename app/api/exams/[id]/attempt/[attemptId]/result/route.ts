import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: Sınav sonucunu getir
export async function GET(
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
        exam: {
          select: {
            id: true,
            title: true,
            description: true,
            questions: {
              select: {
                id: true,
                question_text: true,
                options: true,
                correct_answer: true,
                explanation: true,
              },
            },
          },
        },
        attemptAnswers: {
          select: {
            questionId: true,
            selectedAnswer: true,
            isCorrect: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Exam attempt not found" },
        { status: 404 }
      );
    }

    // Cevapları hazırla
    const answers: Record<string, any> = {};

    // Tüm sorular için cevapları hazırla
    for (const question of attempt.exam.questions) {
      const answer = attempt.attemptAnswers.find(a => a.questionId === question.id);

      answers[question.id] = {
        questionText: question.question_text,
        selectedAnswer: answer?.selectedAnswer || "",
        correctAnswer: question.correct_answer,
        isCorrect: answer?.isCorrect || false,
        explanation: question.explanation,
      };
    }

    // Sonuç verilerini hazırla
    const result = {
      score: attempt.score || 0,
      correctAnswers: attempt.attemptAnswers.filter(a => a.isCorrect).length,
      totalQuestions: attempt.exam.questions.length,
      examTitle: attempt.exam.title,
      examDescription: attempt.exam.description,
      participantName: attempt.participantName,
      participantEmail: attempt.participantEmail,
      startTime: attempt.startTime,
      endTime: attempt.endTime || new Date(),
      answers: answers,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching exam result:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
