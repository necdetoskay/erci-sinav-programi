import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, UserPayload } from '@/lib/jwt-auth'; // getUserFromAccessToken yerine verifyAccessToken kullanacağız

const AUTH_PAGES = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const PROTECTED_ROOT = '/dashboard'; // Giriş sonrası varsayılan yönlendirme
const PUBLIC_PATHS = ['/', '/api/health']; // Herkese açık temel yollar

const isAuthPage = (path: string) => AUTH_PAGES.some(page => path.startsWith(page));
const isPublicPath = (path: string) => PUBLIC_PATHS.includes(path) || path.startsWith('/_next') || path.startsWith('/favicon.ico') || path.startsWith('/logo.svg') || path.startsWith('/api/auth/'); // API auth rotaları da public olmalı

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access-token')?.value;
  let user: UserPayload | null = null;

  if (accessToken) {
    user = verifyAccessToken(accessToken);
  }

  // API rotaları için özel bir işlem yapmıyoruz, onlar kendi içinde token kontrolü yapabilir
  // veya bu middleware'den sonra çalışacak şekilde ayarlanabilir.
  // Şimdilik API auth rotaları hariç diğer API'leri korumuyoruz.
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    // Örnek: /api/dashboard/* gibi rotaları korumak için
    // if (!user && pathname.startsWith('/api/dashboard')) {
    //   return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    // }
    return NextResponse.next(); // Diğer API'ler için şimdilik geçiş izni
  }


  // Eğer kullanıcı giriş yapmışsa (geçerli token'ı varsa)
  if (user) {
    // Giriş yapmış kullanıcı auth sayfalarına gitmeye çalışırsa dashboard'a yönlendir
    if (isAuthPage(pathname)) {
      return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url));
    }

    // Rol tabanlı erişim kontrolü (Örnek: ADMIN rolü)
    if (pathname.startsWith('/admin') && user.role !== 'ADMIN') {
      // Admin olmayanları dashboard'a veya bir "yetkisiz erişim" sayfasına yönlendir
      console.log(`Middleware: Non-ADMIN user (Role: ${user.role}) attempt to access ${pathname}. Redirecting to ${PROTECTED_ROOT}`);
      return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url));
    }
    
    // PERSONEL rolüne sahip kullanıcılar sadece /exam sayfasına erişebilir
    if (user.role === "PERSONEL" && pathname.startsWith('/dashboard')) {
      console.log(`Middleware: Redirecting PERSONEL user from /dashboard to /exam`);
      return NextResponse.redirect(new URL('/exam', request.url));
    }
     if (user.role === "PERSONEL" && pathname.startsWith('/admin')) {
      console.log(`Middleware: Redirecting PERSONEL user from /admin to /exam`);
      return NextResponse.redirect(new URL('/exam', request.url));
    }


    // Diğer korumalı sayfalara erişim izni
    return NextResponse.next();
  }

  // Eğer kullanıcı giriş yapmamışsa (veya token geçersizse)
  // ve erişmeye çalıştığı sayfa public değilse ve auth sayfası da değilse
  if (!isPublicPath(pathname) && !isAuthPage(pathname)) {
    // Refresh token mekanizmasını burada implemente edebiliriz
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (refreshToken) {
      try {
        // API route'u Next.js 13+ fetch ile çağır
        const refreshResponse = await fetch(new URL('/api/auth/refresh', request.url).toString(), {
          method: 'POST',
          headers: {
            'Cookie': `refresh-token=${refreshToken}` // Refresh token'ı cookie olarak gönder
          }
        });

        if (refreshResponse.ok) {
          console.log('Middleware: Access token refreshed successfully.');
          // Yeni access token çerezi refresh endpoint'i tarafından set edilecek.
          // Orijinal isteği yeni token ile devam ettirmek için,
          // NextReponse.next() ile birlikte yeni çerezleri de set etmemiz gerekebilir
          // ya da sayfayı yeniden yüklemesini sağlayabiliriz.
          // Şimdilik, refresh endpoint'inin çerezi set ettiğini varsayarak,
          // kullanıcıyı orijinal hedefine yönlendirelim.
          // Ancak, refresh endpoint'i sadece access token'ı set ediyor,
          // bu yüzden bu response'a yeni access token'ı eklememiz lazım.
          // Refresh endpoint'i response body'sinde yeni token'ı döndürmüyor, sadece cookie'ye set ediyor.
          // Bu durumda, en basit çözüm, sayfayı yeniden yükleterek tarayıcının yeni çerezi almasını sağlamak
          // veya isteği tekrarlamaktır.
          
          // Daha iyi bir yaklaşım: refresh endpoint'i yeni token'ı DÖNDÜRMEZ, SADECE COOKIE'YE SET EDER.
          // Bu durumda, middleware'in yapabileceği en iyi şey, isteği devam ettirmek ve
          // bir sonraki istekte yeni token'ın kullanılmasını ummaktır.
          // VEYA, refresh endpoint'inden gelen çerezleri bu yanıta ekleyebiliriz.

          const response = NextResponse.redirect(request.url); // Orijinal URL'e yönlendir

          // Refresh endpoint'inin set ettiği 'access-token' çerezini bu yanıta kopyala
          const newAccessTokenCookie = refreshResponse.headers.get('set-cookie');
          if (newAccessTokenCookie) {
             // Birden fazla set-cookie başlığı olabilir, doğru olanı bulmamız gerek.
            const cookies = newAccessTokenCookie.split(', ');
            cookies.forEach(cookie => {
                if (cookie.startsWith('access-token=')) {
                    response.headers.append('set-cookie', cookie);
                }
            });
          }
          // Refresh token'ın kendisi de güncellenmiş olabilir (rolling refresh tokens)
          // Onu da kontrol edip ekleyebiliriz. Şimdilik sadece access token'a odaklanalım.

          // Yönlendirme döngüsünü kırmak için rewrite kullanalım.
          // /api/auth/refresh endpoint'i yeni access token çerezini set etmiş olmalı.
          // rewrite, URL'i değiştirmeden mevcut isteği işler.
          return NextResponse.rewrite(request.nextUrl); 
        } else {
          console.log('Middleware: Refresh token failed. Clearing cookies and redirecting to login.');
          // Refresh token geçersizse, çerezleri temizle ve login'e yönlendir
          const loginUrl = new URL('/auth/login', request.url);
          loginUrl.searchParams.set('callbackUrl', pathname);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete('access-token');
          response.cookies.delete('refresh-token');
          return response;
        }
      } catch (e) {
        console.error('Middleware: Error during token refresh fetch:', e);
        // Fetch hatası olursa da login'e yönlendir
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
    loginUrl.searchParams.set('callbackUrl', pathname); // Kullanıcıyı giriş sonrası orijinal sayfaya yönlendir
    return NextResponse.redirect(loginUrl);
  }

  // Diğer tüm durumlar için (public sayfalar, auth sayfaları vs.) isteğe devam et
  const response = NextResponse.next();

  // Güvenlik başlıklarını ekle (API rotaları hariç HTML sayfaları için daha anlamlı)
  if (!pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY'); // Veya 'SAMEORIGIN' eğer iframe içinde kendi domaininizden içerik gösterecekseniz
    response.headers.set('X-XSS-Protection', '1; mode=block');
    // response.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"); // CSP'yi dikkatlice yapılandırın
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
     * - API rotaları (şimdilik /api/auth/* hariç middleware'den muaf tutuluyor, kendi içlerinde koruma yapabilirler)
     * Amacımız, sayfa gezintilerini ve belirli API'leri (gerekirse) yakalamak.
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|api/auth/|api/health).*)',
    // Ana sayfa da dahil olsun
    '/',
  ],
};
