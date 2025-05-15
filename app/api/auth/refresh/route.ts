// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  UserPayload,
  parseExpiry,
} from '@/lib/jwt-auth';

export async function POST(request: NextRequest) {
  try {
    const refreshTokenFromCookie = request.cookies.get('refresh-token')?.value;

    if (!refreshTokenFromCookie) {
      return NextResponse.json(
        { message: 'Refresh token not found' },
        { status: 401 }
      );
    }

    const decodedRefreshToken = verifyRefreshToken(refreshTokenFromCookie);

    if (!decodedRefreshToken || !decodedRefreshToken.id) {
      return NextResponse.json(
        { message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedRefreshToken.id },
    });

    if (!user) {
      const clearResponse = NextResponse.json(
        { message: 'User not found for refresh token' },
        { status: 401 }
      );
      clearResponse.cookies.delete('refresh-token'); // Veya maxAge: -1
      clearResponse.cookies.delete('access-token');
      return clearResponse;
    }

    const userPayload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const newAccessToken = generateAccessToken(userPayload);
    const newRefreshToken = generateRefreshToken({ id: user.id }); // Refresh token rotasyonu

    // Orijinal refresh token'ın maxAge değerini kontrol et
    // Eğer session cookie ise (maxAge yok), yeni token'lar da session cookie olmalı
    const originalRefreshTokenCookie = request.cookies.get('refresh-token');
    const isSessionCookie = !originalRefreshTokenCookie?.expires;

    console.log("Refresh token cookie:", {
      cookie: originalRefreshTokenCookie,
      expires: originalRefreshTokenCookie?.expires,
      isSessionCookie
    });

    const response = NextResponse.json(
      { message: 'Tokens refreshed successfully' },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const accessTokenMaxAge = parseExpiry(process.env.ACCESS_TOKEN_EXPIRES_IN || '15m');
    const refreshTokenMaxAge = parseExpiry(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d');

    // "Beni hatırla" seçeneğine göre maxAge değerini ayarla
    const finalAccessTokenMaxAge = isSessionCookie ? undefined : accessTokenMaxAge;
    const finalRefreshTokenMaxAge = isSessionCookie ? undefined : refreshTokenMaxAge;

    console.log("Token maxAge values in refresh:", {
      finalAccessTokenMaxAge,
      finalRefreshTokenMaxAge,
      accessTokenMaxAge,
      refreshTokenMaxAge
    });

    response.cookies.set('access-token', newAccessToken, {
      httpOnly: true,
      secure: false, // HTTP için false olmalı
      path: '/',
      sameSite: 'lax',
      maxAge: finalAccessTokenMaxAge, // undefined = session cookie
    });

    response.cookies.set('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: false, // HTTP için false olmalı
      path: '/',
      sameSite: 'lax',
      maxAge: finalRefreshTokenMaxAge, // undefined = session cookie
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    const errorResponse = NextResponse.json(
      { message: 'Error refreshing token' },
      { status: 500 }
    );
    // Hata durumunda çerezleri temizle
    errorResponse.cookies.delete('refresh-token');
    errorResponse.cookies.delete('access-token');
    return errorResponse;
  }
}
