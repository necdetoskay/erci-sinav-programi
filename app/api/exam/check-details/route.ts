import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma'; // Prisma client import

// Gelen istek için şema tanımı
const CheckDetailsSchema = z.object({
  firstName: z.string().trim().min(1, { message: 'Ad alanı gereklidir.' }),
  lastName: z.string().trim().min(1, { message: 'Soyad alanı gereklidir.' }),
  examCode: z.string().trim().min(1, { message: 'Sınav kodu gereklidir.' }),
});

export async function POST(request: Request) {
  // console.log("[API /api/exam/check-details] Request received."); // Removed log
  try {
    const body = await request.json();
    const validation = CheckDetailsSchema.safeParse(body);

    if (!validation.success) {
      // Hata mesajlarını birleştirerek daha anlaşılır hale getirelim
      const errorMessages = Object.values(validation.error.flatten().fieldErrors)
                                  .flat() // Dizileri düzleştir
                                  .join(' '); // Mesajları birleştir
      console.error("[API /api/exam/check-details] Invalid request data:", validation.error.flatten()); // Log validation error
      return NextResponse.json({ message: `Geçersiz istek verisi: ${errorMessages || 'Bilinmeyen hata.'}` }, { status: 400 });
    }

    const { firstName, lastName, examCode } = validation.data;
    // console.log(`[API /api/exam/check-details] Received data: firstName=${firstName}, lastName=${lastName}, examCode=${examCode}`); // Removed log

    // 1. Sınav koduna göre sınavı bul
    // console.log(`[API /api/exam/check-details] Querying database for exam with access_code: ${examCode}`); // Removed log
    const exam = await prisma.exam.findFirst({
      where: {
        access_code: examCode, // Schema'daki doğru alan adı (snake_case)
      },
      // Soru sayısını almak için questions ilişkisini dahil edelim
      include: {
        questions: {
          select: {
            id: true // Sadece ID'yi seçerek sayma işlemi için yeterli veri alırız
          }
        }
      }
    });
    // console.log(`[API /api/exam/check-details] Prisma query result for access_code ${examCode}:`, exam ? `Found exam ID: ${exam.id}` : 'Not found'); // Removed log

    // 2. Sınav var mı kontrol et
    if (!exam) {
      // console.log(`[API /api/exam/check-details] No exam found for access_code ${examCode}. Returning 404.`); // Removed log
      return NextResponse.json({ message: 'Geçersiz sınav kodu.' }, { status: 404 });
    }

    // 3. Zaman Kontrolü (Schema'da startTime/endTime yok, bu kontrol kaldırıldı)
    // ... (Mevcut kontroller burada kalabilir veya eklenebilir)


    // 4. (Opsiyonel) Katılımcı Kontrolü
    // ...


    // 5. Başarılı: Sınav ID'sini döndür
    const questionCount = exam.questions.length;
    // console.log(`[API /api/exam/check-details] Exam found. ID: ${exam.id}, Title: ${exam.title}, Question Count: ${questionCount}. Returning 200.`); // Removed log

    return NextResponse.json({
        message: 'Sınav bulundu.',
        examId: exam.id,
        examTitle: exam.title,
        questionCount: questionCount,
    }, { status: 200 });

  } catch (error) {
    console.error('[API /api/exam/check-details] Error:', error); // Log general error
    // Genel hata mesajı
    let errorMessage = 'Sunucu hatası oluştu.';
    if (error instanceof Error) {
        // errorMessage = error.message; // Dikkat: Hassas bilgileri ifşa etmemeli
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
