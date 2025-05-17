import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Sınavı taslak durumuna çevir ve katılımcı kayıtlarını sil
export async function POST(
  request: NextRequest,
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

    // Sınavın varlığını kontrol et
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Admin kullanıcıları sadece kendi oluşturdukları sınavları yönetebilir
    if (session.user.role === "ADMIN" && exam.createdById !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Sınav zaten taslak durumundaysa işlem yapma
    if (exam.status === "draft") {
      return NextResponse.json({
        message: "Exam is already in draft status",
        attemptCount: 0
      });
    }

    // Transaction ile işlemleri gerçekleştir
    const result = await prisma.$transaction(async (tx) => {
      // 1. Sınav denemelerini sil
      const deletedAttempts = await tx.examAttempt.deleteMany({
        where: { examId }
      });

      // 2. Sınav durumunu taslak olarak güncelle
      const updatedExam = await tx.exam.update({
        where: { id: examId },
        data: { status: "draft" }
      });

      return {
        deletedAttemptCount: deletedAttempts.count,
        exam: updatedExam
      };
    });

    return NextResponse.json({
      message: "Exam reset to draft status successfully",
      attemptCount: result.deletedAttemptCount,
      exam: result.exam
    });
  } catch (error) {
    console.error("Error resetting exam to draft:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
