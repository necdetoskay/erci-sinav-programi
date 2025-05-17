import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Sınavı başlat
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü
    if (!session) {
      return NextResponse.json({ error: "Bu işlemi gerçekleştirmek için giriş yapmanız gerekmektedir." }, { status: 401 });
    }

    // Kullanıcı rolü kontrolü - sadece PERSONEL rolündeki kullanıcılar sınava katılabilir
    if (session.user.role !== "PERSONEL") {
      return NextResponse.json({
        error: "Sınava katılmak için personel hesabıyla giriş yapmanız gerekmektedir. Şu anda " +
          (session.user.role === 'ADMIN' ? 'Yönetici' :
           session.user.role === 'SUPERADMIN' ? 'Süper Yönetici' :
           session.user.role) + " hesabıyla giriş yapmış durumdasınız."
      }, { status: 403 });
    }

    const examId = parseInt(params.id);

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Geçersiz sınav ID'si. Lütfen geçerli bir sınav ID'si girin." },
        { status: 400 }
      );
    }

    // Kullanıcı bilgilerini session'dan al
    const user = session.user;

    if (!user || !user.name || !user.email) {
      return NextResponse.json(
        { error: "Kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın." },
        { status: 400 }
      );
    }

    const participantName = user.name;
    const participantEmail = user.email;

    // Sınavın varlığını ve durumunu kontrol et
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
      },
      include: {
        questions: true,
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: "Exam not found" },
        { status: 404 }
      );
    }

    if (exam.status !== "active") {
      return NextResponse.json(
        { error: "Exam is not active" },
        { status: 400 }
      );
    }

    // Aynı kullanıcının devam eden bir sınav denemesi var mı kontrol et
    const existingAttempt = await prisma.examAttempt.findFirst({
      where: {
        examId,
        participantEmail,
        status: {
          in: ["STARTED", "IN_PROGRESS", "PAUSED"],
        },
      },
    });

    // Eğer devam eden bir deneme varsa, onu döndür
    if (existingAttempt) {
      return NextResponse.json({
        attemptId: existingAttempt.id,
        message: "Continuing existing attempt",
      });
    }

    // Yeni bir sınav denemesi oluştur
    const attempt = await prisma.examAttempt.create({
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
      attemptId: attempt.id,
      message: "Exam started successfully",
    });
  } catch (error) {
    console.error("Error starting exam:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
