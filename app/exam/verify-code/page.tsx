'use client';

import { useState, useEffect, Suspense } from 'react';
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

function VerifyCodeContent() {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [examCode, setExamCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('examCode');
    const userEmail = searchParams.get('email');

    if (code && userEmail) {
      setExamCode(code);
      setEmail(userEmail);
    } else {
      // Gerekli parametreler yoksa ilk adıma yönlendir
      toast.error("Eksik Bilgi", {
        description: "Gerekli bilgiler bulunamadı. Lütfen süreci baştan başlatın.",
      });
      router.push('/exam/enter-code');
    }
  }, [searchParams, router]);

  const handleVerifyCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!examCode || !email || !verificationCode.trim()) {
      toast.error("Geçersiz Giriş", {
        description: "Lütfen e-postanıza gelen doğrulama kodunu girin.",
      });
      return;
    }
    setIsLoading(true);

    try {
      // TODO: API isteği yapılacak (/api/exam/verify-code)
      console.log('API İsteği Gönderiliyor:', { email, examCode, verificationCode });
      // const response = await fetch('/api/exam/verify-code', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, examCode, verificationCode: verificationCode.trim() }),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Doğrulama kodu geçersiz veya süresi dolmuş.');
      // }

      // const result = await response.json(); // Belki sınav ID'si veya token döner
      // console.log('API Yanıtı:', result);

      toast.success("Doğrulama Başarılı", {
         description: "Sınava yönlendiriliyorsunuz...",
      });

      // Başarılı olursa sınav sayfasına yönlendir
      // Şimdilik placeholder bir sayfaya yönlendirelim
      // Gerçek uygulamada API'den dönen examId ile /exam/[examId] gibi bir yola gidilebilir
      router.push(`/exam/start?examCode=${encodeURIComponent(examCode)}`); // Veya /exam/ready

    } catch (error: any) {
      console.error("Doğrulama hatası:", error);
      toast.error("Doğrulama Başarısız", {
        description: error.message || "Kod geçersiz veya bir sorun oluştu.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!examCode || !email) {
    // Parametreler yüklenene kadar veya hata durumunda
    return (
        <div className="flex min-h-screen items-center justify-center">
            Yükleniyor...
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Kodu Doğrula</CardTitle>
          <CardDescription>
            <p>{email} adresine gönderilen doğrulama kodunu girin.</p>
            <p className="text-sm text-muted-foreground mt-1">Sınav Kodu: {examCode}</p>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerifyCode}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Doğrulama Kodu</Label>
              <Input
                id="verificationCode"
                type="text" // Genellikle 6 haneli sayı olur ama text bırakalım
                placeholder="E-postanıza gelen kod"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                disabled={isLoading}
                inputMode="numeric" // Mobil cihazlarda numerik klavye açar
                pattern="\d{6}" // Opsiyonel: 6 haneli sayı formatı zorlaması
                title="Lütfen 6 haneli doğrulama kodunu girin." // Opsiyonel: Format ipucu
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Doğrulanıyor...' : 'Sınava Başla'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function VerifyCodePage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Yükleniyor...</div>}>
            <VerifyCodeContent />
        </Suspense>
    )
}
