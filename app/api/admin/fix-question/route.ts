import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Soru cevabını düzelt
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü - sadece admin kullanabilir
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Request body'den soru ID ve doğru cevabı al
    const { questionId, correctAnswer } = await req.json();

    if (!questionId || !correctAnswer) {
      return NextResponse.json(
        { error: "Question ID and correct answer are required" },
        { status: 400 }
      );
    }

    // Soruyu bul ve güncelle
    const question = await prisma.question.update({
      where: { id: questionId },
      data: { correct_answer: correctAnswer },
      select: { id: true, question_text: true, correct_answer: true },
    });

    return NextResponse.json({
      success: true,
      message: "Question updated successfully",
      question,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
