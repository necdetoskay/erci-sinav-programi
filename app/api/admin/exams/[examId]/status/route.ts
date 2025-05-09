import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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

    // Rol kontrolü (sadece ADMIN ve USER rollerine izin ver)
    if (session.user.role !== "ADMIN" && session.user.role !== "USER") {
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
    if (!status || !["draft", "active", "completed", "archived"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: draft, active, completed, archived" },
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
        status,
      },
    });

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
