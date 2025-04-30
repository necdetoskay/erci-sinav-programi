import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const questionPoolSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  grade: z.string().min(1, "Grade is required"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

// GET /api/question-pools/[id]
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const questionPool = await db.questionPool.findUnique({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
      include: {
        questions: true,
      },
    });

    if (!questionPool) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(questionPool);
  } catch (error) {
    console.error("Error fetching question pool:", error);
    return NextResponse.json(
      { error: "Failed to fetch question pool" },
      { status: 500 }
    );
  }
}

// PATCH /api/question-pools/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const validatedData = questionPoolSchema.partial().parse(json);

    const questionPool = await db.questionPool.update({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
      data: validatedData,
    });

    return NextResponse.json(questionPool);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Error updating question pool:", error);
    return NextResponse.json(
      { error: "Failed to update question pool" },
      { status: 500 }
    );
  }
}

// DELETE /api/question-pools/[id]
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.questionPool.delete({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting question pool:", error);
    return NextResponse.json(
      { error: "Failed to delete question pool" },
      { status: 500 }
    );
  }
} 