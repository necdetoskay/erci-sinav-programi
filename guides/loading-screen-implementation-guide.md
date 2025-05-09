# Next.js Projelerinde Sayfa Geçişleri İçin Loading Ekranı Uygulama Rehberi

Bu rehber, Next.js projelerinizde sayfa geçişleri sırasında kullanıcı deneyimini iyileştirmek için profesyonel bir loading ekranı uygulamanıza yardımcı olacaktır.

## İçindekiler

1. [Giriş](#giriş)
2. [Kurulum](#kurulum)
3. [Bileşenlerin Oluşturulması](#bileşenlerin-oluşturulması)
   - [Utils Fonksiyonu](#1-utils-fonksiyonu)
   - [Loading Provider](#2-loading-provider)
   - [Loading Control Hook](#3-loading-control-hook)
   - [Loading Screen Bileşeni](#4-loading-screen-bileşeni)
   - [Loading Link Bileşeni](#5-loading-link-bileşeni)
   - [CSS Animasyonları](#6-css-animasyonları)
4. [Projeye Entegrasyon](#projeye-entegrasyon)
5. [Kullanım Örnekleri](#kullanım-örnekleri)
6. [Özelleştirme](#özelleştirme)
7. [Sorun Giderme](#sorun-giderme)
8. [Sonuç](#sonuç)

## Giriş

Modern web uygulamalarında, sayfa geçişleri sırasında kullanıcıya geri bildirim sağlamak önemlidir. Bu, özellikle yavaş internet bağlantılarında veya büyük veri yüklemelerinde kullanıcı deneyimini önemli ölçüde iyileştirir. Bu rehber, Next.js projelerinizde sayfa geçişleri sırasında görünen bir loading ekranı uygulamanıza yardımcı olacaktır.

### Neden Loading Ekranı Önemlidir?

- **Kullanıcı Deneyimi**: Kullanıcılar, bir işlemin devam ettiğini bilmek isterler
- **Profesyonel Görünüm**: Loading ekranları uygulamanızın daha profesyonel görünmesini sağlar
- **Kullanıcı Güveni**: Kullanıcılar, uygulamanın çalıştığını ve yanıt verdiğini bilirler

## Kurulum

### Gerekli Bağımlılıklar

Projenizde aşağıdaki bağımlılıkların yüklü olduğundan emin olun:

```bash
npm install clsx tailwind-merge
```

Bu kütüphaneler, CSS sınıflarını birleştirmek ve Tailwind CSS ile çalışmak için kullanılacaktır.

### Proje Yapısı

Loading ekranı için aşağıdaki dosyaları oluşturacağız:

```
├── components/
│   └── ui/
│       ├── loading-screen.tsx
│       └── loading-link.tsx
├── hooks/
│   └── use-loading.ts
├── providers/
│   └── loading-provider.tsx
└── lib/
    └── utils.ts (eğer yoksa)
```

## Bileşenlerin Oluşturulması

### 1. Utils Fonksiyonu

Eğer projenizde yoksa, `lib/utils.ts` dosyasını oluşturun:

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 2. Loading Provider

`providers/loading-provider.tsx` dosyasını oluşturun:

```typescript
// providers/loading-provider.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/loading-screen';

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
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sayfa değişikliklerini izle
  useEffect(() => {
    // Sayfa değiştiğinde yükleme durumunu false yap
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Next.js router olaylarını dinle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Navigation olaylarını manuel olarak izle
      const originalPushState = window.history.pushState;
      const originalReplaceState = window.history.replaceState;

      const handleRouteChangeStart = () => {
        console.log('Route change start');
        setIsLoading(true);
      };

      const handleRouteChangeComplete = () => {
        console.log('Route change complete');
        setIsLoading(false);
      };

      window.history.pushState = function() {
        handleRouteChangeStart();
        const result = originalPushState.apply(this, arguments as any);
        setTimeout(() => handleRouteChangeComplete(), 500); // Sayfa yüklenmesi için kısa bir gecikme
        return result;
      };

      window.history.replaceState = function() {
        handleRouteChangeStart();
        const result = originalReplaceState.apply(this, arguments as any);
        setTimeout(() => handleRouteChangeComplete(), 500); // Sayfa yüklenmesi için kısa bir gecikme
        return result;
      };

      // Popstate olayını dinle (geri/ileri düğmeleri)
      window.addEventListener('popstate', handleRouteChangeStart);

      return () => {
        window.removeEventListener('popstate', handleRouteChangeStart);

        // Orijinal fonksiyonları geri yükle
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
      };
    }
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      <LoadingScreen isLoading={isLoading} />
    </LoadingContext.Provider>
  );
};
```

### 3. Loading Control Hook

`hooks/use-loading.ts` dosyasını oluşturun:

```typescript
// hooks/use-loading.ts
"use client";

import { useLoading } from "@/providers/loading-provider";

/**
 * Yükleme durumunu kontrol etmek için hook
 * @returns Yükleme durumunu kontrol etmek için fonksiyonlar
 * @example
 * const { showLoading, hideLoading } = useLoadingControl();
 *
 * // Yükleme ekranını göster
 * showLoading();
 *
 * // Yükleme ekranını gizle
 * hideLoading();
 */
export const useLoadingControl = () => {
  const { setIsLoading } = useLoading();

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return { showLoading, hideLoading };
};
```

### 4. Loading Screen Bileşeni

`components/ui/loading-screen.tsx` dosyasını oluşturun:

```typescript
// components/ui/loading-screen.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-xl shadow-xl">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary/20 animate-pulse"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold text-primary">Yükleniyor</p>
          <p className="text-sm text-muted-foreground mt-1">Lütfen bekleyin...</p>
        </div>

        {/* Animasyonlu progress bar */}
        <div className="w-48 h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );
};
```

### 5. Loading Link Bileşeni

`components/ui/loading-link.tsx` dosyasını oluşturun:

```typescript
// components/ui/loading-link.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useLoadingControl } from '@/hooks/use-loading';

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
}

export const LoadingLink: React.FC<LoadingLinkProps> = ({
  href,
  children,
  className,
  onClick,
  ...props
}) => {
  const { showLoading } = useLoadingControl();

  const handleClick = (e: React.MouseEvent) => {
    // Eğer onClick prop'u varsa çağır
    if (onClick) {
      onClick();
    }

    // Loading durumunu true yap
    showLoading();
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
};
```

### 6. CSS Animasyonları

`app/globals.css` dosyanıza aşağıdaki CSS kodunu ekleyin:

```css
/* Loading ekranı için progress animasyonu */
@keyframes progress {
  0% {
    width: 0%;
    margin-left: 0;
  }
  50% {
    width: 70%;
    margin-left: 0;
  }
  70% {
    width: 50%;
    margin-left: 50%;
  }
  100% {
    width: 0%;
    margin-left: 100%;
  }
}

.animate-progress {
  animation: progress 2s ease-in-out infinite;
}
```

## Projeye Entegrasyon

### 1. Provider'ı Root Layout'a Ekleyin

Root layout dosyanızda (`app/layout.tsx`) LoadingProvider'ı ekleyin:

```tsx
// app/layout.tsx
import { LoadingProvider } from "@/providers/loading-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <LoadingProvider>
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
```

### 2. Diğer Provider'lar ile Kullanım

Eğer projenizde başka provider'lar varsa (örneğin, ThemeProvider, SessionProvider vb.), bunları LoadingProvider içine yerleştirebilirsiniz:

```tsx
// app/layout.tsx
import { LoadingProvider } from "@/providers/loading-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>
        <LoadingProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
```

## Kullanım Örnekleri

### 1. Sayfalar Arası Geçişlerde Otomatik Loading

Sayfalar arası geçişlerde loading ekranını otomatik olarak göstermek için `LoadingLink` bileşenini kullanın:

```tsx
// app/dashboard/page.tsx
import { LoadingLink } from "@/components/ui/loading-link";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <LoadingLink href="/settings">Ayarlar Sayfasına Git</LoadingLink>
    </div>
  );
}
```

### 2. Button ile Kullanım

Button bileşeni ile kullanmak için:

```tsx
// app/dashboard/page.tsx
import { Button } from "@/components/ui/button";
import { LoadingLink } from "@/components/ui/loading-link";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Button asChild>
        <LoadingLink href="/settings">Ayarlar Sayfasına Git</LoadingLink>
      </Button>
    </div>
  );
}
```

### 3. Manuel Loading Kontrolü

API çağrıları veya uzun süren işlemler için loading ekranını manuel olarak kontrol etmek için `useLoadingControl` hook'unu kullanın:

```tsx
// app/dashboard/page.tsx
"use client";

import { useLoadingControl } from "@/hooks/use-loading";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { showLoading, hideLoading } = useLoadingControl();

  const handleFetchData = async () => {
    showLoading(); // Loading ekranını göster

    try {
      // API çağrısı veya uzun süren işlem
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      hideLoading(); // Loading ekranını gizle
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <Button onClick={handleFetchData}>Veri Getir</Button>
    </div>
  );
}
```

### 4. Form Gönderimi ile Kullanım

Form gönderimi sırasında loading ekranını göstermek için:

```tsx
// app/dashboard/page.tsx
"use client";

import { useLoadingControl } from "@/hooks/use-loading";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function DashboardPage() {
  const { showLoading, hideLoading } = useLoadingControl();
  const [formData, setFormData] = useState({ name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoading(); // Loading ekranını göster

    try {
      // Form verilerini gönder
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      hideLoading(); // Loading ekranını gizle
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ name: e.target.value })}
        />
        <Button type="submit">Gönder</Button>
      </form>
    </div>
  );
}
```

## Özelleştirme

### 1. Loading Ekranı Görünümü

`LoadingScreen` bileşenini özelleştirerek loading ekranının görünümünü değiştirebilirsiniz:

```tsx
// components/ui/loading-screen.tsx
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-blue-900/90 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-xl shadow-xl">
        {/* Özel logo */}
        <img src="/logo.png" alt="Logo" className="h-16 w-16" />

        <div className="text-center">
          <p className="text-xl font-semibold text-blue-600">İşleminiz Yapılıyor</p>
          <p className="text-sm text-muted-foreground mt-1">Lütfen bekleyin...</p>
        </div>

        {/* Özel animasyon */}
        <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );
};
```

### 2. Loading Süresi

`useNavigationLoading` hook'undaki gecikme süresini değiştirerek loading ekranının ne kadar süre gösterileceğini ayarlayabilirsiniz:

```typescript
// providers/loading-provider.tsx
// Örnek: 500ms yerine 1000ms gecikme
setTimeout(() => handleRouteChangeComplete(), 1000);
```

### 3. Farklı Loading Ekranları

Farklı durumlar için farklı loading ekranları oluşturabilirsiniz:

```typescript
// providers/loading-provider.tsx
"use client";

import React, { createContext, useContext, useState } from 'react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { FormLoadingScreen } from '@/components/ui/form-loading-screen';
import { ApiLoadingScreen } from '@/components/ui/api-loading-screen';
import { usePathname, useSearchParams } from 'next/navigation';

interface LoadingContextType {
  isLoading: boolean;
  loadingType: 'default' | 'form' | 'api';
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingType: React.Dispatch<React.SetStateAction<'default' | 'form' | 'api'>>;
}

// ... diğer kodlar
```

## Sorun Giderme

### 1. Loading Ekranı Görünmüyor

Eğer loading ekranı görünmüyorsa, şunları kontrol edin:

- LoadingProvider'ın root layout'a eklendiğinden emin olun
- CSS animasyonlarının globals.css dosyasına eklendiğinden emin olun
- LoadingLink bileşeninin doğru şekilde kullanıldığından emin olun

### 2. Loading Ekranı Kapanmıyor

Eğer loading ekranı kapanmıyorsa, şunları kontrol edin:

- useNavigationLoading hook'unun doğru şekilde çalıştığından emin olun
- hideLoading fonksiyonunun çağrıldığından emin olun
- try/finally bloklarının doğru şekilde kullanıldığından emin olun

### 3. Performans Sorunları

Eğer loading ekranı performans sorunlarına neden oluyorsa, şunları deneyin:

- CSS animasyonlarını basitleştirin
- Blur efektini kaldırın veya azaltın
- Loading ekranının DOM'da her zaman var olduğundan emin olun, sadece görünürlüğünü değiştirin

## Sonuç

Bu rehber, Next.js projelerinizde sayfa geçişleri sırasında loading ekranı uygulamanıza yardımcı oldu. Loading ekranları, kullanıcı deneyimini önemli ölçüde iyileştirir ve uygulamanızın daha profesyonel görünmesini sağlar.

Bu rehberdeki kodları kendi projelerinize uyarlayarak, kullanıcılarınıza daha iyi bir deneyim sunabilirsiniz. Unutmayın, iyi bir kullanıcı deneyimi, kullanıcıların uygulamanızı daha fazla kullanmasını ve daha memnun kalmasını sağlar.