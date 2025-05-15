"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from "@/providers/user-provider";
import { LoadingProvider } from "@/providers/loading-provider";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        storageKey="user-theme"
        disableTransitionOnChange
      >
        <LoadingProvider>
          {children}
          <Toaster richColors position="top-right" />
        </LoadingProvider>
      </ThemeProvider>
    </UserProvider>
  );
}
