# Next.js için Kapsamlı JWT Kimlik Doğrulama Entegrasyon Rehberi

Bu rehber, mevcut bir Next.js (App Router) uygulamasına, HttpOnly çerezler, erişim ve yenileme token'ları, middleware ile rota koruması ve client-side context yönetimi içeren kapsamlı bir JWT tabanlı kimlik doğrulama sistemi eklemeniz için adım adım yol gösterecektir.

## 1. Giriş

Modern web uygulamalarında güvenli kimlik doğrulama kritik öneme sahiptir. Bu rehber, JSON Web Token (JWT) kullanarak stateless (sunucuda oturum bilgisi tutmayan) bir kimlik doğrulama sistemi kurmanıza yardımcı olacaktır. Sistemimiz aşağıdaki temel özellikleri içerecektir:
*   **Erişim Token'ları (Access Tokens):** Kısa ömürlü, kaynaklara erişim için kullanılır.
*   **Yenileme Token'ları (Refresh Tokens):** Uzun ömürlü, yeni erişim token'ları almak için kullanılır.
*   **HttpOnly Çerezler:** Token'ların XSS saldırılarına karşı korunması için tarayıcıda güvenli bir şekilde saklanması.
*   **Middleware ile Rota Koruması:** Belirli sayfalara sadece kimliği doğrulanmış kullanıcıların erişebilmesi.
*   **Otomatik Token Yenileme:** Erişim token'ı süresi dolduğunda kullanıcı deneyimini kesintiye uğratmadan yenileme.
*   **Client-Side Context:** Kullanıcı oturum bilgilerini uygulama genelinde kolayca yönetme.
*   **Rol Bazlı Erişim Kontrolü (RBAC) Temeli:** Middleware içinde rol kontrolleri için örnekler.
*   **Güvenlik Başlıkları:** Temel HTTP güvenlik başlıklarının eklenmesi.

## 2. Önkoşullar

*   Mevcut bir Next.js projesi (App Router ile oluşturulmuş).
*   Node.js (LTS versiyonu önerilir) ve npm/pnpm/yarn paket yöneticisi.
*   Kullanıcı verilerini yönetmek için bir veritabanı ve ORM (Bu rehber Prisma'yı varsayacaktır).

## 3. Adım 1: Gerekli Paketlerin Kurulumu

Terminalinizi açın ve projenizin kök dizininde aşağıdaki komutları çalıştırarak gerekli paketleri kurun:

```bash
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```
veya pnpm kullanıyorsanız:
```bash
pnpm add jsonwebtoken bcryptjs
pnpm add --save-dev @types/jsonwebtoken @types/bcryptjs
```

*   `jsonwebtoken`: JWT oluşturmak ve doğrulamak için.
*   `bcryptjs`: Şifreleri güvenli bir şekilde hash'lemek için.
*   `@types/*`: Bu paketler için TypeScript tip tanımlamaları.

## 4. Adım 2: Ortam Değişkenlerinin Ayarlanması

Projenizin kök dizininde `.env.local` adında bir dosya oluşturun (veya varsa açın) ve aşağıdaki değişkenleri ekleyin. **Kalın** yazılmış yerleri kendi güçlü ve benzersiz değerlerinizle değiştirin.

```env
# Veritabanı bağlantı bilgileriniz (Prisma kullanıyorsanız)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# JWT Gizli Anahtarları (ÇOK GÜVENLİ VE BENZERSİZ OLMALI)
JWT_SECRET=COK_GUCLU_VE_BENZERSIZ_BIR_ERISIM_ANAHTARI_YAZIN_BURAYA
REFRESH_TOKEN_SECRET=COK_GUCLU_VE_BENZERSIZ_BIR_YENILEME_ANAHTARI_YAZIN_BURAYA

# Token Geçerlilik Süreleri
ACCESS_TOKEN_EXPIRES_IN=15m   # Örn: 15 dakika
REFRESH_TOKEN_EXPIRES_IN=7d   # Örn: 7 gün

# Uygulamanızın genel URL'i (geliştirme için)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```
**ÖNEMLİ:** `JWT_SECRET` ve `REFRESH_TOKEN_SECRET` için gerçekten güvenli, rastgele ve uzun karakter dizileri kullanın. Bunları oluşturmak için bir parola üretici veya `openssl rand -hex 32` gibi komutlar kullanabilirsiniz. Bu anahtarları asla herkese açık bir şekilde paylaşmayın.

`.env.local` dosyasını oluşturduktan/güncelledikten sonra Next.js geliştirme sunucunuzu yeniden başlatmayı unutmayın.

## 5. Adım 3: Prisma Şeması (Kullanıcı Modeli)

Eğer Prisma kullanıyorsanız, `prisma/schema.prisma` dosyanızda aşağıdaki gibi bir `User` modeline ve `Role` enum'una ihtiyacınız olacaktır:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Veya kullandığınız veritabanı
  url      = env("DATABASE_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String    // Hash'lenmiş şifre burada saklanacak
  name      String?
  role      Role      @default(USER)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Diğer ilişkileriniz...
}

enum Role {
  USER
  ADMIN
  PERSONEL // Örnek ek roller
}

// Gerekirse diğer modelleriniz...
```
Şemanızı güncelledikten sonra Prisma client'ını oluşturmak/güncellemek için aşağıdaki komutu çalıştırın:
```bash
npx prisma generate
```
Eğer veritabanı şemanızı da senkronize etmek istiyorsanız:
```bash
npx prisma db push
```

## 6. Adım 4: JWT Yardımcı Fonksiyonları

`lib` klasörü altında `jwt-auth.ts` adında bir dosya oluşturun ve aşağıdaki içeriği ekleyin:

```typescript
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
  return sign(payload, JWT_SECRET!, { expiresIn: parseExpiry(ACCESS_TOKEN_EXPIRES_IN) });
}

