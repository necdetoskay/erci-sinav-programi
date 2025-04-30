import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma'; // Prisma client import

const VerifyCodeSchema = z.object({
  email: z.string().email({ message: 'Geçersiz e-posta adresi.' }),
  examCode: z.string().min(1, { message: 'Sınav kodu gereklidir.' }),
  verificationCode: z.string().length(6, { message: 'Doğrulama kodu 6 haneli olmalıdır.' }), // Assuming 6 digits
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = VerifyCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Geçersiz istek verisi.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, examCode, verificationCode } = validation.data;

    // İlgili giriş denemesini bul
    const attempt = await prisma.examEntryAttempt.findFirst({
      where: {
        email: email,
        examAccessCode: examCode,
        // verificationCode: verificationCode, // Kodu burada kontrol etmiyoruz, önce kaydı bulalım
        verified: false, // Henüz doğrulanmamış olmalı
      },
      orderBy: {
        createdAt: 'desc', // En son denemeyi alalım (aynı email/kod ile birden fazla istek olursa)
      }
    });

    if (!attempt) {
      return NextResponse.json({ message: 'Doğrulama kaydı bulunamadı veya zaten kullanılmış.' }, { status: 404 });
    }

    // Süre kontrolü
    if (new Date() > attempt.expiresAt) {
      return NextResponse.json({ message: 'Doğrulama kodunun süresi dolmuş.' }, { status: 410 }); // 410 Gone
    }

    // Kod kontrolü (TODO: Hash karşılaştırması yapılmalı)
    if (attempt.verificationCode !== verificationCode) {
      // Güvenlik için deneme sayısını sınırlamak iyi olabilir
      return NextResponse.json({ message: 'Doğrulama kodu geçersiz.' }, { status: 400 });
    }

    // Doğrulama başarılı, kaydı güncelle
    await prisma.examEntryAttempt.update({
      where: { id: attempt.id },
      data: { verified: true },
    });

    // TODO: Burada sınavı başlatmak için gerekli bilgileri (örn: JWT token, sınav ID) döndür
    // Şimdilik sadece başarı mesajı dönelim
    return NextResponse.json({ message: 'Doğrulama başarılı. Sınava başlayabilirsiniz.' }, { status: 200 });

  } catch (error) {
    console.error('Kod doğrulama hatası:', error);
    return NextResponse.json({ message: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
