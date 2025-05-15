import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Oturum kontrolü
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Sadece ADMIN ve SUPERADMIN rollerine izin ver
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // İstek verilerini al
    const { userIds } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Kullanıcı ID listesi gereklidir' },
        { status: 400 }
      );
    }

    // Sonuç nesnesi
    const result = {
      success: true,
      message: 'İşlem tamamlandı',
      successCount: 0,
      failedCount: 0,
      failedUsers: [] as Array<{ email: string; error: string }>,
    };

    // Her kullanıcı için işlem yap
    for (const userId of userIds) {
      try {
        // Kullanıcıyı getir
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });

        if (!user) {
          result.failedUsers.push({
            email: 'Bilinmeyen',
            error: 'Kullanıcı bulunamadı',
          });
          result.failedCount++;
          continue;
        }

        // Şifre sıfırlama token'ı oluştur
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat geçerli

        // Mevcut token'ı sil (varsa)
        await prisma.verificationToken.deleteMany({
          where: {
            identifier: user.email,
          },
        });

        // Yeni token'ı kaydet
        await prisma.verificationToken.create({
          data: {
            identifier: user.email,
            token: resetToken,
            expires: expiresAt,
          },
        });

        // E-posta gönder - oturum açan kullanıcının ID'sini kullan
        await sendPasswordResetEmail(user.email, resetToken, user.name || undefined);

        result.successCount++;
      } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);

        // Kullanıcı bilgilerini almaya çalış
        let userEmail = 'Bilinmeyen';
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
          });
          if (user) {
            userEmail = user.email;
          }
        } catch (e) {
          // Kullanıcı bilgisi alınamadı, varsayılan değeri kullan
        }

        result.failedUsers.push({
          email: userEmail,
          error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        });
        result.failedCount++;
      }
    }

    // Sonuç mesajını güncelle
    if (result.failedCount > 0) {
      if (result.successCount === 0) {
        result.success = false;
        result.message = 'Hiçbir kullanıcıya şifre sıfırlama bağlantısı gönderilemedi';
      } else {
        result.message = `${result.successCount} kullanıcıya şifre sıfırlama bağlantısı gönderildi, ${result.failedCount} kullanıcıya gönderilemedi`;
      }
    } else {
      result.message = `${result.successCount} kullanıcıya şifre sıfırlama bağlantısı başarıyla gönderildi`;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Toplu şifre sıfırlama hatası:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'İşlem sırasında bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