// Yenileme Token'ı Oluştur
export function generateRefreshToken(payload: { id: string }): string { // Refresh token genellikle sadece kullanıcı ID'sini içerir
  return sign(payload, REFRESH_TOKEN_SECRET!, { expiresIn: parseExpiry(REFRESH_TOKEN_EXPIRES_IN) });
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
```
**Not:** `jsonwebtoken` kütüphanesi bazı Node.js API'lerini kullandığı için Edge Runtime'da (örn: Middleware) uyarılar verebilir. Eğer bu sorun olursa, Edge ile tam uyumlu `jose` kütüphanesini kullanmayı düşünebilirsiniz.

## 7. Adım 5: Backend - API Rotaları

`app/api/auth/` dizini altında aşağıdaki API rotalarını oluşturun.

### 7.1. Kullanıcı Kaydı (`app/api/auth/register/route.ts`)

```typescript
// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Prisma client import yolu
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client'; // Prisma'dan gelen Role enum'u

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }
    // İsteğe bağlı: Daha güçlü e-posta ve şifre formatı doğrulaması (örn: Zod ile)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 } // Conflict
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt round önerilir

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: Role.USER, // Varsayılan rol
      },
    });

    const { password: _, ...userWithoutPassword } = newUser; // Yanıttan şifreyi çıkar

    return NextResponse.json(
      { user: userWithoutPassword, message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { message: 'Error creating user', error: errorMessage },
      { status: 500 }
    );
  }
}
```

### 7.2. Kullanıcı Girişi (`app/api/auth/login/route.ts`)

```typescript
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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

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

    response.cookies.set('access-token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
    });

    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      path: '/',
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge,
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { message: 'Error logging in', error: errorMessage },
      { status: 500 }
    );
  }
}
```

### 7.3. Kullanıcı Çıkışı (`app/api/auth/logout/route.ts`)

```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) { // Genellikle POST ile yapılır
  try {
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Çerezleri silmek için maxAge: -1 veya expires ile geçmiş bir tarih kullanılır
    response.cookies.set('access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: -1,
    });

    response.cookies.set('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      maxAge: -1,
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { message: 'Error logging out', error: errorMessage },
      { status: 500 }
    );
  }
}
```

### 7.4. Token Yenileme (`app/api/auth/refresh/route.ts`)

```typescript
// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken, // Bu importu ekleyin
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
      secure: isProduction,
      path: '/',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge,
    });

    response.cookies.set('refresh-token', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
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
```

### 7.5. Mevcut Kullanıcı Bilgilerini Alma (`app/api/auth/me/route.ts`)

```typescript
// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, UserPayload } from '@/lib/jwt-auth';
// İsteğe bağlı: Prisma'dan daha fazla kullanıcı detayı çekmek için
// import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access-token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Access token not found. User not authenticated.' },
        { status: 401 }
      );
    }

    const decodedUser = verifyAccessToken(accessToken);

    if (!decodedUser) {
      return NextResponse.json(
        { message: 'Invalid or expired access token.' },
        { status: 401 }
      );
    }

    // Token geçerli, kullanıcı bilgilerini döndür
    // UserPayload zaten id, email, role içeriyor.
    // Daha fazla bilgi (örn: name) için veritabanından çekebilirsiniz:
    // const userFromDb = await prisma.user.findUnique({ where: { id: decodedUser.id }, select: { name: true } });
    // const userToReturn = { ...decodedUser, name: userFromDb?.name };

    return NextResponse.json({ user: decodedUser }, { status: 200 });

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { message: 'Error fetching current user' },
      { status: 500 }
    );
  }
}
```

## 8. Adım 6: Middleware ile Rota Koruması

Projenizin kök dizininde `middleware.ts` adında bir dosya oluşturun (veya varsa güncelleyin):

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, UserPayload } from '@/lib/jwt-auth';

const AUTH_PAGES = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const PROTECTED_ROOT = '/dashboard'; // Giriş sonrası varsayılan yönlendirme
const PUBLIC_PATHS = ['/', '/api/health']; // Herkese açık temel yollar (örneğin ana sayfa)

const isAuthPage = (path: string) => AUTH_PAGES.some(page => path.startsWith(page));
const isApiPath = (path: string) => path.startsWith('/api/');
const isApiAuthPath = (path: string) => path.startsWith('/api/auth/');
const isStaticAsset = (path: string) => path.startsWith('/_next/') || path.startsWith('/favicon.ico') || path.startsWith('/logo.svg'); // Örnek statik varlıklar

const isCompletelyPublicPath = (path: string) => PUBLIC_PATHS.includes(path) || isStaticAsset(path) || isApiAuthPath(path);


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access-token')?.value;
  let user: UserPayload | null = null;

  if (accessToken) {
    user = verifyAccessToken(accessToken);
  }

  // API rotaları için (auth API'leri hariç)
  if (isApiPath(pathname) && !isApiAuthPath(pathname)) {
    // Eğer korumak istediğiniz özel API'ler varsa burada kontrol ekleyebilirsiniz.
    // Örn: if (pathname.startsWith('/api/protected-data') && !user) {
    //   return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    // }
    // Şimdilik diğer API'ler için özel bir işlem yapmıyoruz, kendi içlerinde koruma yapabilirler.
    return NextResponse.next();
  }

  // Eğer kullanıcı giriş yapmışsa (geçerli token'ı varsa)
  if (user) {
    if (isAuthPage(pathname)) {
      // Giriş yapmış kullanıcı auth sayfalarına gitmeye çalışırsa dashboard'a yönlendir
      console.log(`Middleware: Authenticated user on auth page (${pathname}). Redirecting to ${PROTECTED_ROOT}`);
      return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url));
    }

    // Rol tabanlı erişim kontrolü (Örnekler)
    if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
      console.log(`Middleware: Non-ADMIN user (Role: ${user.role}) attempt to access admin page (${pathname}). Redirecting to ${PROTECTED_ROOT}`);
      return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url)); // Veya bir "yetkisiz erişim" sayfasına
    }
    if (user.role === "PERSONEL" && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      console.log(`Middleware: PERSONEL user attempt to access restricted page (${pathname}). Redirecting to /exam`);
      return NextResponse.redirect(new URL('/exam', request.url)); // PERSONEL için varsayılan sayfa
    }

    // Diğer korumalı sayfalara erişim izni
    const response = NextResponse.next();
    // Güvenlik başlıklarını ekle
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    return response;
  }

  // Eğer kullanıcı giriş yapmamışsa (veya token geçersizse)
  // ve erişmeye çalıştığı sayfa tamamen public değilse ve auth sayfası da değilse
  if (!isCompletelyPublicPath(pathname) && !isAuthPage(pathname)) {
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (refreshToken) {
      try {
        const absoluteRefreshUrl = new URL('/api/auth/refresh', request.url).toString();
        const refreshResponse = await fetch(absoluteRefreshUrl, {
          method: 'POST',
          headers: {
            'Cookie': `refresh-token=${refreshToken}`
          }
        });

        if (refreshResponse.ok) {
          console.log('Middleware: Access token refreshed successfully via middleware.');
          // /api/auth/refresh endpoint'i yeni çerezleri (access ve refresh) set etti.
          // Tarayıcının bu yeni çerezlerle orijinal isteği tekrar yapmasını sağlamak için
          // mevcut isteği yeniden yazıyoruz (URL değişmez, içerik yeniden istenir).
          return NextResponse.rewrite(request.nextUrl);
        } else {
          console.log('Middleware: Refresh token failed. Clearing cookies and redirecting to login.');
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('callbackUrl', pathname);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete('access-token');
          response.cookies.delete('refresh-token');
          return response;
        }
      } catch (e) {
        console.error('Middleware: Error during token refresh fetch:', e);
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('access-token');
        response.cookies.delete('refresh-token');
        return response;
      }
    }

    // Refresh token yoksa veya refresh işlemi başarısızsa, login'e yönlendir
    console.log(`Middleware: No valid session. Redirecting to login for path: ${pathname}`);
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Diğer tüm durumlar için (public sayfalar, auth sayfaları vs.) isteğe devam et
  const response = NextResponse.next();
  // Public sayfalara da güvenlik başlıklarını ekle
  if (!isApiPath(pathname)) { // API yanıtları hariç
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Aşağıdakiler hariç TÜM istek yollarıyla eşleştir:
     * - _next/static (statik dosyalar)
     * - _next/image (resim optimizasyon dosyaları)
     * - favicon.ico (favicon dosyası)
     * - logo.svg (logo dosyası)
     * - /api/auth/* (kimlik doğrulama API'leri kendileri yönetir)
     * - /api/health (genel sağlık kontrolü)
     * Amacımız, sayfa gezintilerini ve korunması gereken API'leri yakalamak.
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.svg).*)',
  ],
};
```
**Not:** `matcher` konfigürasyonu, middleware'in hangi rotalarda çalışacağını belirler. Yukarıdaki örnek, statik varlıklar hariç çoğu rotayı kapsar. `api/auth` ve `api/health` gibi bazı API rotalarını hariç tutmak için `isCompletelyPublicPath` gibi yardımcı fonksiyonlar kullanıldı.

