import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import ClientProviders from "@/app/client-providers";
import { LoadingProvider } from "@/providers/loading-provider";
import { AuthProvider } from "@/providers/auth-provider";

export const dynamic = 'force-dynamic'; // Force dynamic rendering for the entire layout

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next.js Fullstack Template",
  description: "A fullstack template built with Next.js, Prisma, and JWT Authentication",
};

// Next.js 13.4+ için viewport export'u ayrı olmalı
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning className="light" style={{ colorScheme: 'light' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />

        <style dangerouslySetInnerHTML={{
          __html: `
            /* Temel stiller */
            :root {
              --foreground-rgb: 0, 0, 0;
              --background-rgb: 255, 255, 255;
            }

            body {
              color: rgb(var(--foreground-rgb));
              background: rgb(var(--background-rgb));
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
            }

            /* Temel UI bileşenleri */
            .btn {
              padding: 0.5rem 1rem;
              border-radius: 0.375rem;
              font-weight: 500;
            }

            .btn-primary {
              background-color: #3b82f6;
              color: white;
            }

            .btn-primary:hover {
              background-color: #2563eb;
            }

            .card {
              background-color: white;
              border-radius: 0.5rem;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              padding: 1rem;
            }

            .input {
              border: 1px solid #d1d5db;
              border-radius: 0.375rem;
              padding: 0.5rem 0.75rem;
            }

            .label {
              display: block;
              font-size: 0.875rem;
              font-weight: 500;
              color: #374151;
              margin-bottom: 0.25rem;
            }
          `
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Sayfa yüklendiğinde çalışacak script
            (function() {
              // localStorage'dan theme değerini temizle
              try {
                localStorage.removeItem('theme');
                localStorage.setItem('theme', 'light');
                sessionStorage.removeItem('theme');
                sessionStorage.setItem('theme', 'light');
              } catch (e) {}

              // Doküman elementine light sınıfını ekle, dark sınıfını kaldır
              document.documentElement.classList.add('light');
              document.documentElement.classList.remove('dark');
              document.documentElement.style.colorScheme = 'light';

              // Tema değişikliğini engelle
              window.matchMedia('(prefers-color-scheme: dark)').addListener = function() {};
            })();
          `
        }} />
      </head>
      <body className={inter.className} style={{ backgroundColor: 'white', color: 'black' }}>
        <LoadingProvider> {/* LoadingProvider en dışta */}
          <AuthProvider>  {/* AuthProvider, LoadingProvider içinde */}
            <ClientProviders>{children}</ClientProviders>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
