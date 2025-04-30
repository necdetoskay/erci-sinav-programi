import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const addFromPoolSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number(),
      questionText: z.string(),
      options: z.array(
        z.object({
          text: z.string(),
          label: z.string(),
        })
      ),
      correctAnswer: z.string(),
      explanation: z.string().nullable(),
      difficulty: z.string(),
    })
  ),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = parseInt(params.examId);
    const body = await request.json();
    const { questions } = addFromPoolSchema.parse(body);

    // Mevcut soru sayısını al
    const existingQuestions = await db.question.findMany({
      where: { exam_id: examId },
      orderBy: { position: "desc" },
      take: 1,
    });

    const lastPosition = existingQuestions[0]?.position || 0;

    // Soruları ekle
    const createdQuestions = await Promise.all(
      questions.map(async (question, index) => {
        return db.question.create({
          data: {
            exam_id: examId,
            question_text: question.questionText,
            options: question.options.map(opt => opt.text),
            correct_answer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: question.difficulty,
            position: lastPosition + index + 1,
          },
        });
      })
    );

    return NextResponse.json(createdQuestions);
  } catch (error) {
    console.error("Error adding questions from pool:", error);
    return NextResponse.json(
      { error: "Failed to add questions from pool" },
      { status: 500 }
    );
  }
} 