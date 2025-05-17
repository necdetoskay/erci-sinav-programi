// components/ui/loading-screen.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  isLoading: boolean;
  message?: string;
  showDelay?: number; // Gösterme gecikmesi (ms)
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isLoading,
  message = "Lütfen bekleyin...",
  showDelay = 300 // 300ms gecikme ile göster (çok kısa yüklemeler için ekranı gösterme)
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [dots, setDots] = useState("");

  // Animasyon için nokta efekti
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Gecikme ile gösterme
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isLoading) {
      timeout = setTimeout(() => {
        setShouldRender(true);
      }, showDelay);
    } else {
      setShouldRender(false);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isLoading, showDelay]);

  return (
    <div
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300",
        shouldRender && isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="animate-pulse mb-4">
          <div className="h-8 w-64 bg-muted rounded mb-2"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
        <div className="text-center mt-4">
          <p className="text-xl font-semibold mb-2">Kent Konut Sınav Portalı</p>
          <p className="text-lg text-primary dark:text-primary-foreground">
            Yükleniyor{dots}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
};