## 9. Adım 7: Frontend - Client-Side Kimlik Doğrulama Context'i

Kullanıcı oturum bilgilerini uygulama genelinde yönetmek için bir React Context oluşturacağız.

### 9.1. Yükleme Ekranı (Opsiyonel ama Önerilir)

Kullanıcı deneyimini iyileştirmek için bir yükleme ekranı bileşeni oluşturun.
`components/ui/loading-screen.tsx`:
```tsx
// components/ui/loading-screen.tsx
'use client';

import React from 'react';

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Yarı saydam arka plan
      zIndex: 9999, // Diğer her şeyin üzerinde
      color: 'white',
      fontSize: '2em',
      // İstediğiniz gibi stilize edebilirsiniz
    }}>
      Yükleniyor...
    </div>
  );
};
```

### 9.2. Yükleme Provider'ı (`providers/loading-provider.tsx`)

`providers` klasörü altında `loading-provider.tsx` adında bir dosya oluşturun:
```tsx
// providers/loading-provider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/loading-screen'; // Yolu güncelleyin

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false); // Başlangıçta false
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sayfa (route) değişikliklerini izle
  useEffect(() => {
    // Bu, Next.js'in kendi sayfa geçiş yüklemesini taklit eder.
    // Gerçek sayfa yüklemesi bittiğinde (yeni sayfa render edildiğinde) false olur.
    // Ancak, API istekleri gibi asenkron işlemler için manuel kontrol gerekir.
    // Şimdilik, rota değiştiğinde loading'i false yapıyoruz,
    // çünkü AuthProvider gibi diğer provider'lar kendi yükleme durumlarını yönetecek.
    setIsLoading(false);
  }, [pathname, searchParams]);


  // Bu provider, AuthProvider gibi diğer provider'ların
  // setIsLoading'i çağırarak global yükleme ekranını tetiklemesine olanak tanır.

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      <LoadingScreen isLoading={isLoading} />
    </LoadingContext.Provider>
  );
};
```

