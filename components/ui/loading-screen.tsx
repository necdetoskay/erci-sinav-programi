// components/ui/loading-screen.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, PenTool, FileText, CheckSquare } from 'lucide-react';

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
  const [activeIcon, setActiveIcon] = useState(0);

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

  // İkon değiştirme animasyonu
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setActiveIcon(prev => (prev + 1) % 4);
    }, 1000);

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

  // Eğitim temalı ikonlar
  const icons = [
    { icon: BookOpen, label: "Hazırlanıyor" },
    { icon: PenTool, label: "Yükleniyor" },
    { icon: FileText, label: "Kontrol ediliyor" },
    { icon: CheckSquare, label: "Tamamlanıyor" }
  ];

  const ActiveIcon = icons[activeIcon].icon;

  return (
    <div
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300",
        shouldRender && isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className="flex flex-col items-center justify-center text-center p-8 max-w-md">
        {/* Logo ve Başlık */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary dark:text-primary-foreground">
            Kent Konut Sınav Portalı
          </h1>
        </div>

        {/* Eğitim Temalı Animasyon */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              {/* Animasyonlu ikon */}
              <div className="p-6 bg-primary/10 dark:bg-primary/20 rounded-full">
                <ActiveIcon className="h-16 w-16 text-primary dark:text-primary-foreground animate-bounce" />
              </div>

              {/* Dönen daire efekti */}
              <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          {/* İkon altındaki metin */}
          <p className="text-lg font-medium text-primary dark:text-primary-foreground">
            {icons[activeIcon].label}{dots}
          </p>
        </div>

        {/* Yükleniyor Metni */}
        <div className="text-center">
          <p className="text-xl font-semibold mb-2 text-foreground dark:text-foreground">
            Yükleniyor{dots}
          </p>
          <p className="text-base text-muted-foreground mt-1">{message}</p>
        </div>

        {/* İlerleme Çubuğu */}
        <div className="w-full mt-6 bg-muted rounded-full h-2.5 overflow-hidden">
          <div className="bg-primary h-2.5 rounded-full animate-progress"></div>
        </div>
      </div>
    </div>
  );
};
