import { NextRequest } from 'next/server';
import { verify, decode } from 'jsonwebtoken';
import { prisma } from './prisma';
import { cookies } from 'next/headers';

// JWT token için interface
interface JwtPayload {
  id: string;
  email: string;
  name?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

// Session interface
export interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
    image?: string;
  };
  expires: string;
}

// JWT token'ından kullanıcı bilgilerini çıkaran fonksiyon
export async function getSession(req?: NextRequest) {
  try {
    // Cookie'den token'ı al
    let token;

    if (req) {
      // API route'larında request'ten token al
      token = req.cookies.get('access-token')?.value;
    } else {
      // Server component'lerde cookies() API'sini kullan
      const cookieStore = cookies();
      token = cookieStore.get('access-token')?.value;
    }

    if (!token) {
      return null;
    }

    // Token'ı doğrula
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables');
      return null;
    }
    const decoded = verify(token, jwtSecret) as JwtPayload;

    if (!decoded || !decoded.id) {
      return null;
    }

    // Kullanıcıyı veritabanından al
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });

    if (!user) {
      return null;
    }

    // Session nesnesini oluştur (NextAuth.js formatına benzer)
    return {
      user,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// Client tarafında cookie'den kullanıcı bilgisini al
export function getUserFromCookies(): JwtPayload | null {
  if (typeof window === 'undefined') return null;

  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('access-token='))
    ?.split('=')[1];

  if (!token) return null;

  try {
    const decoded = decode(token) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

// Server component'ler için session bilgisini al
export async function getServerSession(): Promise<Session | null> {
  return getSession();
}
