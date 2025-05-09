// lib/jwt-auth.ts
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers'; // Server Components ve Middleware için

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables. Please add it to .env.local');
}
if (!REFRESH_TOKEN_SECRET) {
  throw new Error('REFRESH_TOKEN_SECRET is not defined in environment variables. Please add it to .env.local');
}

export interface UserPayload {
  id: string;
  email: string;
  role: string; // Prisma'daki Role enum'una karşılık gelen string
  // İhtiyaç duyabileceğiniz diğer temel kullanıcı bilgileri
}

export interface DecodedToken extends UserPayload, JwtPayload {}

// Helper: expiresIn string'ini saniyeye çevirir (örn: "15m", "7d")
export function parseExpiry(expiresIn: string): number {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1), 10);
  if (isNaN(value)) return 0; // Geçersiz formatta hata veya varsayılan

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 0; // Bilinmeyen birim
  }
}

// Erişim Token'ı Oluştur
export function generateAccessToken(payload: UserPayload): string {
  return sign(payload, JWT_SECRET!, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

// Yenileme Token'ı Oluştur
export function generateRefreshToken(payload: { id: string }): string { // Refresh token genellikle sadece kullanıcı ID'sini içerir
  return sign(payload, REFRESH_TOKEN_SECRET!, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

// Erişim Token'ı Doğrula
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    return verify(token, JWT_SECRET!) as DecodedToken;
  } catch (error) {
    console.error('Invalid access token:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Yenileme Token'ı Doğrula
export function verifyRefreshToken(token: string): { id: string } & JwtPayload | null {
  try {
    return verify(token, REFRESH_TOKEN_SECRET!) as { id: string } & JwtPayload;
  } catch (error) {
    console.error('Invalid refresh token:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Çerezlerden Erişim Token'ını Al (Middleware ve Server Component'ler için)
export function getAccessTokenFromCookies(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get('access-token')?.value;
}

// Çerezlerden Yenileme Token'ını Al (Middleware ve Server Component'ler için)
export function getRefreshTokenFromCookies(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get('refresh-token')?.value;
}

// Erişim Token'ından Kullanıcı Bilgilerini Al
export function getUserFromAccessToken(token?: string): UserPayload | null {
  const tokenToVerify = token || getAccessTokenFromCookies();
  if (!tokenToVerify) return null;

  const decoded = verifyAccessToken(tokenToVerify);
  if (!decoded) return null;

  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };
}
