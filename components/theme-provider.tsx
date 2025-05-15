"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Tema değişikliklerini localStorage'a kaydetmemek için storageKey'i null olarak ayarla
  // Bu sayede her kullanıcının kendi teması olacak
  return (
    <NextThemesProvider
      {...props}
      storageKey={null} // Tema değişikliklerini localStorage'a kaydetme
      enableSystem={false} // Sistem temasını kullanma
    >
      {children}
    </NextThemesProvider>
  );
}
