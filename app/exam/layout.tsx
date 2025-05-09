"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Failed to fetch session');
        }

        const data = await response.json();

        if (!data.user) {
          // Oturum yoksa login sayfasına yönlendir
          router.push('/auth/login');
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error('Session check error:', error);
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [router]);

  // Oturum yükleniyor
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }

  // Oturum yoksa boş div döndür (useEffect içinde yönlendirme yapılacak)
  if (!user) {
    return <div></div>;
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-bold">EYSS</div>
          <div className="flex items-center gap-4">
            <div>
              {user.name} ({user.email})
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>

      <Toaster />
    </div>
  );
}
