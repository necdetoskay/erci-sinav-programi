"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";
import { UserProvider } from "@/app/context/UserContext";

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <UserProvider>
      <NextThemesProvider {...props}>
        {children}
      </NextThemesProvider>
    </UserProvider>
  );
}