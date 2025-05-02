import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ExamAttemptStatus } from '@prisma/client';

// Gelen istek body'si için şema
const UpdateAttemptSchema = z.object({
    currentQuestionIndex: z.number().int().min(0),
    answers: z.record(z.string()), // { "questionId": "selectedOptionKey", ... }
});

export async function PATCH(
    request: Request,
    { params }: { params: { attemptId: string } }
) {
    try {
        const attemptId = params.attemptId;
        if (!attemptId) {
            return NextResponse.json({ message: 'Deneme ID eksik.' }, { status: 400 });
        }

        const body = await request.json();
        const validation = UpdateAttemptSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Geçersiz istek verisi.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { currentQuestionIndex, answers } = validation.data;

        // İlgili denemeyi bul ve güncelle
        const updatedAttempt = await prisma.examAttempt.update({
            where: {
                id: attemptId,
                // Güvenlik katmanı: Sadece devam eden sınavlar güncellenebilsin
                status: {
                    in: [ExamAttemptStatus.STARTED, ExamAttemptStatus.IN_PROGRESS, ExamAttemptStatus.PAUSED]
                }
            },
            data: {
                currentQuestionIndex: currentQuestionIndex,
                answers: answers, // Prisma JSON alanını otomatik yönetir
                lastActivityAt: new Date(), // Son aktivite zamanını güncelle
                status: ExamAttemptStatus.IN_PROGRESS, // Durumu IN_PROGRESS olarak ayarla
            },
            select: { // Sadece güncellenme zamanını geri dönelim (veya hiçbir şey)
                updatedAt: true
            }
        });

        if (!updatedAttempt) {
             // Bu durum, attemptId bulunamadığında veya status uygun olmadığında oluşur
             return NextResponse.json({ message: 'Güncellenecek aktif sınav denemesi bulunamadı veya zaten tamamlanmış.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'İlerleme kaydedildi.', updatedAt: updatedAttempt.updatedAt }, { status: 200 });

    } catch (error) {
        console.error(`Sınav ilerlemesi kaydetme hatası (Attempt ID: ${params.attemptId}):`, error);
        // Prisma'nın belirli hata kodlarını yakalayabiliriz (örn: P2025 Kayıt bulunamadı)
        if ((error as any)?.code === 'P2025') {
             return NextResponse.json({ message: 'Güncellenecek sınav denemesi bulunamadı.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Sunucu hatası oluştu.' }, { status: 500 });
    }
}