### 9.3. Auth Provider (`providers/auth-provider.tsx`)

`providers` klasörü altında `auth-provider.tsx` adında bir dosya oluşturun:
```tsx
// providers/auth-provider.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { UserPayload } from '@/lib/jwt-auth';
import { useLoading } from '@/providers/loading-provider'; // LoadingProvider'dan hook'u import et

interface AuthContextType {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Bu, Auth işlemlerinin yüklenme durumudur
  login: (email: string, password: string) => Promise<UserPayload | null>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<UserPayload | null>;
  fetchUser: () => Promise<UserPayload | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const { setIsLoading: setGlobalIsLoading, isLoading: isGlobalLoading } = useLoading();

  const fetchUserCallback = useCallback(async (): Promise<UserPayload | null> => {
    setGlobalIsLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return data.user;
      } else {
        setUser(null);
        if (response.status !== 401) { // 401 normal, diğer hataları logla
          console.error('Auth Provider: Failed to fetch user:', response.status, await response.text());
        } else {
          console.log('Auth Provider: No active session found (fetchUser).');
        }
      }
    } catch (error) {
      console.error('Auth Provider: Error fetching user:', error);
      setUser(null);
    } finally {
      setGlobalIsLoading(false);
    }
    return null;
  }, [setGlobalIsLoading]);

  useEffect(() => {
    // Sayfa ilk yüklendiğinde kullanıcıyı çekmeyi dene
    fetchUserCallback();
  }, [fetchUserCallback]);

  const login = async (email: string, password: string): Promise<UserPayload | null> => {
    setGlobalIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user); // Kullanıcı state'ini güncelle
        return data.user;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      setUser(null); // Hata durumunda kullanıcıyı temizle
      console.error('Login error:', error);
      throw error;
    } finally {
      setGlobalIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name?: string): Promise<UserPayload | null> => {
    setGlobalIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Registration successful:', data.message);
        // Kayıt sonrası otomatik giriş yapılmaz, kullanıcı login olmalı.
        return data.user;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setGlobalIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setGlobalIsLoading(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null); // Her durumda kullanıcıyı client'tan temizle
      // throw error; // İsteğe bağlı: UI'da hata göstermek için
    } finally {
      setGlobalIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isGlobalLoading, // Global yükleme durumunu kullan
        login,
        logout,
        register,
        fetchUser: fetchUserCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 10. Adım 8: Provider'ları Kök Düzene Entegre Etme

`app/layout.tsx` dosyanızı açın ve `AuthProvider` ile `LoadingProvider`'ı uygulamanızı sarmalayacak şekilde ekleyin:

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css"; // Global stilleriniz
import { Metadata } from "next";
import { AuthProvider } from "@/providers/auth-provider"; // Yolu kontrol edin
import { LoadingProvider } from "@/providers/loading-provider"; // Yolu kontrol edin
// Varsa diğer global provider'larınız (örn: ThemeProvider)
// import ClientProviders from "@/app/client-providers"; // Eğer böyle bir yapınız varsa

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Uygulama Adınız",
  description: "Uygulama Açıklamanız",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <LoadingProvider> {/* LoadingProvider en dışta */}
          <AuthProvider>  {/* AuthProvider, LoadingProvider içinde */}
            {/* <ClientProviders> Eğer varsa */}
              {children}
            {/* </ClientProviders> Eğer varsa */}
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
```
Eğer `ClientProviders` gibi bir dosyanız varsa, provider'ları onun içine de yerleştirebilirsiniz, önemli olan `LoadingProvider`'ın `AuthProvider`'ı sarmalamasıdır.

