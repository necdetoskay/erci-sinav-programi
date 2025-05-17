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
  console.log("[Session] getSession fonksiyonu çağrıldı:", new Date().toISOString());
  const startTime = performance.now();

  try {
    // Cookie'den token'ı al
    let token;

    if (req) {
      // API route'larında request'ten token al
      console.log("[Session] API route'tan token alınıyor...");
      token = req.cookies.get('access-token')?.value;
      console.log("[Session] API route'tan alınan token:", token ? "Token var" : "Token yok");
    } else {
      // Server component'lerde cookies() API'sini kullan
      console.log("[Session] Server component'ten token alınıyor...");
      const cookieStore = cookies();
      token = cookieStore.get('access-token')?.value;
      console.log("[Session] Server component'ten alınan token:", token ? "Token var" : "Token yok");
    }

    if (!token) {
      console.log("[Session] Token bulunamadı, null dönülüyor");
      return null;
    }

    // Token'ı doğrula
    console.log("[Session] Token doğrulanıyor...");
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Session] JWT_SECRET is not defined in environment variables');
      return null;
    }

    try {
      const decoded = verify(token, jwtSecret) as JwtPayload;
      console.log("[Session] Token doğrulandı, kullanıcı ID:", decoded.id);

      if (!decoded || !decoded.id) {
        console.log("[Session] Geçersiz token içeriği, null dönülüyor");
        return null;
      }

      // Kullanıcıyı veritabanından al
      console.log("[Session] Kullanıcı veritabanından alınıyor, ID:", decoded.id);
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
        console.log("[Session] Kullanıcı veritabanında bulunamadı, null dönülüyor");
        return null;
      }

      console.log("[Session] Kullanıcı bulundu:", user.email, "Rol:", user.role);

      // Session nesnesini oluştur (NextAuth.js formatına benzer)
      const session = {
        user,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 gün
      };

      const endTime = performance.now();
      console.log(`[Session] Session oluşturuldu, süre: ${(endTime - startTime).toFixed(2)}ms`);

      return session;
    } catch (tokenError) {
      console.error('[Session] Token doğrulama hatası:', tokenError);
      return null;
    }
  } catch (error) {
    console.error('[Session] Session verification error:', error);

    if (error instanceof Error) {
      console.error('[Session] Hata mesajı:', error.message);
      console.error('[Session] Hata stack:', error.stack);
    }

    const endTime = performance.now();
    console.log(`[Session] Hata ile sonlandı, süre: ${(endTime - startTime).toFixed(2)}ms`);

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
  console.log("[Session] getServerSession fonksiyonu çağrıldı:", new Date().toISOString());
  const session = await getSession();
  console.log("[Session] getServerSession sonucu:", session ? `Kullanıcı: ${session.user.email}` : "Session yok");
  return session;
}
