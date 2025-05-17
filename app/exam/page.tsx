"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Exam {
  id: number;
  title: string;
  description: string | null;
  status: string;
  duration_minutes: number;
  access_code: string | null;
}

function ExamEntryForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [examCode, setExamCode] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        setIsCheckingSession(true);
        const response = await fetch('/api/auth/me');

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);

          // Kullanıcı rolünü kontrol et
          if (data.user && data.user.role !== 'PERSONEL') {
            // Admin veya SuperAdmin rolündeki kullanıcılar için uyarı göster
            toast.warning(
              "Dikkat: Şu anda " +
              (data.user.role === 'ADMIN' ? 'Yönetici' :
               data.user.role === 'SUPERADMIN' ? 'Süper Yönetici' :
               data.user.role) +
              " hesabıyla giriş yapmış durumdasınız. Sınava katılmak için personel hesabıyla giriş yapmanız gerekmektedir.",
              { duration: 10000 }
            );
          }
        } else {
          // Kullanıcı oturum açmamışsa, login sayfasına yönlendir
          console.log('User not logged in, redirecting to login page');
          router.push('/auth/login?callbackUrl=/exam');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Hata durumunda da login sayfasına yönlendir
        router.push('/auth/login?callbackUrl=/exam');
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkSession();
  }, [router]);

  const handleJoinExamWithCode = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kullanıcı oturum kontrolü
    if (!user) {
      toast.error("Bu işlemi gerçekleştirmek için giriş yapmanız gerekmektedir.");
      router.push('/auth/login?callbackUrl=/exam');
      return;
    }

    // Kullanıcı rolü kontrolü
    if (user.role !== 'PERSONEL') {
      toast.error("Sınava katılmak için personel hesabıyla giriş yapmanız gerekmektedir. Şu anda " +
        (user.role === 'ADMIN' ? 'Yönetici' :
         user.role === 'SUPERADMIN' ? 'Süper Yönetici' :
         user.role) + " hesabıyla giriş yapmış durumdasınız.");
      return;
    }

    if (!examCode.trim()) {
      toast.error("Lütfen bir sınav kodu girin");
      return;
    }

    // Sınav kodunu temizle (boşluk, tire vb. karakterleri kaldır)
    const cleanedExamCode = examCode.trim();

    try {
      setIsLoading(true);

      // Sınav kodunu doğrula
      console.log("Doğrulanacak sınav kodu:", cleanedExamCode);
      const response = await fetch("/api/exams/validate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode: cleanedExamCode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Sınav kodu doğrulama hatası:", response.status, errorData);

        // Hata durumuna göre özelleştirilmiş mesajlar
        if (response.status === 401) {
          throw new Error("Bu işlemi gerçekleştirmek için giriş yapmanız gerekmektedir.");
        } else if (response.status === 403) {
          throw new Error("Bu sınava erişim yetkiniz bulunmamaktadır.");
        } else if (response.status === 404) {
          throw new Error("Girdiğiniz sınav kodu sistemde bulunamadı. Lütfen kodu kontrol edip tekrar deneyin.");
        } else {
          throw new Error(errorData.error || "Sınav kodunu doğrularken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        }
      }

      const data = await response.json();

      // Sınavı başlat
      const startResponse = await fetch(`/api/exams/${data.examId}/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Boş body, kullanıcı bilgileri session'dan alınacak
      });

      if (!startResponse.ok) {
        const startErrorData = await startResponse.json().catch(() => ({}));

        // Sınav başlatma hatalarına göre özelleştirilmiş mesajlar
        if (startResponse.status === 401) {
          throw new Error("Sınavı başlatmak için giriş yapmanız gerekmektedir.");
        } else if (startResponse.status === 403) {
          throw new Error("Bu sınavı başlatma yetkiniz bulunmamaktadır.");
        } else if (startResponse.status === 400) {
          throw new Error(startErrorData.error || "Sınav başlatılamadı. Sınav aktif durumda olmayabilir.");
        } else {
          throw new Error(startErrorData.error || "Sınav başlatılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        }
      }

      const startData = await startResponse.json();

      toast.success("Sınav başlatılıyor...");

      // Sınav sayfasına yönlendir
      window.location.href = `/exam/${data.examId}/take?attemptId=${startData.attemptId}`;
    } catch (error) {
      console.error("Sınav kodu doğrulama hatası:", error);
      toast.error(error instanceof Error ? error.message : "Sınav başlatılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  // Oturum kontrolü yapılırken yükleme göster
  if (isCheckingSession) {
    return (
      <div className="container mx-auto max-w-md flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-center text-muted-foreground">Oturum durumu kontrol ediliyor...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center">EYSS Sınav Portalı</h1>

      {/* Kullanıcı bilgisi ve rol uyarısı */}
      {user && (
        <div className="mb-6 p-4 rounded-md bg-blue-50 border border-blue-200">
          <p className="text-blue-800 font-medium">
            Giriş yapan kullanıcı: <span className="font-bold">{user.name}</span>
          </p>
          <p className="text-blue-700 text-sm mt-1">
            E-posta: {user.email}
          </p>
          <p className="text-blue-700 text-sm mt-1">
            Rol: {user.role === 'PERSONEL' ? 'Personel' :
                 user.role === 'ADMIN' ? 'Yönetici' :
                 user.role === 'SUPERADMIN' ? 'Süper Yönetici' : user.role}
          </p>

          {user.role !== 'PERSONEL' && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
              <p className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Sınava katılmak için personel hesabıyla giriş yapmanız gerekmektedir.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sadece Sınav Kodu ile Giriş */}
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sınav Kodunu Girin</CardTitle>
          <CardDescription>Katılmak istediğiniz sınavın kodunu girin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoinExamWithCode} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="examCode" className="text-base">Sınav Kodu</Label>
              <Input
                id="examCode"
                placeholder="Sınav kodunu girin"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                className="text-lg h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading || !user || user.role !== 'PERSONEL'}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kontrol Ediliyor...
                </span>
              ) : !user ? (
                "Giriş Yapmanız Gerekiyor"
              ) : user.role !== 'PERSONEL' ? (
                "Personel Hesabı Gerekiyor"
              ) : (
                "Sınava Katıl"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Sınav kodunu sınav yöneticisinden alabilirsiniz.</p>
        {!user && (
          <p className="mt-2 text-blue-600">
            <a href="/auth/login?callbackUrl=/exam" className="underline">Giriş yapmak için tıklayın</a>
          </p>
        )}
        {user && user.role !== 'PERSONEL' && (
          <p className="mt-2 text-blue-600">
            <a href="/auth/logout" className="underline">Çıkış yapmak için tıklayın</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={<div>Loading exam entry...</div>}>
      <ExamEntryForm />
    </Suspense>
  );
}
