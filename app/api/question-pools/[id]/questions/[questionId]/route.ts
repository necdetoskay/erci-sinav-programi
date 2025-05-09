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

// GET /api/question-pools/[id]/questions/[questionId]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const question = await db.poolQuestion.findUnique({
      where: {
        id: parseInt(params.questionId),
        poolId: parseInt(params.id),
        pool: {
          userId: session.user.id,
        },
      },
    });

    if (!question) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PATCH /api/question-pools/[id]/questions/[questionId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await request.json();
    const body = questionSchema.parse(json);

    const question = await db.poolQuestion.update({
      where: {
        id: parseInt(params.questionId),
        poolId: parseInt(params.id),
        pool: {
          userId: session.user.id,
        },
      },
      data: body,
    });

    return NextResponse.json(question);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 422 });
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/question-pools/[id]/questions/[questionId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getSession(request);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await db.poolQuestion.delete({
      where: {
        id: parseInt(params.questionId),
        poolId: parseInt(params.id),
        pool: {
          userId: session.user.id,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}