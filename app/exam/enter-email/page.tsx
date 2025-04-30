'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

function EnterEmailContent() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [examCode, setExamCode] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('examCode');
    if (code) {
      setExamCode(code);
    } else {
      // Exam code yoksa ilk adıma geri yönlendir
      toast.error("Sınav Kodu Bulunamadı", {
        description: "Lütfen tekrar deneyin.",
      });
      router.push('/exam/enter-code');
    }
  }, [searchParams, router]);

  const handleRequestCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!examCode || !email.trim()) {
      toast.error("Geçersiz Giriş", {
        description: "Lütfen geçerli bir e-posta adresi girin.",
      });
      return;
    }
    setIsLoading(true);

    try {
      // TODO: API isteği yapılacak (/api/exam/request-verification)
      console.log('API İsteği Gönderiliyor:', { email, examCode });
      // const response = await fetch('/api/exam/request-verification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email: email.trim(), examCode }),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Doğrulama kodu gönderilemedi.');
      // }

      // const result = await response.json();
      // console.log('API Yanıtı:', result);

      toast.success("Doğrulama Kodu Gönderildi", {
         description: "Lütfen e-posta kutunuzu kontrol edin.",
      });

      // Başarılı olursa bir sonraki adıma yönlendir
      // Sınav kodunu ve email'i de gönderelim ki sonraki adımda kullanılabilsin
      router.push(`/exam/verify-code?examCode=${encodeURIComponent(examCode)}&email=${encodeURIComponent(email.trim())}`);

    } catch (error: any) {
      console.error("Doğrulama kodu isteği hatası:", error);
      toast.error("İstek Başarısız", {
        description: error.message || "Bir sorun oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!examCode) {
    // examCode yüklenene kadar veya hata durumunda bir yükleme göstergesi
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
          <CardTitle>E-posta Doğrulama</CardTitle>
          <CardDescription>Sınava devam etmek için lütfen e-posta adresinizi girin ve doğrulama kodu isteyin.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRequestCode}>
          <CardContent className="space-y-4">
             <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Sınav Kodu: <span className="font-bold">{examCode}</span></p>
             </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta Adresi</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@eposta.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


export default function EnterEmailPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Yükleniyor...</div>}>
            <EnterEmailContent />
        </Suspense>
    )
}
