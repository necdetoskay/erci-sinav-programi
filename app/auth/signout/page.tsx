"use client";

import { useState, Suspense } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { LoadingLink } from "@/components/ui/loading-link";

function SignOutContent() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      // JWT tabanlı çıkış işlemi
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Ana sayfaya yönlendir
      router.push("/");
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
      // Hata olsa bile ana sayfaya yönlendir
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 z-0"></div>

          <div className="relative z-10">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative h-20 w-20 bg-white p-2 rounded-full shadow-md">
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    fill
                    className="object-contain p-1"
                    onError={(e) => {
                      // Logo yüklenemezse, hata işleyicisi
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Çıkış Yap
              </CardTitle>
              <CardDescription className="text-base">
                Oturumunuzu sonlandırmak istediğinize emin misiniz?
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-4">
              <div className="text-center text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p>Çıkış yaptıktan sonra tekrar giriş yapmanız gerekecektir.</p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pb-6">
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-300"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Çıkış Yapılıyor...
                  </span>
                ) : (
                  "Evet, Çıkış Yap"
                )}
              </Button>
              <LoadingLink href="/dashboard" className="w-full">
                <Button variant="outline" className="w-full hover:bg-blue-50 transition-colors">
                  İptal
                </Button>
              </LoadingLink>
            </CardFooter>
          </div>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Erci Sınav Programı &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}

export default function SignOutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignOutContent />
    </Suspense>
  );
}
