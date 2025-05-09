# Next.js Global Yükleme Ekranı Dokümantasyonu

Bu dokümantasyon, Next.js uygulamalarına global bir yükleme ekranı ekleme sürecini açıklar. Bu özellik, sayfa geçişleri sırasında kullanıcılara görsel geri bildirim sağlayarak kullanıcı deneyimini iyileştirir.

## Özellikler

- Sayfa geçişleri sırasında otomatik olarak yükleme ekranı gösterme
- Manuel olarak yükleme ekranını kontrol etme imkanı
- Özelleştirilebilir yükleme göstergesi
- Animasyonlu geçişler

## Kurulum Adımları

### 1. Yükleme Bileşeni Oluşturma

`components/ui/loading-screen.tsx` dosyasını oluşturun:

```tsx
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
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    </div>
  );
};
```

### 2. Yükleme Context'i Oluşturma

`providers/loading-provider.tsx` dosyasını oluşturun:

```tsx
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
      const handleStart = () => {
        setIsLoading(true);
      };

      const handleComplete = () => {
        setIsLoading(false);
      };

      // Router olaylarını dinle
      window.addEventListener('beforeunload', handleStart);
      document.addEventListener('nextjs:route-change-start', handleStart);
      document.addEventListener('nextjs:route-change-complete', handleComplete);
      document.addEventListener('nextjs:route-change-error', handleComplete);

      return () => {
        window.removeEventListener('beforeunload', handleStart);
        document.removeEventListener('nextjs:route-change-start', handleStart);
        document.removeEventListener('nextjs:route-change-complete', handleComplete);
        document.removeEventListener('nextjs:route-change-error', handleComplete);
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

### 3. Manuel Kontrol için Hook Oluşturma

`hooks/use-loading.ts` dosyasını oluşturun:

```tsx
"use client";

import { useLoading } from "@/providers/loading-provider";

export const useLoadingControl = () => {
  const { setIsLoading } = useLoading();

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return { showLoading, hideLoading };
};
```

### 4. Provider'ı Ana Layout'a Ekleme

Ana provider bileşeninize LoadingProvider'ı ekleyin:

```tsx
"use client";

import { LoadingProvider } from "@/providers/loading-provider";
// Diğer importlar...

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        <ThemeProvider>
          <LoadingProvider>
            {children}
            <Toaster />
          </LoadingProvider>
        </ThemeProvider>
      </UserProvider>
    </AuthProvider>
  );
}
```

## Kullanım

### Otomatik Sayfa Geçişleri

Yükleme ekranı, Next.js'in `Link` bileşeni veya `router.push()` ile yapılan sayfa geçişlerinde otomatik olarak gösterilir.

```tsx
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/settings">Settings</Link>
    </nav>
  );
}
```

### Manuel Kontrol

Yükleme ekranını manuel olarak kontrol etmek için `useLoadingControl` hook'unu kullanabilirsiniz:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { useLoadingControl } from "@/hooks/use-loading";

export default function DataFetchingComponent() {
  const { showLoading, hideLoading } = useLoadingControl();

  const fetchData = async () => {
    showLoading(); // Yükleme ekranını göster
    
    try {
      await fetch('/api/data');
      // İşlemler...
    } catch (error) {
      console.error(error);
    } finally {
      hideLoading(); // Yükleme ekranını gizle
    }
  };

  return (
    <Button onClick={fetchData}>Veri Getir</Button>
  );
}
```

## Özelleştirme

### Yükleme Göstergesini Özelleştirme

`LoadingScreen` bileşenini özelleştirerek farklı yükleme göstergeleri kullanabilirsiniz:

```tsx
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Özel yükleme göstergesi */}
        <YourCustomSpinner />
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    </div>
  );
};
```

### Geçiş Animasyonlarını Özelleştirme

Geçiş animasyonlarını `transition-opacity duration-300` sınıflarını değiştirerek özelleştirebilirsiniz.

## Sorun Giderme

### Yükleme Ekranı Gösterilmiyor

- Provider'ın doğru şekilde eklendiğinden emin olun
- Router olaylarının doğru şekilde dinlendiğini kontrol edin
- Konsol hatalarını kontrol edin

### Yükleme Ekranı Kapanmıyor

- `hideLoading` fonksiyonunun çağrıldığından emin olun
- `try/catch/finally` bloklarını kullanarak, hata durumunda bile yükleme ekranının kapandığından emin olun

## Sonuç

Bu dokümantasyon, Next.js uygulamalarına global bir yükleme ekranı ekleme sürecini açıklar. Bu özellik, kullanıcı deneyimini iyileştirerek, sayfa geçişleri sırasında kullanıcılara görsel geri bildirim sağlar.
