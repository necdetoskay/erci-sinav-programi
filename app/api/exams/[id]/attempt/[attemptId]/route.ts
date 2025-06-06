import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET: Sınav denemesi verilerini getir
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
      select: {
        id: true,
        examId: true,
        participantName: true,
        participantEmail: true,
        status: true,
        currentQuestionIndex: true,
        startTime: true,
        endTime: true,
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: "Exam attempt not found" },
        { status: 404 }
      );
    }

    // Sınav verilerini getir
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration_minutes: true,
        questions: {
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            question_text: true,
            options: true,
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

    // Yanıt verilerini hazırla
    const response = {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration_minutes: exam.duration_minutes,
      questions: exam.questions,
      attempt: attempt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching exam attempt:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Sınav denemesi ilerleme durumunu güncelle
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

    // Request body'den ilerleme durumunu al
    const { currentQuestionIndex } = await req.json();

    // Sınav denemesini güncelle
    const updatedAttempt = await prisma.examAttempt.update({
      where: {
        id: attemptId,
      },
      data: {
        currentQuestionIndex,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      message: "Exam attempt progress updated successfully",
    });
  } catch (error) {
    console.error("Error updating exam attempt progress:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
