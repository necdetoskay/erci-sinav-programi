import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const questions = await db.poolQuestion.findMany({
      where: {
        poolId: parseInt(params.id),
        pool: {
          userId: session.user.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(questions);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST /api/question-pools/[id]/questions
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

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