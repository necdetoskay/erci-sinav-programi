import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGlobalSettings } from '@/lib/settings';

import { ExamAttemptStatus } from "@/types/prisma";

// Frontend'in beklediği sonuç formatı
interface ExamResultResponse {
    attemptId: string;
    examTitle: string;
    score: number; // Doğru cevap sayısı
    totalQuestions: number;
    percentage: number;
    status: ExamAttemptStatus; // Sınavın bitiş durumu
    // İleride eklenebilir:
    // participantName: string;
    // startTime: Date;
    // endTime: Date | null;
}

export async function GET(
    request: Request,
    { params }: { params: { attemptId: string } }
) {
    console.log("[ExamResultsAPI] API isteği alındı, attemptId:", params.attemptId);

    // Global ayarları getir
    try {
        const globalSettings = await getGlobalSettings();
        console.log("[ExamResultsAPI] Global ayarlar:", globalSettings);
        console.log("[ExamResultsAPI] PUBLIC_SERVER_URL:", globalSettings.PUBLIC_SERVER_URL || process.env.PUBLIC_SERVER_URL || "Ayarlanmamış");
    } catch (error) {
        console.error("[ExamResultsAPI] Global ayarları alma hatası:", error);
    }

    const { attemptId } = params;

    if (!attemptId) {
        console.error("[ExamResultsAPI] Attempt ID eksik");
        return NextResponse.json({ message: 'Attempt ID gereklidir.' }, { status: 400 });
    }

    try {
        console.log("[ExamResultsAPI] Sınav denemesi verileri alınıyor...");
        // 1. Sınav denemesini ve ilişkili verileri getir
        const attempt = await prisma.examAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: { // Sınav başlığı ve toplam soru sayısı için
                    select: { title: true, questions: { select: { id: true } } }
                },
                attemptAnswers: { // Skoru hesaplamak için
                    select: { isCorrect: true }
                }
            }
        });

        console.log("[ExamResultsAPI] Sınav denemesi verileri:", attempt ? "Bulundu" : "Bulunamadı");

        if (!attempt) {
            return NextResponse.json({ message: 'Sınav denemesi bulunamadı.' }, { status: 404 });
        }

        // 2. Sadece tamamlanmış veya süresi dolmuş denemelerin sonuçlarını göster
        if (attempt.status !== ExamAttemptStatus.SUBMITTED &&
            attempt.status !== ExamAttemptStatus.TIMED_OUT &&
            attempt.status !== ExamAttemptStatus.GRADED) {
             // Henüz bitmemişse belki farklı bir mesaj veya hata dönebiliriz.
             // Şimdilik tamamlanmış gibi davranalım ama idealde bu durum kontrol edilmeli.
             console.warn(`Attempt ${attemptId} is not yet completed (status: ${attempt.status}). Showing results might be premature.`);
             // return NextResponse.json({ message: 'Sınav henüz tamamlanmadı.' }, { status: 400 });
        }

        // 3. Skoru hesapla
        const correctAnswersCount = attempt.attemptAnswers.filter((ans: { isCorrect: boolean }) => ans.isCorrect).length;
        const totalQuestions = attempt.exam.questions.length;
        const percentage = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;

        console.log("[ExamResultsAPI] Skor hesaplandı:", {
            correctAnswers: correctAnswersCount,
            totalQuestions,
            percentage
        });

        // 4. Yanıt verisini hazırla
        const responseData: ExamResultResponse = {
            attemptId: attempt.id,
            examTitle: attempt.exam.title,
            score: correctAnswersCount,
            totalQuestions: totalQuestions,
            percentage: percentage,
            status: attempt.status as ExamAttemptStatus, // Tip dönüşümü ekle
            // participantName: attempt.participantName, // Gerekirse eklenebilir
            // startTime: attempt.startTime,
            // endTime: attempt.endTime,
        };

        console.log("[ExamResultsAPI] Yanıt verisi hazırlandı:", responseData);

        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error(`Sonuçları alma hatası (Attempt ID: ${attemptId}):`, error);
        const errorMessage = error instanceof Error ? error.message : 'Sunucu hatası oluştu.';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
