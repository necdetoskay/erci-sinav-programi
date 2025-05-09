import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Sınav kodunu doğrula
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Request body'den sınav kodunu al
    const { accessCode } = await req.json();

    if (!accessCode) {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    // Sınav kodunu doğrula
    const exam = await prisma.exam.findFirst({
      where: {
        access_code: accessCode,
        status: "active", // Sadece aktif sınavları kontrol et
      },
      select: {
        id: true,
        title: true,
        duration_minutes: true,
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 404 }
      );
    }

    // Sınav bilgilerini döndür
    return NextResponse.json({
      examId: exam.id,
      title: exam.title,
      duration_minutes: exam.duration_minutes,
    });
  } catch (error) {
    console.error("Error validating exam code:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
