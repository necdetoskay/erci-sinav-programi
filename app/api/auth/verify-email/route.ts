import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // URL'den token'ı al
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    // Token'ı veritabanında ara
    const verificationToken = await prisma.$queryRaw`
      SELECT * FROM "VerificationToken" WHERE token = ${token}
    `;

    // Sonuç bir dizi olarak gelir, ilk elemanı al
    const tokenRecord = verificationToken[0];

    if (!tokenRecord) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 400 }
      );
    }

    // Token'ın süresi dolmuş mu kontrol et
    if (new Date(tokenRecord.expires) < new Date()) {
      return NextResponse.json(
        { message: 'Token has expired' },
        { status: 400 }
      );
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.identifier },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Kullanıcının e-posta adresini doğrulanmış olarak işaretle
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Kullanılan token'ı sil
    await prisma.$executeRaw`
      DELETE FROM "VerificationToken"
      WHERE identifier = ${tokenRecord.identifier} AND token = ${token}
    `;

    // Başarılı yanıt döndür
    return NextResponse.json(
      { message: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'Error verifying email' },
      { status: 500 }
    );
  }
}