## 11. Adım 9: `useAuth` Hook'unun Bileşenlerde Kullanımı

### 11.1. Login Sayfası Örneği (`app/(auth)/login/page.tsx`)

```tsx
// app/(auth)/login/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth(); // isLoading'i AuthContext'ten alıyoruz
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const user = await login(email, password);
      if (user) {
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'; // Giriş sonrası yönlendirme
        router.push(callbackUrl);
      } else {
        // Bu durum login fonksiyonu hata fırlatırsa yakalanır
      }
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      console.error("Login page error:", err);
    }
  };

  return (
    <div>
      <h1>Giriş Yap</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">E-posta:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Şifre:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
      {/* Kayıt sayfasına link vb. */}
    </div>
  );
}
```

### 11.2. Header'da Kullanıcı Bilgisi ve Çıkış Butonu Örneği

```tsx
// components/layout/Header.tsx (veya benzeri bir bileşen)
'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login'); // Çıkış sonrası login sayfasına yönlendir
  };

  return (
    <header>
      <nav>
        <Link href="/">Ana Sayfa</Link>
        {isLoading ? (
          <p>Oturum kontrol ediliyor...</p>
        ) : isAuthenticated && user ? (
          <>
            <span>Merhaba, {user.name || user.email}! (Rol: {user.role})</span>
            <Link href="/dashboard">Dashboard</Link>
            {user.role === 'ADMIN' && <Link href="/admin">Admin Paneli</Link>}
            <button onClick={handleLogout}>Çıkış Yap</button>
          </>
        ) : (
          <>
            <Link href="/auth/login">Giriş Yap</Link>
            <Link href="/auth/register">Kayıt Ol</Link>
          </>
        )}
      </nav>
    </header>
  );
}
```

