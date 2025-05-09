"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
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
  const router = useRouter();

  // Next.js router olaylarını dinle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Sayfa yüklendiğinde loading'i false yap
      const handleLoad = () => {
        setIsLoading(false);
      };

      // Sayfa geçişlerini izle - App Router için özel event listener'lar
      const handleStart = () => {
        console.log('Navigation started');
        setIsLoading(true);
      };

      const handleComplete = () => {
        console.log('Navigation completed');
        setIsLoading(false);
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
          setIsLoading(true);
        }
      };

      // Event listener'ları ekle
      window.addEventListener('load', handleLoad);
      window.addEventListener('click', handleClick);

      // Next.js App Router için özel event'ler
      document.addEventListener('nextjs:navigation-start', handleStart);
      document.addEventListener('nextjs:navigation-complete', handleComplete);

      return () => {
        // Event listener'ları temizle
        window.removeEventListener('load', handleLoad);
        window.removeEventListener('click', handleClick);
        document.removeEventListener('nextjs:navigation-start', handleStart);
        document.removeEventListener('nextjs:navigation-complete', handleComplete);
      };
    }
  }, []);

  // Sayfa değişikliklerini izle
  useEffect(() => {
    // Sayfa değiştiğinde yükleme durumunu false yap
    setIsLoading(false);
  }, [pathname, searchParams]);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      <LoadingScreen isLoading={isLoading} />
    </LoadingContext.Provider>
  );
};
