import { NextRequest, NextResponse } from 'next/server';

const AUTH_PAGES = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const PROTECTED_ROOT = '/dashboard'; // Giriş sonrası varsayılan yönlendirme
const PUBLIC_PATHS = ['/', '/api/health']; // Herkese açık temel yollar

const isAuthPage = (path: string) => AUTH_PAGES.some(page => path.startsWith(page));
const isPublicPath = (path: string) => PUBLIC_PATHS.includes(path) || path.startsWith('/_next') || path.startsWith('/favicon.ico') || path.startsWith('/logo.svg') || path.startsWith('/api/auth/'); // API auth rotaları da public olmalı

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access-token')?.value;

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


  // Eğer kullanıcı giriş yapmışsa (token varsa)
  if (accessToken) {
    // Token doğrulamasını API üzerinden yapalım
    try {
      const verifyResponse = await fetch(new URL('/api/auth/verify', request.url).toString(), {
        method: 'GET',
        headers: {
          'Cookie': `access-token=${accessToken}`
        }
      });

      // Token doğrulama yanıtını kontrol et
      if (verifyResponse.ok) {
        // Eğer URL'de refresh_count parametresi varsa, temizle
        if (request.nextUrl.searchParams.has('refresh_count')) {
          const cleanUrl = new URL(request.url);
          cleanUrl.searchParams.delete('refresh_count');
          return NextResponse.redirect(cleanUrl);
        }
        const userData = await verifyResponse.json();

        // Giriş yapmış kullanıcı auth sayfalarına gitmeye çalışırsa dashboard'a yönlendir
        if (isAuthPage(pathname)) {
          return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url));
        }

        // Rol hiyerarşisi: PERSONEL < USER < ADMIN < SUPERADMIN

        // Rol yönetimi sayfasını sadece SUPERADMIN görebilir
        if (pathname.startsWith('/dashboard/roles') && userData.role !== 'SUPERADMIN') {
          console.log(`Middleware: Non-SUPERADMIN user (Role: ${userData.role}) attempt to access ${pathname}. Redirecting to ${PROTECTED_ROOT}`);
          return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url));
        }

        // Admin sayfalarına sadece ADMIN ve SUPERADMIN erişebilir
        if (pathname.startsWith('/admin') && userData.role !== 'ADMIN' && userData.role !== 'SUPERADMIN') {
          console.log(`Middleware: Non-ADMIN user (Role: ${userData.role}) attempt to access ${pathname}. Redirecting to ${PROTECTED_ROOT}`);
          return NextResponse.redirect(new URL(PROTECTED_ROOT, request.url));
        }

        // PERSONEL ve USER rolüne sahip kullanıcılar sadece /exam sayfasına erişebilir
        if (userData.role === "PERSONEL" || userData.role === "USER") {
          if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
            console.log(`Middleware: Redirecting ${userData.role} user from ${pathname} to /exam`);
            return NextResponse.redirect(new URL('/exam', request.url));
          }
        }

        // Diğer korumalı sayfalara erişim izni
        return NextResponse.next();
      }
    } catch (e) {
      console.error('Middleware: Error during token verification:', e);
    }
  }

  // Eğer kullanıcı giriş yapmamışsa (veya token geçersizse)
  // ve erişmeye çalıştığı sayfa public değilse ve auth sayfası da değilse
  if (!isPublicPath(pathname) && !isAuthPage(pathname)) {
    // Refresh token mekanizmasını burada implemente edebiliriz
    const refreshToken = request.cookies.get('refresh-token')?.value;

    if (refreshToken) {
      // Eğer URL'de refresh_count parametresi varsa ve değeri 3 veya daha fazlaysa,
      // doğrudan login sayfasına yönlendir
      const refreshCount = parseInt(request.nextUrl.searchParams.get('refresh_count') || '0');
      if (refreshCount >= 3) {
        console.log('Middleware: Too many refresh attempts detected. Redirecting to login.');
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('access-token');
        response.cookies.delete('refresh-token');
        return response;
      }

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

          // Refresh endpoint'inin set ettiği çerezleri bu yanıta kopyala
          const setCookieHeader = refreshResponse.headers.get('set-cookie');
          if (setCookieHeader) {
            // Tüm set-cookie başlıklarını al
            const cookies = setCookieHeader.split(', ');

            // Her bir çerezi response'a ekle
            cookies.forEach(cookie => {
              response.headers.append('set-cookie', cookie);
            });

            console.log('Middleware: Copied cookies from refresh response');
          }

          // Yönlendirme döngüsünü kırmak için
          // Eğer URL'de refresh_count parametresi varsa, bu bir yenileme döngüsü olabilir
          const refreshCount = parseInt(request.nextUrl.searchParams.get('refresh_count') || '0');

          if (refreshCount >= 3) {
            // Çok fazla yenileme denemesi yapıldı, kullanıcıyı login sayfasına yönlendir
            console.log('Middleware: Too many refresh attempts. Redirecting to login.');
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            const response = NextResponse.redirect(loginUrl);
            response.cookies.delete('access-token');
            response.cookies.delete('refresh-token');
            return response;
          }

          // Yenileme sayacını artır ve orijinal URL'e yönlendir
          const redirectUrl = new URL(request.url);
          redirectUrl.searchParams.set('refresh_count', (refreshCount + 1).toString());
          return NextResponse.redirect(redirectUrl);
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