## 12. Adım 10: Güvenlik Best Practice'leri ve Dikkat Edilmesi Gerekenler

*   **Güçlü Gizli Anahtarlar:** `.env.local` dosyasındaki `JWT_SECRET` ve `REFRESH_TOKEN_SECRET` anahtarlarınızın çok güçlü ve benzersiz olduğundan emin olun. Asla kod içinde veya herkese açık repolarda paylaşmayın.
*   **HTTPS (Production):** Canlı (production) ortamda uygulamanızı mutlaka HTTPS üzerinden sunun. Bu, token'ların ve diğer hassas verilerin ağ üzerinde şifrelenmesini sağlar. `secure: true` çerez ayarı sadece HTTPS'te çalışır.
*   **Kapsamlı Girdi Doğrulaması:** Tüm API endpoint'lerinizde (özellikle `register` ve `login`) gelen verileri dikkatlice doğrulayın (örn: e-posta formatı, şifre karmaşıklığı). `zod` gibi kütüphaneler bu konuda yardımcı olabilir.
*   **Hız Sınırlama (Rate Limiting):** Özellikle `login`, `register` ve şifre sıfırlama gibi hassas endpoint'lere yönelik kaba kuvvet saldırılarını önlemek için hız sınırlama uygulayın. Bu rehberde basit bir örnek verilmemiştir, ancak `@upstash/ratelimit` gibi Edge uyumlu çözümler veya Vercel gibi platformların sunduğu özellikler kullanılabilir.
*   **CSRF Koruması:** `HttpOnly` ve `SameSite='Lax'` (veya `Strict`) çerezler temel bir CSRF koruması sağlar. Daha karmaşık senaryolar için (örn: state değiştiren GET istekleri veya iframe kullanımı) ek önlemler (örn: double-submit cookie, synchronizer token pattern) gerekebilir.
*   **Bağımlılıkları Güncel Tutun:** `jsonwebtoken`, `bcryptjs` gibi güvenlik kütüphanelerini ve Next.js'in kendisini düzenli olarak güncelleyerek bilinen zafiyetlere karşı korunun.
*   **Content Security Policy (CSP):** XSS ve diğer bazı saldırı türlerini engellemek için HTTP `Content-Security-Policy` başlığını dikkatlice yapılandırın. Bu, uygulamanızın hangi kaynaklardan içerik (script, stil, resim vb.) yükleyebileceğini kısıtlar.
*   **Yenileme Token'ı Yeniden Kullanım Tespiti (Advanced):** Daha gelişmiş bir güvenlik önlemi olarak, yenileme token'ları veritabanında takip edilerek, bir token'ın birden fazla kez kullanılmaya çalışılması durumunda (potansiyel çalınma belirtisi) o kullanıcıya ait tüm oturumların geçersiz kılınması sağlanabilir.

## 13. Sorun Giderme (Troubleshooting)

*   **`JWT_SECRET is not defined...` Hatası:** `.env.local` dosyanızı oluşturduğunuzdan/güncellediğinizden ve Next.js geliştirme sunucunuzu yeniden başlattığınızdan emin olun.
*   **`ERR_TOO_MANY_REDIRECTS` Hatası:** Genellikle `middleware.ts` dosyasındaki yönlendirme mantığında bir döngü olduğunu gösterir. Middleware loglarını ve koşullarını dikkatlice inceleyin.
*   **401 (Unauthorized) Hataları:** Token'ın süresi dolmuş, geçersiz veya hiç gönderilmemiş olabilir. Tarayıcı çerezlerini ve middleware/API loglarını kontrol edin.
*   **403 (Forbidden) Hataları:** Kimlik doğrulama başarılı olsa bile kullanıcının o kaynağa erişim yetkisi olmadığını gösterir. Rol bazlı kontrolleri ve middleware mantığını gözden geçirin.

## 14. Sonuç

Bu rehberdeki adımları izleyerek Next.js uygulamanıza güvenli ve modern bir JWT tabanlı kimlik doğrulama sistemi entegre etmiş olmalısınız. Unutmayın ki güvenlik sürekli bir süreçtir; uygulamanızı ve bağımlılıklarınızı güncel tutmak, yeni tehditlere karşı tetikte olmak önemlidir.

Bu temel üzerine, iki faktörlü kimlik doğrulama (2FA), sosyal medya ile giriş (OAuth), şifre sıfırlama gibi ek özellikler de geliştirebilirsiniz.
