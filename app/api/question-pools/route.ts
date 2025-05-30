import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";
import { QuestionPoolStatus } from "@/types/prisma";
import { ActivityType, EntityType } from "@/lib/activity-logger";

// Validation schema for creating/updating question pools
const questionPoolSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  // grade: z.string().min(1, "Grade is required"), // Prisma şemasından kaldırıldığı için buradan da kaldırıldı
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  status: z.enum([QuestionPoolStatus.ACTIVE, QuestionPoolStatus.INACTIVE]).default(QuestionPoolStatus.ACTIVE),
});

// GET /api/question-pools
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ID'nin string formatını kontrol et
    if (typeof session.user.id !== 'string') {
      console.error("Invalid user ID format:", session.user.id);
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Superadmin tüm soru havuzlarını görebilir, diğer kullanıcılar sadece kendilerine ait olanları
    const whereCondition = session.user.role === 'SUPERADMIN'
      ? {}
      : { userId: session.user.id };

    const questionPools = await db.questionPool.findMany({
      where: whereCondition,
      include: {
        questions: true,
        createdBy: {
          select: {
            name: true,
            email: true
          }
        }
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
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
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
    let user;
    try {
      user = await db.user.findUnique({
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
        return NextResponse.json({
          error: "Unauthorized - User not found in database",
          message: "Oturum bilgileriniz geçersiz. Lütfen yeniden giriş yapın.",
          code: "USER_NOT_FOUND"
        }, { status: 401 });
      }
    } catch (dbError) {
      console.error("Database error when finding user:", dbError);
      return NextResponse.json({
        error: "Database error",
        message: "Veritabanı bağlantısında bir sorun oluştu. Lütfen daha sonra tekrar deneyin.",
        code: "DB_CONNECTION_ERROR"
      }, { status: 500 });
    }

    console.log("Found user:", JSON.stringify(user, null, 2));

    const json = await req.json();
    const validatedData = questionPoolSchema.parse(json);

    console.log("Creating question pool with data:", {
      ...validatedData,
      userId: session.user.id,
      status: validatedData.status || QuestionPoolStatus.ACTIVE
    });

    // QuestionPool oluştur - Sadece doğrulanmış ve gerekli alanları açıkça belirtelim
    const questionPool = await db.questionPool.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        subject: validatedData.subject,
        difficulty: validatedData.difficulty,
        userId: session.user.id, // Bu ID'nin geçerli olduğundan emin olduk
        status: validatedData.status || QuestionPoolStatus.ACTIVE // Varsayılan veya belirlenen durum
        // grade alanı şemada olmadığı için eklenmiyor
      },
    });

    console.log("Created question pool:", JSON.stringify(questionPool, null, 2));

    // Aktivite kaydı oluştur
    try {
      await db.activity.create({
        data: {
          type: ActivityType.QUESTION_POOL_CREATED,
          title: 'Yeni Soru Havuzu Oluşturuldu',
          description: `"${validatedData.title}" soru havuzu oluşturuldu`,
          userId: session.user.id,
          entityId: questionPool.id.toString(),
          entityType: EntityType.QUESTION_POOL,
        }
      });
    } catch (activityError) {
      console.error('Error creating activity log:', activityError);
      // Aktivite kaydı oluşturma hatası soru havuzu oluşturmayı etkilemeyecek
    }

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
