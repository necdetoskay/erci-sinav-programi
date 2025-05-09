"use client";

import { useEffect, Suspense, useState } from 'react';
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useRouter } from 'next/navigation';

function HomeComponent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Failed to fetch session');
        }

        const data = await response.json();

        if (data.user) {
          // Kullanıcı rolüne göre yönlendirme
          if (data.user.role === 'PERSONEL') {
            router.push('/exam');
          } else {
            router.push('/dashboard');
          }
        } else {
          // Oturum açılmamışsa login sayfasına yönlendir
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [router]);

  // Yükleme durumunda gösterilecek içerik
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Erci Sınav Programı</h1>
        <p>Yükleniyor, lütfen bekleyiniz...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erci Sınav Programı</h1>
          <p>Yükleniyor...</p>
        </div>
      </div>
    }>
      <HomeComponent />
    </Suspense>
  );
}
