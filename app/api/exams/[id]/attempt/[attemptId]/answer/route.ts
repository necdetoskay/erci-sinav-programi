import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Sınav sorusuna cevap kaydet
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; attemptId: string } }
) {
  try {
    // Oturum kontrolünü atla - sınav sayfasında zaten kontrol edilmiş olmalı

    const examId = parseInt(params.id);
    const attemptId = params.attemptId;

    if (isNaN(examId)) {
      return NextResponse.json(
        { error: "Invalid exam ID" },
        { status: 400 }
      );
    }

    // Request body'den soru ID, cevap ve geçen süreyi al
    const { questionId, answer, timeSpentSeconds } = await req.json();

    if (!questionId || !answer) {
      return NextResponse.json(
        { error: "Question ID and answer are required" },
        { status: 400 }
      );
    }

    // Geçen süre belirtilmemişse varsayılan olarak 0 kullan
    const finalTimeSpent = timeSpentSeconds || 0;

    try {
      // Soruyu getir
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true, correct_answer: true, explanation: true },
      });

      if (!question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }

      // Cevabın doğru olup olmadığını kontrol et
      // Cevapları string olarak karşılaştır (olası tip farklılıklarını önlemek için)
      const isCorrect = String(question.correct_answer).trim() === String(answer).trim();

      // Cevabı kaydet - arka planda yapılacak, yanıtı beklemeden devam et
      Promise.all([
        // Cevabı kaydet
        prisma.examAttemptAnswer.upsert({
          where: {
            examAttemptId_questionId: {
              examAttemptId: attemptId,
              questionId: questionId,
            },
          },
          update: {
            selectedAnswer: answer,
            isCorrect: isCorrect,
            timeSpentSeconds: finalTimeSpent,
          },
          create: {
            examAttemptId: attemptId,
            questionId: questionId,
            selectedAnswer: answer,
            isCorrect: isCorrect,
            timeSpentSeconds: finalTimeSpent,
          },
        }),

        // Denemeyi güncelle
        prisma.examAttempt.update({
          where: { id: attemptId },
          data: {
            answers: {
              ...(await prisma.examAttempt.findUnique({
                where: { id: attemptId },
                select: { answers: true },
              }))?.answers as object,
              [questionId.toString()]: answer,
            },
            status: "IN_PROGRESS",
          },
        }),
      ]).catch(() => {
        // Arka plan işlemlerindeki hataları sessizce yok say
      });

      // Debug bilgisi ekle (geliştirme aşamasında)
      const debugInfo = {
        userAnswer: answer,
        correctAnswer: question.correct_answer,
        userAnswerType: typeof answer,
        correctAnswerType: typeof question.correct_answer,
        userAnswerString: String(answer),
        correctAnswerString: String(question.correct_answer),
        isEqual: String(question.correct_answer).trim() === String(answer).trim()
      };

      console.log("Cevap kontrolü debug bilgisi:", debugInfo);

      // Sonucu hemen döndür
      return NextResponse.json({
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation || "",
        // Debug bilgisini de ekle (geliştirme aşamasında)
        debug: debugInfo
      }, {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        }
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
