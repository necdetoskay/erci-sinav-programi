import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Validation schema for creating/updating question pools
const questionPoolSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  // grade: z.string().min(1, "Grade is required"), // Prisma şemasından kaldırıldığı için buradan da kaldırıldı
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

// GET /api/question-pools
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ID'nin string formatını kontrol et
    if (typeof session.user.id !== 'string') {
      console.error("Invalid user ID format:", session.user.id);
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    const questionPools = await db.questionPool.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json(questionPools);
  } catch (error) {
    console.error("Error fetching question pools:", error);
    return NextResponse.json(
      { error: "Failed to fetch question pools" },
      { status: 500 }
    );
  }
}

// POST /api/question-pools
export async function POST(req: Request) {
  try {
    const session = await auth();
    console.log("Session:", JSON.stringify(session, null, 2));
    
    // Session kontrolü
    if (!session) {
      console.error("No session found");
      return NextResponse.json({ error: "Unauthorized - No session" }, { status: 401 });
    }

    // User kontrolü
    if (!session.user) {
      console.error("No user in session");
      return NextResponse.json({ error: "Unauthorized - No user in session" }, { status: 401 });
    }

    // User ID kontrolü
    if (!session.user.id || typeof session.user.id !== 'string') {
      console.error("Invalid or missing user ID:", session.user.id);
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Kullanıcının veritabanında var olduğunu kontrol et
    const user = await db.user.findUnique({
      where: { 
        id: session.user.id 
      },
      select: { 
        id: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      console.error(`User not found in database: ${session.user.id}`);
      return NextResponse.json({ error: "Unauthorized - User not found in database" }, { status: 401 });
    }

    console.log("Found user:", JSON.stringify(user, null, 2));

    const json = await req.json();
    const validatedData = questionPoolSchema.parse(json);

    console.log("Creating question pool with data:", {
      ...validatedData,
      userId: user.id,
      status: "ACTIVE"
    });

    // QuestionPool oluştur - Sadece doğrulanmış ve gerekli alanları açıkça belirtelim
    const questionPool = await db.questionPool.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        subject: validatedData.subject,
        difficulty: validatedData.difficulty,
        userId: user.id, // Bu ID'nin geçerli olduğundan emin olduk
        status: "ACTIVE" // Varsayılan veya belirlenen durum
        // grade alanı şemada olmadığı için eklenmiyor
      },
    });

    console.log("Created question pool:", JSON.stringify(questionPool, null, 2));

    return NextResponse.json(questionPool, { status: 201 });
  } catch (error) {
    console.error("Error details:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    // Detaylı hata mesajı
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? (error as any).code : undefined;
    
    return NextResponse.json(
      { 
        error: "Failed to create question pool",
        message: errorMessage,
        code: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
