import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const requestSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number(),
      position: z.number(),
    })
  ),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questions } = requestSchema.parse(body);
    const poolId = parseInt(params.id);

    // Soru havuzunun kullanıcıya ait olduğunu kontrol et
    const pool = await db.questionPool.findUnique({
      where: {
        id: poolId,
        userId: session.user.id,
      },
    });

    if (!pool) {
      return NextResponse.json(
        { error: "Soru havuzu bulunamadı" },
        { status: 404 }
      );
    }

    // Önce tüm soruların var olduğunu ve bu havuza ait olduğunu kontrol et
    const existingQuestions = await db.poolQuestion.findMany({
      where: {
        id: {
          in: questions.map(q => q.id)
        },
        poolId: poolId
      },
      select: { id: true }
    });

    if (existingQuestions.length !== questions.length) {
      return NextResponse.json(
        { error: "Bazı sorular bulunamadı veya bu havuza ait değil" },
        { status: 404 }
      );
    }

    // Tüm soruların pozisyonlarını tek bir transaction içinde güncelle
    await db.$transaction(
      questions.map((question) =>
        db.poolQuestion.update({
          where: {
            id: question.id,
            poolId: poolId
          },
          data: { 
            position: question.position 
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REORDER_QUESTIONS]", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Geçersiz istek formatı" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Sorular sıralanırken bir hata oluştu" },
      { status: 500 }
    );
  }
} 