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
