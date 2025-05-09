import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// POST: Tüm soruların cevaplarını güncelle (0,1,2,3 -> A,B,C,D)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    // Oturum kontrolü - sadece admin kullanabilir
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Tüm soruları getir
    const questions = await prisma.question.findMany({
      select: {
        id: true,
        correct_answer: true,
        options: true,
      },
    });

    const updates = [];

    // Her soru için doğru cevabı güncelle
    for (const question of questions) {
      const options = question.options as Record<string, string>;
      const optionKeys = Object.keys(options);

      // Mevcut doğru cevap
      const currentCorrectAnswer = question.correct_answer;

      // Mevcut doğru cevabın indeksi
      const index = optionKeys.indexOf(currentCorrectAnswer);

      if (index !== -1) {
        // Yeni doğru cevap (A, B, C, D formatında)
        const newCorrectAnswer = String.fromCharCode(65 + index);

        // Soruyu güncelle
        updates.push(
          prisma.question.update({
            where: { id: question.id },
            data: { correct_answer: newCorrectAnswer },
          })
        );
      }
    }

    // Tüm güncellemeleri yap
    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: `${updates.length} soru güncellendi`,
    });
  } catch (error) {
    console.error("Hata:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
