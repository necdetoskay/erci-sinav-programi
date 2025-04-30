import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const questionSchema = z.object({
  questionText: z.string(),
  options: z.array(
    z.object({
      text: z.string(),
      label: z.string(),
    })
  ),
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const requestSchema = z.object({
  questions: z.array(questionSchema),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { questions } = requestSchema.parse(body);
    const poolId = parseInt(params.id);

    // Tüm soruları tek bir transaction içinde kaydet
    const savedQuestions = await prisma.$transaction(
      questions.map((question) =>
        prisma.poolQuestion.create({
          data: {
            questionText: question.questionText,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: question.difficulty,
            poolId: poolId,
          },
        })
      )
    );

    return NextResponse.json(savedQuestions);
  } catch (error) {
    console.error("Sorular kaydedilirken hata:", error);
    return NextResponse.json(
      { error: "Sorular kaydedilirken bir hata oluştu" },
      { status: 500 }
    );
  }
} 