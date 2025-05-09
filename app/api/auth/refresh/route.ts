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

    const response = NextResponse.json(
      { message: 'Tokens refreshed successfully' },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const accessTokenMaxAge = parseExpiry(process.env.ACCESS_TOKEN_EXPIRES_IN || '15m');
    const refreshTokenMaxAge = parseExpiry(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d');

    response.cookies.set('access-token', newAccessToken, {
      httpOnly: true,
      secure: false, // HTTP için false olmalı
      path: '/',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
    });

    response.cookies.set('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: false, // HTTP için false olmalı
      path: '/',
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge,
    });

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    const errorResponse = NextResponse.json(
      { message: 'Error refreshing token' },
      { status: 500 }
    );
    // Hata durumunda da çerezleri temizlemek isteyebilirsiniz
    // errorResponse.cookies.delete('refresh-token');
    // errorResponse.cookies.delete('access-token');
    return errorResponse;
  }
}
