import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kullanıcı bazlı erişim kontrolü
    const whereCondition = {
      id: parseInt(params.id)
    };

    // Admin kullanıcıları sadece kendi oluşturdukları soru havuzlarına erişebilir
    // Superadmin tüm soru havuzlarına erişebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['userId'] = session.user.id;
    }

    const questionPool = await db.questionPool.findFirst({
      where: whereCondition,
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const validatedData = questionPoolSchema.partial().parse(json);

    // Kullanıcı bazlı erişim kontrolü
    const whereCondition = {
      id: parseInt(params.id)
    };

    // Admin kullanıcıları sadece kendi oluşturdukları soru havuzlarını güncelleyebilir
    // Superadmin tüm soru havuzlarını güncelleyebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['userId'] = session.user.id;
    }

    // Önce soru havuzunun varlığını ve erişim izni olup olmadığını kontrol et
    const existingPool = await db.questionPool.findFirst({
      where: whereCondition
    });

    if (!existingPool) {
      return NextResponse.json({ error: "Soru havuzu bulunamadı veya erişim izniniz yok" }, { status: 404 });
    }

    // Soru havuzunu güncelle
    const questionPool = await db.questionPool.update({
      where: {
        id: parseInt(params.id)
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kullanıcı bazlı erişim kontrolü
    const whereCondition = {
      id: parseInt(params.id)
    };

    // Admin kullanıcıları sadece kendi oluşturdukları soru havuzlarını silebilir
    // Superadmin tüm soru havuzlarını silebilir
    if (session.user.role === 'ADMIN') {
      whereCondition['userId'] = session.user.id;
    }

    // Önce soru havuzunun varlığını ve erişim izni olup olmadığını kontrol et
    const existingPool = await db.questionPool.findFirst({
      where: whereCondition
    });

    if (!existingPool) {
      return NextResponse.json({ error: "Soru havuzu bulunamadı veya erişim izniniz yok" }, { status: 404 });
    }

    // Soru havuzunu sil
    await db.questionPool.delete({
      where: {
        id: parseInt(params.id)
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
