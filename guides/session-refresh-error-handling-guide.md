# Next.js Uygulamalarında Oturum Yenileme ve Gelişmiş Hata Yönetimi Rehberi

Bu rehber, Next.js uygulamalarınızda oturum yönetimi ve API isteklerinde gelişmiş hata işleme mekanizmaları uygulamanıza yardımcı olacaktır.

## İçindekiler

1. [Giriş](#giriş)
2. [Neden Gelişmiş Oturum Yönetimi ve Hata İşleme Önemlidir?](#neden-gelişmiş-oturum-yönetimi-ve-hata-işleme-önemlidir)
3. [Oturum Yenileme Sayfası Oluşturma](#oturum-yenileme-sayfası-oluşturma)
4. [API İsteklerinde Gelişmiş Hata İşleme](#api-isteklerinde-gelişmiş-hata-işleme)
5. [Sağlık Kontrolü API'si Oluşturma](#sağlık-kontrolü-apisi-oluşturma)
6. [Kullanıcı Dostu Hata Mesajları](#kullanıcı-dostu-hata-mesajları)
7. [Örnekler](#örnekler)
8. [Sorun Giderme](#sorun-giderme)
9. [Sonuç](#sonuç)

## Giriş

Web uygulamalarında, kullanıcı oturumlarının yönetimi ve hata durumlarının ele alınması, iyi bir kullanıcı deneyimi için kritik öneme sahiptir. Bu rehber, kullanıcı oturumu sona erdiğinde veya bir sorun oluştuğunda, kullanıcıya anlamlı geri bildirimler sunmak ve sorunları zarif bir şekilde ele almak için gerekli mekanizmaları uygulamanıza yardımcı olacaktır.

## Neden Gelişmiş Oturum Yönetimi ve Hata İşleme Önemlidir?

1. **Kullanıcı Deneyimini İyileştirme**: Kullanıcılar, bir hata oluştuğunda ne olduğunu ve ne yapmaları gerektiğini bilmek isterler.
2. **Güvenliği Artırma**: Oturum süresi dolan kullanıcıları güvenli bir şekilde yönlendirmek önemlidir.
3. **Sistem Sağlığını İzleme**: Veritabanı bağlantısı gibi kritik bileşenlerin durumunu kontrol etmek, sorunları proaktif olarak tespit etmenize yardımcı olur.

## Oturum Yenileme Sayfası Oluşturma

### 1. Oturum Yenileme Sayfası

```tsx
// app/auth/session-expired/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SessionExpiredPage() {
  const router = useRouter();

  // Kullanıcıyı otomatik olarak çıkış yap
  useEffect(() => {
    const performSignOut = async () => {
      // JWT token'ı temizle
      await fetch('/api/auth/logout', { method: 'POST' });
    };

    performSignOut();
  }, []);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Oturum Süresi Doldu</CardTitle>
          <CardDescription>
            Oturumunuzun süresi doldu veya geçersiz hale geldi. Lütfen tekrar giriş yapın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Güvenlik nedeniyle, uzun süre işlem yapılmadığında veya oturum bilgileriniz geçersiz olduğunda otomatik olarak çıkış yapılır.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleLogin} className="w-full">
            Giriş Sayfasına Git
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### 2. Oturum Durumu Kontrolü için Middleware

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Korumalı rotaları tanımla
  const protectedPaths = [
    "/dashboard",
    "/profile",
    "/settings",
    "/question-pools",
  ];

  // Geçerli yol korumalı mı kontrol et
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  );

  // Korumalı yol değilse, devam et
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // JWT token'ı al
  const tokenCookie = request.cookies.get('auth-token')?.value;
  const token = tokenCookie ? verifyToken(tokenCookie) : null;

  // Token yoksa, oturum yenileme sayfasına yönlendir
  if (!token) {
    const url = new URL("/auth/session-expired", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Şu yolları hariç tut:
     * - api (API rotaları)
     * - _next/static (statik dosyalar)
     * - _next/image (görüntü optimizasyonu)
     * - favicon.ico (favicon)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

## API İsteklerinde Gelişmiş Hata İşleme

### 1. API İstek Yardımcısı

```typescript
// lib/api-client.ts
interface Session {
  user: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  };
  expires: string;
}

import { getUserFromCookies } from "@/lib/jwt-auth";

interface FetchOptions extends RequestInit {
  session?: Session | null;
}

interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  status: number;
}

export async function fetchApi<T>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  try {
    // Oturum bilgisini al
    const session = options.session || { user: getUserFromCookies() };

    // Varsayılan headers
    const headers = new Headers(options.headers);

    // Content-Type header'ı ekle (eğer yoksa)
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    // Oturum varsa, Authorization header'ı ekle
    if (session?.user) {
      headers.set("Authorization", `Bearer ${session.user.id}`);
    }

    // Fetch isteği gönder
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // JSON yanıtını parse et
    const data = await response.json();

    // Oturum hatası kontrolü
    if (response.status === 401) {
      // Oturum hatası durumunda
      if (typeof window !== "undefined") {
        // Client-side: Kullanıcıyı çıkış yap ve oturum yenileme sayfasına yönlendir
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = "/auth/session-expired";
      }

      return {
        error: {
          message: data.message || "Oturum süresi doldu veya geçersiz.",
          code: data.code || "SESSION_EXPIRED",
        },
        status: response.status,
      };
    }

    // Diğer hata durumları
    if (!response.ok) {
      return {
        error: {
          message: data.message || "Bir hata oluştu.",
          code: data.code || "UNKNOWN_ERROR",
        },
        status: response.status,
      };
    }

    // Başarılı yanıt
    return {
      data: data as T,
      status: response.status,
    };
  } catch (error) {
    // Network hatası veya diğer beklenmeyen hatalar
    console.error("API isteği sırasında hata:", error);

    return {
      error: {
        message: "Sunucuya bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.",
        code: "NETWORK_ERROR",
      },
      status: 0, // 0 status kodu genellikle network hatalarını temsil eder
    };
  }
}
```

### 2. API İstek Hook'u

```typescript
// hooks/use-api.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { fetchApi } from "@/lib/api-client";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onSettled?: () => void;
}

export function useApi(options: UseApiOptions = {}) {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(null);

  // Oturum bilgisini al
  useEffect(() => {
    const getSessionData = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setSession(data);
        }
      } catch (error) {
        console.error('Oturum bilgisi alınamadı:', error);
      }
    };

    getSessionData();
  }, []);

  const request = useCallback(
    async <T>(url: string, fetchOptions: RequestInit = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchApi<T>(url, {
          ...fetchOptions,
          session,
        });

        if (response.error) {
          setError(response.error);
          options.onError?.(response.error);
        } else {
          setData(response.data);
          options.onSuccess?.(response.data);
        }

        return response;
      } catch (err) {
        const error = {
          message: "Beklenmeyen bir hata oluştu.",
          code: "UNEXPECTED_ERROR",
        };

        setError(error);
        options.onError?.(error);

        return { error, status: 0 };
      } finally {
        setIsLoading(false);
        options.onSettled?.();
      }
    },
    [session, options]
  );

  return {
    request,
    isLoading,
    error,
    data,
  };
}
```

## Sağlık Kontrolü API'si Oluşturma

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Veritabanı bağlantısını kontrol et
    await prisma.$queryRaw`SELECT 1`;

    // Diğer sistem bileşenlerini kontrol et
    // Örneğin: Redis, harici API'ler, vb.

    return NextResponse.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Sağlık kontrolü sırasında hata:", error);

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: "Veritabanı bağlantısı kurulamadı.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

## Kullanıcı Dostu Hata Mesajları

### 1. Hata Bileşeni

```tsx
// components/ui/error-message.tsx
import React from "react";
import { AlertCircle, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  title: string;
  message: string;
  type?: "error" | "warning" | "info";
  className?: string;
  action?: React.ReactNode;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = "error",
  className,
  action,
}) => {
  const icons = {
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    error: "bg-red-50",
    warning: "bg-amber-50",
    info: "bg-blue-50",
  };

  const borderColors = {
    error: "border-red-200",
    warning: "border-amber-200",
    info: "border-blue-200",
  };

  return (
    <div
      className={cn(
        "rounded-md border p-4",
        bgColors[type],
        borderColors[type],
        className
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">
            {title}
          </h3>
          <div className="mt-2 text-sm">
            <p>{message}</p>
          </div>
          {action && (
            <div className="mt-4">
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 2. Hata Kodlarını Kullanıcı Dostu Mesajlara Çevirme

```typescript
// lib/error-messages.ts
interface ErrorMessageMap {
  [key: string]: {
    title: string;
    message: string;
    type: "error" | "warning" | "info";
  };
}

export const errorMessages: ErrorMessageMap = {
  // Oturum hataları
  "SESSION_EXPIRED": {
    title: "Oturum Süresi Doldu",
    message: "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",
    type: "warning",
  },
  "UNAUTHORIZED": {
    title: "Yetkisiz Erişim",
    message: "Bu işlemi gerçekleştirmek için yetkiniz yok.",
    type: "error",
  },
  "USER_NOT_FOUND": {
    title: "Kullanıcı Bulunamadı",
    message: "Oturum bilgileriniz geçersiz. Lütfen yeniden giriş yapın.",
    type: "error",
  },

  // Veritabanı hataları
  "DB_CONNECTION_ERROR": {
    title: "Veritabanı Bağlantı Hatası",
    message: "Veritabanına bağlanırken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.",
    type: "error",
  },
  "RECORD_NOT_FOUND": {
    title: "Kayıt Bulunamadı",
    message: "İstediğiniz kayıt bulunamadı veya silinmiş olabilir.",
    type: "warning",
  },

  // Network hataları
  "NETWORK_ERROR": {
    title: "Bağlantı Hatası",
    message: "Sunucuya bağlanırken bir sorun oluştu. Lütfen internet bağlantınızı kontrol edin.",
    type: "warning",
  },

  // Genel hatalar
  "UNKNOWN_ERROR": {
    title: "Beklenmeyen Hata",
    message: "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
    type: "error",
  },
  "VALIDATION_ERROR": {
    title: "Doğrulama Hatası",
    message: "Girdiğiniz bilgilerde hatalar var. Lütfen kontrol edip tekrar deneyin.",
    type: "warning",
  },
};

export function getErrorMessage(code: string, fallbackMessage?: string) {
  return (
    errorMessages[code] || {
      title: "Hata",
      message: fallbackMessage || "Bir hata oluştu. Lütfen tekrar deneyin.",
      type: "error",
    }
  );
}
```

## Örnekler

### 1. API İstek Hook'u Kullanımı

```tsx
// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { ErrorMessage } from "@/components/ui/error-message";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/error-messages";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function DashboardPage() {
  const { request, isLoading, error, data } = useApi();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await request<User>("/api/user/profile");
      if (response.data) {
        setUser(response.data);
      }
    };

    fetchUser();
  }, [request]);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (error) {
    const errorInfo = getErrorMessage(error.code, error.message);

    return (
      <div className="p-8">
        <ErrorMessage
          title={errorInfo.title}
          message={errorInfo.message}
          type={errorInfo.type}
          action={
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Sayfayı Yenile
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8">Yükleniyor...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {user && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
      )}
    </div>
  );
}
```

### 2. Sağlık Kontrolü Kullanımı

```tsx
// app/admin/system-status/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface HealthStatus {
  status: "ok" | "error";
  database: "connected" | "disconnected";
  timestamp: string;
}

export default function SystemStatusPage() {
  const { request, isLoading } = useApi();
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  const checkHealth = async () => {
    const response = await request<HealthStatus>("/api/health");
    if (response.data) {
      setHealthStatus(response.data);
    }
  };

  useEffect(() => {
    checkHealth();

    // Her 30 saniyede bir sağlık kontrolü yap
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sistem Durumu</h1>

        <Button onClick={checkHealth} disabled={isLoading}>
          {isLoading ? "Kontrol Ediliyor..." : "Yenile"}
        </Button>
      </div>

      {healthStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Sistem Sağlığı</CardTitle>
            <CardDescription>
              Son kontrol: {new Date(healthStatus.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">Genel Durum</span>
                {healthStatus.status === "ok" ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    <span>Çalışıyor</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-1" />
                    <span>Hata</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">Veritabanı</span>
                {healthStatus.database === "connected" ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    <span>Bağlı</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5 mr-1" />
                    <span>Bağlantı Kesildi</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

## Sorun Giderme

### 1. Oturum Yenileme Sayfası Görünmüyor

Eğer oturum yenileme sayfası görünmüyorsa, şunları kontrol edin:

- Middleware'in doğru şekilde yapılandırıldığından emin olun.
- JWT kimlik doğrulama yapılandırmasının doğru olduğundan emin olun.
- Tarayıcı konsolunda hata mesajları olup olmadığını kontrol edin.

### 2. API İsteklerinde Hata İşleme Çalışmıyor

Eğer API isteklerinde hata işleme çalışmıyorsa, şunları kontrol edin:

- `fetchApi` fonksiyonunun doğru şekilde kullanıldığından emin olun.
- API yanıtlarının beklenen formatta olduğundan emin olun.
- Tarayıcı konsolunda ve sunucu loglarında hata mesajları olup olmadığını kontrol edin.

## Sonuç

Bu rehber, Next.js uygulamalarınızda oturum yönetimi ve API isteklerinde gelişmiş hata işleme mekanizmaları uygulamanıza yardımcı oldu. Bu yaklaşımlar, kullanıcı deneyimini önemli ölçüde iyileştirir ve kullanıcıların sorunlarla karşılaştıklarında ne yapmaları gerektiğini daha iyi anlamalarını sağlar.

Gelişmiş hata işleme ve oturum yönetimi, profesyonel web uygulamalarının önemli bir parçasıdır. Bu rehberdeki teknikleri kullanarak, kullanıcılarınıza daha iyi bir deneyim sunabilirsiniz.
