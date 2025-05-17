import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Personel için sınavı yeniden başlat
export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getServerSession();

    // Oturum kontrolü
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sadece ADMIN ve SUPERADMIN rollerine izin ver
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    // Request body'den personel bilgilerini al
    const { participantEmail, participantName } = await req.json();

    if (!participantEmail || !participantName) {
      return NextResponse.json(
        { error: "Participant email and name are required" },
        { status: 400 }
      );
    }

    // Sınavın varlığını kontrol et
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { 
        id: true, 
        createdById: true,
        status: true
      }
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Sınavın aktif olup olmadığını kontrol et
    if (exam.status !== "published") {
      return NextResponse.json(
        { error: "Exam is not active" },
        { status: 400 }
      );
    }

    // Admin kullanıcıları sadece kendi oluşturdukları sınavları yönetebilir
    if (session.user.role === "ADMIN" && exam.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Yeni bir sınav denemesi oluştur
    const newAttempt = await prisma.examAttempt.create({
      data: {
        examId,
        participantName,
        participantEmail,
        status: "STARTED",
        currentQuestionIndex: 0,
        startTime: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: newAttempt.id,
      message: "Exam restarted successfully",
    });
  } catch (error) {
    console.error("Error restarting exam:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
