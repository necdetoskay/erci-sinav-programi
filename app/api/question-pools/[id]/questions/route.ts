import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const questionSchema = z.object({
  questionText: z.string().min(1),
  options: z.array(
    z.object({
      text: z.string().min(1),
      label: z.string(),
    })
  ).min(2),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

// GET /api/question-pools/[id]/questions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Kullanıcı bazlı erişim kontrolü
    let whereCondition: any = {
      poolId: parseInt(params.id)
    };

    // Admin kullanıcıları sadece kendi oluşturdukları soru havuzlarına erişebilir
    // Superadmin tüm soru havuzlarına erişebilir
    if (session.user.role !== 'SUPERADMIN') {
      whereCondition.pool = {
        userId: session.user.id
      };
    }

    console.log("Sorular getiriliyor, koşul:", JSON.stringify(whereCondition));

    const questions = await db.poolQuestion.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`${questions.length} soru bulundu.`);

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Sorular getirilirken hata:", error);
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}

// POST /api/question-pools/[id]/questions
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const body = questionSchema.parse(json);

    const question = await db.poolQuestion.create({
      data: {
        ...body,
        poolId: parseInt(params.id),
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}