// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  UserPayload,
  parseExpiry,
} from '@/lib/jwt-auth';
// Role enum'unu import etmeye gerek yok eğer UserPayload'da string ise

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    console.log("Login attempt:", { email, rememberMe });

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User not found: ${email}`);
      return NextResponse.json(
        { message: 'Geçersiz e-posta veya şifre' },
        { status: 401 }
      );
    }

    if (!user.password) {
      console.log(`User has no password: ${email}`);
      return NextResponse.json(
        { message: 'Kullanıcı şifresi ayarlanmamış. Lütfen sistem yöneticisiyle iletişime geçin.' },
        { status: 401 }
      );
    }

    // E-posta doğrulaması kontrolü
    if (!user.emailVerified) {
      console.log(`User email not verified: ${email}`);
      return NextResponse.json(
        {
          message: 'Hesabınız henüz onaylanmamıştır. Lütfen sistem yöneticisiyle iletişime geçin.',
          needsVerification: true,
          email: user.email
        },
        { status: 403 } // Forbidden
      );
    }

    console.log(`Comparing password for user: ${email}`);
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${email}`);
      return NextResponse.json(
        { message: 'Geçersiz e-posta veya şifre' },
        { status: 401 }
      );
    }

    console.log(`Password valid for user: ${email}, role: ${user.role}`);

    const userPayload: UserPayload = {
      id: user.id,
      email: user.email,
      role: user.role, // Prisma'daki Role enum değerini string olarak alır
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken({ id: user.id });

    const response = NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        message: 'Login successful',
      },
      { status: 200 }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    const accessTokenMaxAge = parseExpiry(process.env.ACCESS_TOKEN_EXPIRES_IN || '15m');
    const refreshTokenMaxAge = parseExpiry(process.env.REFRESH_TOKEN_EXPIRES_IN || '7d');

    // Remember Me özelliği için maxAge değerini ayarla
    console.log("Remember Me value:", rememberMe, typeof rememberMe);
    const finalAccessTokenMaxAge = rememberMe ? accessTokenMaxAge : undefined; // undefined = session cookie
    const finalRefreshTokenMaxAge = rememberMe ? refreshTokenMaxAge : undefined;
    console.log("Token maxAge values:", { finalAccessTokenMaxAge, finalRefreshTokenMaxAge });

    response.cookies.set('access-token', accessToken, {
      httpOnly: true,
      secure: false, // HTTP için false olmalı
      path: '/',
      sameSite: 'lax',
      maxAge: finalAccessTokenMaxAge,
    });

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: false, // HTTP için false olmalı
      path: '/',
      sameSite: 'lax',
      maxAge: finalRefreshTokenMaxAge,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);

    // Daha detaylı hata mesajı
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Error details:', errorMessage);

    if (error instanceof Error && error.stack) {
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      { message: 'Giriş yapılırken bir hata oluştu', error: errorMessage },
      { status: 500 }
    );
  }
}
