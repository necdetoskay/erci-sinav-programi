import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ExamStatus, ExamStatusValues } from "@/lib/constants/exam-status";
import { ActivityType, EntityType } from "@/lib/activity-logger";

// PUT: Sınav durumunu günceller
export async function PUT(
  request: NextRequest,
  { params }: { params: { examId: string } }
) {
  try {
    const session = await getSession(request);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rol kontrolü (sadece ADMIN, USER ve SUPERADMIN rollerine izin ver)
    if (session.user.role !== "ADMIN" && session.user.role !== "USER" && session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const examId = parseInt(params.examId);

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    // Durum kontrolü
    if (!status || !ExamStatusValues.includes(status as ExamStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ExamStatusValues.join(", ")}` },
        { status: 400 }
      );
    }

    // Sınavın varlığını kontrol et
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    // Sınav durumunu güncelle
    const updatedExam = await prisma.exam.update({
      where: {
        id: examId,
      },
      data: {
        status: status as ExamStatus,
      },
    });

    // Aktivite kaydı oluştur
    try {
      let activityType = ActivityType.EXAM_UPDATED;
      let activityTitle = "Sınav Güncellendi";
      let activityDescription = `"${exam.title}" sınavının durumu güncellendi`;

      // Eğer sınav yayınlandıysa özel aktivite tipi kullan
      if (status === "published") {
        activityType = ActivityType.EXAM_PUBLISHED;
        activityTitle = "Sınav Yayınlandı";
        activityDescription = `"${exam.title}" sınavı yayınlandı`;
      }

      await prisma.activity.create({
        data: {
          type: activityType,
          title: activityTitle,
          description: activityDescription,
          userId: session.user.id,
          entityId: examId.toString(),
          entityType: EntityType.EXAM,
        }
      });
    } catch (activityError) {
      console.error('Error creating activity log:', activityError);
      // Aktivite kaydı oluşturma hatası sınav durumu güncellemeyi etkilemeyecek
    }

    return NextResponse.json({
      message: "Exam status updated successfully",
      exam: updatedExam,
    });
  } catch (error) {
    console.error("Error updating exam status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
