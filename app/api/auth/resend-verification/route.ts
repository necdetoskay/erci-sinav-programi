import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Güvenlik nedeniyle kullanıcı bulunamasa bile başarılı yanıt döndür
      return NextResponse.json(
        { message: 'Verification email sent if account exists' },
        { status: 200 }
      );
    }

    // Kullanıcı zaten doğrulanmış mı kontrol et
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 400 }
      );
    }

    // Mevcut token'ları silmeye çalışma, sadece yeni bir token oluştur
    // Veritabanı şeması ile uyumsuzluk olduğu için bu kısmı atlıyoruz

    // Yeni token oluştur
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 saat geçerli

    // Token'ı kaydet
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: verificationToken,
        expires: expiresAt,
      },
    });

    // Doğrulama e-postası gönder
    await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      { message: 'Verification email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json(
      { message: 'Error sending verification email' },
      { status: 500 }
    );
  }
}
