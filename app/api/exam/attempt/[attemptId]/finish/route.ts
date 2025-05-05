import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ExamAttemptStatus } from '@prisma/client';

// Gelen istek body'si için şema (isteğe bağlı, belki bitirme nedenini belirtebiliriz)
const FinishAttemptSchema = z.object({
    finalAnswers: z.record(z.string()).optional(), // Son cevapları da alabiliriz
    timedOut: z.boolean().optional().default(false), // Süre dolduğu için mi bitti?
});

export async function POST(
    request: Request,
    { params }: { params: { attemptId: string } }
) {
    try {
        const attemptId = params.attemptId;
        if (!attemptId) {
            return NextResponse.json({ message: 'Deneme ID eksik.' }, { status: 400 });
        }

        const body = await request.json().catch(() => ({})); // Body olmasa da hata vermesin
        const validation = FinishAttemptSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Geçersiz istek verisi.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { finalAnswers, timedOut } = validation.data;

        // İlgili denemeyi bul
        const attempt = await prisma.examAttempt.findUnique({
            where: { id: attemptId }
        });

        if (!attempt) {
            return NextResponse.json({ message: 'Bitirilecek sınav denemesi bulunamadı.' }, { status: 404 });
        }

        // Zaten bitmişse işlem yapma
        const finishedStatuses: ExamAttemptStatus[] = [
            ExamAttemptStatus.SUBMITTED,
            ExamAttemptStatus.TIMED_OUT,
            ExamAttemptStatus.GRADED
        ];
        if (finishedStatuses.includes(attempt.status)) {
             return NextResponse.json({ message: 'Bu sınav denemesi zaten tamamlanmış.', attemptStatus: attempt.status }, { status: 409 }); // 409 Conflict
        }

        // Denemeyi güncelle: status ve endTime ayarla
        const finalStatus = timedOut ? ExamAttemptStatus.TIMED_OUT : ExamAttemptStatus.SUBMITTED;
        const updateData: any = {
            status: finalStatus,
            endTime: new Date(),
        };

        // Eğer body'de son cevaplar geldiyse onları da kaydet
        if (finalAnswers) {
            updateData.answers = finalAnswers;
            // Son soru indeksini de güncelleyebiliriz (isteğe bağlı)
            // updateData.currentQuestionIndex = ...
        }

        await prisma.examAttempt.update({
            where: { id: attemptId },
            data: updateData,
        });

        // TODO: Burada sınavı değerlendirme (grading) işlemi tetiklenebilir.
        // Örneğin, bir kuyruğa (queue) iş eklenebilir veya doğrudan hesaplama yapılabilir.

        return NextResponse.json({ message: `Sınav başarıyla ${finalStatus === ExamAttemptStatus.TIMED_OUT ? 'süre dolduğu için' : ''} bitirildi.` }, { status: 200 });

    } catch (error) {
        console.error(`Sınav bitirme hatası (Attempt ID: ${params.attemptId}):`, error);
        if ((error as any)?.code === 'P2025') {
             return NextResponse.json({ message: 'Bitirilecek sınav denemesi bulunamadı.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Sunucu hatası oluştu.' }, { status: 500 });
    }
}
