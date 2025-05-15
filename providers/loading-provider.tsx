"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showLoading: () => void;
  hideLoading: () => void;
  setLoadingTimeout: (ms: number) => void;
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
  const [loadingTimeout, setLoadingTimeoutValue] = useState(30000); // 30 saniye varsayılan timeout
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Timeout referansını tutmak için
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Loading ekranını göster
  const showLoading = useCallback(() => {
    setIsLoading(true);

    // Önceki timeout'u temizle
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Yeni timeout oluştur - belirli bir süre sonra loading ekranını otomatik kapat
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      console.warn('Loading timeout reached. Automatically hiding loading screen.');
    }, loadingTimeout);
  }, [loadingTimeout]);

  // Loading ekranını gizle
  const hideLoading = useCallback(() => {
    setIsLoading(false);

    // Timeout'u temizle
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Timeout süresini ayarla
  const setLoadingTimeout = useCallback((ms: number) => {
    setLoadingTimeoutValue(ms);
  }, []);

  // Next.js router olaylarını dinle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Sayfa yüklendiğinde loading'i false yap
      const handleLoad = () => {
        hideLoading();
      };

      // Sayfa geçişlerini izle - App Router için özel event listener'lar
      const handleStart = () => {
        showLoading();
      };

      const handleComplete = () => {
        hideLoading();
      };

      // Hata durumunda loading'i kapat
      const handleError = () => {
        hideLoading();
      };

      // Tıklama olaylarını dinle (link tıklamaları için)
      const handleClick = (e: MouseEvent) => {
        // Eğer tıklanan element bir link ise ve farklı bir sayfaya gidiyorsa
        const target = e.target as HTMLElement;
        const link = target.closest('a');

        if (link &&
            link.href &&
            link.href.startsWith(window.location.origin) &&
            link.href !== window.location.href &&
            !link.hasAttribute('data-no-loading')) {
          showLoading();
        }
      };

      // Form submit olaylarını dinle
      const handleSubmit = (e: SubmitEvent) => {
        const form = e.target as HTMLFormElement;
        if (form && !form.hasAttribute('data-no-loading')) {
          showLoading();
        }
      };

      // Event listener'ları ekle
      window.addEventListener('load', handleLoad);
      window.addEventListener('click', handleClick);
      window.addEventListener('submit', handleSubmit);
      window.addEventListener('error', handleError);

      // Next.js App Router için özel event'ler
      document.addEventListener('nextjs:navigation-start', handleStart);
      document.addEventListener('nextjs:navigation-complete', handleComplete);
      document.addEventListener('nextjs:navigation-error', handleError);

      return () => {
        // Event listener'ları temizle
        window.removeEventListener('load', handleLoad);
        window.removeEventListener('click', handleClick);
        window.removeEventListener('submit', handleSubmit);
        window.removeEventListener('error', handleError);
        document.removeEventListener('nextjs:navigation-start', handleStart);
        document.removeEventListener('nextjs:navigation-complete', handleComplete);
        document.removeEventListener('nextjs:navigation-error', handleError);

        // Timeout'u temizle
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [showLoading, hideLoading]);

  // Sayfa değişikliklerini izle
  useEffect(() => {
    // Sayfa değiştiğinde yükleme durumunu false yap
    hideLoading();
  }, [pathname, searchParams, hideLoading]);

  return (
    <LoadingContext.Provider value={{
      isLoading,
      setIsLoading,
      showLoading,
      hideLoading,
      setLoadingTimeout
    }}>
      {children}
      <LoadingScreen isLoading={isLoading} />
    </LoadingContext.Provider>
  );
};
