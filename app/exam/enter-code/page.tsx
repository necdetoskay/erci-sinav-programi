'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Yeni sınav giriş sayfasına yönlendir
    router.replace('/exam');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <h1 className="text-xl font-semibold">Yönlendiriliyor...</h1>
      </div>
      <p className="mt-2 text-muted-foreground text-center">
        Sınav giriş sayfası güncellendi. Yeni sayfaya yönlendiriliyorsunuz.
      </p>
    </div>
  );
}
