# Next.js ve JWT ile "Beni Hatırla" Özelliği Uygulama Rehberi

Bu rehber, Next.js ve JWT tabanlı kimlik doğrulama kullanarak uygulamanıza "Beni Hatırla" özelliği eklemenize yardımcı olacaktır. Bu özellik, kullanıcıların tercihlerine göre oturum süresinin dinamik olarak ayarlanmasını sağlar.

## İçindekiler

1. [Giriş](#giriş)
2. [Neden "Beni Hatırla" Özelliği Önemlidir?](#neden-beni-hatırla-özelliği-önemlidir)
3. [Uygulama](#uygulama)
4. [Örnekler](#örnekler)
5. [Güvenlik Hususları](#güvenlik-hususları)
6. [Sorun Giderme](#sorun-giderme)
7. [Sonuç](#sonuç)

## Giriş

"Beni Hatırla" özelliği, kullanıcıların giriş yaparken oturum sürelerini uzatma seçeneği sunarak, sık kullanılan cihazlarda tekrar tekrar giriş yapma ihtiyacını ortadan kaldırır. Bu rehber, Next.js ve JWT tabanlı kimlik doğrulama kullanarak bu özelliği uygulamanıza nasıl ekleyeceğinizi adım adım açıklar.

## Neden "Beni Hatırla" Özelliği Önemlidir?

1. **Kullanıcı Deneyimini İyileştirme**: Kullanıcılar, sık kullandıkları cihazlarda her seferinde giriş yapmak zorunda kalmazlar.
2. **Esneklik Sağlama**: Kullanıcılar, cihazın güvenliğine göre oturum süresini seçebilirler.
3. **Güvenlik ve Kullanım Kolaylığı Dengesi**: Ortak kullanılan cihazlarda kısa oturum süresi, kişisel cihazlarda uzun oturum süresi sağlar.

## Uygulama

### 1. JWT Kimlik Doğrulama Yapılandırması

Öncelikle, JWT kimlik doğrulama yapılandırmanızı oluşturalım:

```typescript
// lib/jwt-auth.ts
import { sign, verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

// JWT token'ı oluştur
export function createToken(payload: any, expiresIn: string = '1d') {
  const secret = process.env.JWT_SECRET || 'default-secret-key';
  return sign(payload, secret, { expiresIn });
}

// JWT token'ı doğrula
export function verifyToken(token: string) {
  try {
    const secret = process.env.JWT_SECRET || 'default-secret-key';
    return verify(token, secret);
  } catch (error) {
    return null;
  }
}

// Çerezden token'ı al
export function getTokenFromCookies() {
  const cookieStore = cookies();
  return cookieStore.get('auth-token')?.value;
}

// Token'dan kullanıcı bilgilerini al
export function getUserFromToken(token: string) {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  return {
    id: (decoded as any).id,
    email: (decoded as any).email,
    name: (decoded as any).name,
    role: (decoded as any).role,
  };
}

// Çerezden kullanıcı bilgilerini al
export function getUserFromCookies() {
  const token = getTokenFromCookies();
  if (!token) return null;

  return getUserFromToken(token);
}

// Çereze token'ı kaydet
export function setTokenCookie(token: string, maxAge: number = 24 * 60 * 60) {
  cookies().set({
    name: 'auth-token',
    value: token,
    httpOnly: true,
    path: '/',
    maxAge,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

// Çerezden token'ı sil
export function removeTokenCookie() {
  cookies().delete('auth-token');
}
```

Şimdi, oturum yönetimi için bir session yardımcı fonksiyonu oluşturalım:

```typescript
// lib/session.ts
import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from './prisma';

// JWT token'ından kullanıcı bilgilerini çıkaran fonksiyon
export async function getSession(req: NextRequest) {
  try {
    // Cookie'den token'ı al
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Token'ı doğrula
    const decoded = verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
      id: string;
      email: string;
      rememberMe?: boolean;
    };

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

    // Session nesnesini oluştur
    return {
      user,
      expires: new Date(Date.now() + (decoded.rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}
```

### 2. Login Formu Güncelleme

Şimdi, login formuna "Beni Hatırla" checkbox'ı ekleyelim:

```tsx
// app/auth/login/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icons";
import axios from "axios";

// Form şeması
const loginSchema = z.object({
  email: z.string()
    .min(1, "E-posta adresi gereklidir")
    .email("Geçerli bir e-posta adresi giriniz"),
  password: z.string()
    .min(1, "Şifre gereklidir")
    .min(6, "Şifre en az 6 karakter olmalıdır"),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/auth/login', {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe // Beni hatırla seçeneğini ekle
      });

      if (response.data.success) {
        router.push("/dashboard");
      } else {
        setError("Giriş başarısız");
        setIsLoading(false);
      }
    } catch (error) {
      setError("Geçersiz e-posta veya şifre");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Giriş Yap</h1>
          <p className="mt-2 text-gray-600">
            Hesabınıza giriş yapın
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ornek@email.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="********"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="cursor-pointer">
                        Beni hatırla
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
```

## Örnekler

### 1. Basit Giriş Sayfası

```tsx
// app/auth/simple-login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SimpleLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
        rememberMe
      });

      if (response.data.success) {
        router.push("/dashboard");
      } else {
        setError("Giriş başarısız");
        setIsLoading(false);
      }
    } catch (error) {
      setError("Geçersiz e-posta veya şifre");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Giriş Yap</h1>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="rememberMe" className="block ml-2 text-sm text-gray-700">
              Beni hatırla
            </label>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

## Güvenlik Hususları

"Beni Hatırla" özelliğini uygularken dikkat edilmesi gereken güvenlik hususları:

1. **Oturum Süresi**: Uzun oturum süreleri güvenlik risklerini artırabilir. Varsayılan olarak 30 gün makul bir süredir, ancak uygulamanızın güvenlik gereksinimlerine göre ayarlayabilirsiniz.

2. **Güvenli Cookie'ler**: JWT kimlik doğrulama yapılandırmasında, üretim ortamında `secure: true` ayarını etkinleştirdiğinizden emin olun.

3. **Oturum İptali**: Kullanıcılara, tüm cihazlarda oturumlarını sonlandırma seçeneği sunmak iyi bir uygulamadır.

4. **Refresh Token Rotasyonu**: Uzun süreli oturumlarda, refresh token rotasyonu uygulayarak güvenliği artırabilirsiniz.

```typescript
// lib/jwt-auth.ts içinde token yenileme fonksiyonu
export async function refreshToken(token: string) {
  try {
    // Token'ı doğrula
    const decoded = verifyToken(token) as any;

    if (!decoded) {
      return null;
    }

    // Token'ın ne zaman oluşturulduğunu kontrol et
    const tokenCreated = decoded.iat || 0;
    const tokenAge = Math.floor(Date.now() / 1000) - tokenCreated;

    // Token 7 günden eskiyse ve "beni hatırla" seçilmişse, yeni bir token oluştur
    if (decoded.rememberMe && tokenAge > 7 * 24 * 60 * 60) {
      console.log("Token yenileniyor...");

      // Kullanıcı bilgilerini al
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
        },
      });

      if (!user) {
        return null;
      }

      // Yeni token oluştur
      const expiresIn = decoded.rememberMe ? '30d' : '1d';
      const newToken = createToken({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        rememberMe: decoded.rememberMe,
      }, expiresIn);

      // Çerezi güncelle
      const maxAge = decoded.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
      setTokenCookie(newToken, maxAge);

      return newToken;
    }

    return token;
  } catch (error) {
    console.error("Token yenileme hatası:", error);
    return null;
  }
}
```

## Sorun Giderme

### 1. "Beni Hatırla" Seçeneği Çalışmıyor

Eğer "Beni Hatırla" seçeneği çalışmıyorsa, şunları kontrol edin:

- `rememberMe` değerinin doğru şekilde login API'sine iletildiğinden emin olun.
- Token oluşturma fonksiyonunda `rememberMe` değerinin doğru şekilde işlendiğinden emin olun.
- Tarayıcı cookie'lerinin doğru şekilde ayarlandığından emin olun.

### 2. Oturum Beklenenden Erken Sona Eriyor

Eğer oturum beklenenden erken sona eriyorsa, şunları kontrol edin:

- JWT token oluşturma fonksiyonundaki `expiresIn` değerinin doğru ayarlandığından emin olun.
- Cookie ayarlarındaki `maxAge` değerinin doğru hesaplandığından emin olun.
- Tarayıcı cookie'lerinin doğru şekilde ayarlandığından emin olun.

## Sonuç

Bu rehber, Next.js ve JWT tabanlı kimlik doğrulama kullanarak uygulamanıza "Beni Hatırla" özelliği eklemenize yardımcı oldu. Bu özellik, kullanıcıların tercihlerine göre oturum süresinin dinamik olarak ayarlanmasını sağlayarak, kullanıcı deneyimini önemli ölçüde iyileştirir.

"Beni Hatırla" özelliği, kullanıcıların güvenlik ve kullanım kolaylığı arasında kendi tercihlerine göre denge kurmasına olanak tanır. Bu rehberdeki teknikleri kullanarak, kullanıcılarınıza daha iyi bir deneyim sunabilirsiniz.
