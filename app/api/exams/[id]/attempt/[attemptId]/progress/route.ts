import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

    if (currentQuestionIndex === undefined) {
      return NextResponse.json(
        { error: "Current question index is required" },
        { status: 400 }
      );
    }

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
