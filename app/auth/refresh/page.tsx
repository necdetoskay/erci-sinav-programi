"use client";

import { useEffect, useState, Suspense } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function RefreshSessionContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Otomatik yönlendirme için zamanlayıcı
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSignOut();
    }, 10000); // 10 saniye sonra otomatik çıkış yap

    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // JWT tabanlı çıkış işlemi
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Login sayfasına yönlendir
      router.push("/auth/login");
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
      // Hata olsa bile login sayfasına yönlendir
      router.push("/auth/login");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Oturum Süresi Doldu</CardTitle>
          <CardDescription className="text-center">
            Oturumunuz sona erdi veya bir sorun oluştu. Lütfen yeniden giriş yapın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Güvenlik nedeniyle oturumunuz sonlandırıldı. Devam etmek için yeniden giriş yapmanız gerekmektedir.
          </p>
          <p className="text-sm text-muted-foreground">
            10 saniye içinde otomatik olarak giriş sayfasına yönlendirileceksiniz.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Yönlendiriliyor...
              </>
            ) : (
              "Giriş Sayfasına Git"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RefreshSessionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RefreshSessionContent />
    </Suspense>
  );
}
