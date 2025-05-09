import { NextResponse } from 'next/server';
// Prisma namespace'ini ve PrismaClient'ı import et
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

import { ExamAttemptStatus } from "@/types/prisma";

const prisma = new PrismaClient();

// İstek gövdesi için Zod şeması
const checkAnswerSchema = z.object({
  questionId: z.number().int().positive(),
  selectedAnswer: z.string().min(1), // Expecting 'A', 'B', 'C'...
  timeSpentSeconds: z.number().int().nonnegative(),
});

export async function POST(
  request: Request,
  { params }: { params: { attemptId: string } }
) {
  const attemptId = params.attemptId;
  console.log(`[API check-answer] Received request for attemptId: ${attemptId}`); // Log entry

  if (!attemptId) {
    console.error("[API check-answer] Attempt ID is missing."); // Log error
    return NextResponse.json({ message: 'Attempt ID is required' }, { status: 400 });
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    console.error("[API check-answer] Failed to parse JSON body:", error); // Log error
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }
  console.log("[API check-answer] Request body parsed:", requestBody); // Log parsed body

  // İstek gövdesini doğrula
  const validationResult = checkAnswerSchema.safeParse(requestBody);
  if (!validationResult.success) {
    console.error("[API check-answer] Invalid request body:", validationResult.error.flatten()); // Log validation error
    return NextResponse.json({ message: 'Invalid request body', errors: validationResult.error.errors }, { status: 400 });
  }

  const { questionId, selectedAnswer, timeSpentSeconds } = validationResult.data;
  console.log(`[API check-answer] Validated data: questionId=${questionId}, selectedAnswer=${selectedAnswer}, timeSpentSeconds=${timeSpentSeconds}`); // Log validated data

  try {
    // 1. Sınav denemesini bul ve durumunu kontrol et
    console.log(`[API check-answer] Finding exam attempt with ID: ${attemptId}`); // Log before findUnique
    const examAttempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true, // Sınav süresini kontrol etmek için
      },
    });
    console.log(`[API check-answer] Found exam attempt:`, examAttempt ? `Status: ${examAttempt.status}` : 'Not Found'); // Log findUnique result

    if (!examAttempt) {
      console.error(`[API check-answer] Exam attempt not found for ID: ${attemptId}`); // Log error
      return NextResponse.json({ message: 'Exam attempt not found' }, { status: 404 });
    }

    // Sınavın bitip bitmediğini veya zaman aşımına uğrayıp uğramadığını kontrol et
    console.log(`[API check-answer] Checking attempt status: ${examAttempt.status}`); // Log status check
    if (examAttempt.status === ExamAttemptStatus.SUBMITTED || examAttempt.status === ExamAttemptStatus.TIMED_OUT) {
      // Eğer bitmişse, mevcut cevabı (varsa) döndürerek durumu koru
      const existingAnswer = await prisma.examAttemptAnswer.findUnique({
         where: { examAttemptId_questionId: { examAttemptId: attemptId, questionId: questionId } },
         include: { question: { select: { correct_answer: true, explanation: true } } }
      });
       if (existingAnswer && existingAnswer.question) {
            return NextResponse.json({
                isCorrect: existingAnswer.isCorrect,
                correctAnswer: existingAnswer.question.correct_answer,
                explanation: existingAnswer.question.explanation,
            }, { status: 409 }); // Conflict or specific status indicating already ended
       } else {
            return NextResponse.json({ message: 'Exam attempt has already ended' }, { status: 409 });
       }
    }

    // Zaman aşımı kontrolü (ekstra güvenlik katmanı)
    console.log(`[API check-answer] Checking for timeout...`); // Log timeout check
    const examDurationMs = examAttempt.exam.duration_minutes * 60 * 1000;
    const elapsedTimeMs = Date.now() - new Date(examAttempt.startTime).getTime();
    if (elapsedTimeMs > examDurationMs) {
        console.warn(`[API check-answer] Exam timed out for attempt ${attemptId}. Elapsed: ${elapsedTimeMs}ms, Duration: ${examDurationMs}ms`); // Log timeout
        await prisma.examAttempt.update({
            where: { id: attemptId },
            data: { status: ExamAttemptStatus.TIMED_OUT, endTime: new Date() },
        });
        return NextResponse.json({ message: 'Exam time has expired' }, { status: 410 }); // 410 Gone
    }

    // 2. Soruyu bul
    console.log(`[API check-answer] Finding question with ID: ${questionId}`); // Log before findUnique
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });
    console.log(`[API check-answer] Found question:`, question ? `Correct Answer: ${question.correct_answer}` : 'Not Found'); // Log findUnique result

    if (!question || !question.correct_answer) { // correct_answer'ın null olmadığını kontrol et
      console.error(`[API check-answer] Question or correct answer not found for QID: ${questionId}`); // Log error
      return NextResponse.json({ message: 'Question or correct answer not found' }, { status: 404 });
    }

    // 3. Cevabı kontrol et (Case-insensitive and trimmed comparison)
    console.log(`[API check-answer] Comparing answer for QID ${questionId}...`); // Log comparison start
    const correctAnswerCleaned = question.correct_answer.trim().toUpperCase();
    const selectedAnswerCleaned = selectedAnswer.trim().toUpperCase();
    const isCorrect = correctAnswerCleaned === selectedAnswerCleaned;

    console.log(`Comparing Answer for QID ${questionId}: DB='${question.correct_answer}' (Cleaned: '${correctAnswerCleaned}') vs Selected='${selectedAnswer}' (Cleaned: '${selectedAnswerCleaned}')`);
    console.log(`Comparison Result (isCorrect): ${isCorrect}`);

    // 4. Cevap detaylarını veritabanına kaydet veya güncelle (upsert)
    await prisma.examAttemptAnswer.upsert({
      where: {
        examAttemptId_questionId: {
          examAttemptId: attemptId,
          questionId: questionId,
        },
      },
      update: {
        selectedAnswer: selectedAnswer, // Store the original selected letter ('A', 'B'...)
        isCorrect: isCorrect,
        timeSpentSeconds: timeSpentSeconds,
        answeredAt: new Date(),
      },
      create: {
        examAttemptId: attemptId,
        questionId: questionId,
        selectedAnswer: selectedAnswer, // Store the original selected letter ('A', 'B'...)
        isCorrect: isCorrect,
        timeSpentSeconds: timeSpentSeconds,
      },
    });
    // Add logging after upsert
    console.log(`[API check-answer] Upserted answer for attempt ${attemptId}, question ${questionId}. isCorrect: ${isCorrect}`);


    // 5. ExamAttempt'in genel cevaplarını güncelle (isteğe bağlı ama faydalı)
    const currentAnswers = (examAttempt.answers as Record<string, string>) || {};
    currentAnswers[questionId.toString()] = selectedAnswer; // Store the letter

    await prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
            answers: currentAnswers,
            lastActivityAt: new Date(),
            status: ExamAttemptStatus.IN_PROGRESS,
        },
    });

    // 6. Sonucu frontend'e döndür
    return NextResponse.json({
      isCorrect: isCorrect,
      correctAnswer: question.correct_answer, // Send the correct letter ('A', 'B'...)
      explanation: question.explanation,
    });

  } catch (error) {
    console.error('Error checking answer:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Invalid request data', errors: error.errors }, { status: 400 });
    }
    // Handle potential race conditions or other DB errors during upsert/update
    if (error instanceof Error && 'code' in error && typeof (error as any).code === 'string') {
        // Log specific Prisma error
        console.error(`Prisma Error Code: ${(error as any).code}`, error.message);
        // Potentially handle P2002 (unique constraint) if upsert fails unexpectedly, though upsert should handle it.
    }
    return NextResponse.json({ message: 'An unexpected error occurred while checking the answer.' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// OPTIONS methodu
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
