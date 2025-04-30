'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function EnterExamCodePage() {
  const [examCode, setExamCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // TODO: Sınav kodunun geçerliliğini kontrol et (API isteği ile?)
    // Şimdilik basitçe bir sonraki adıma yönlendirelim
    if (examCode.trim()) {
      // Sınav kodunu bir sonraki sayfaya query parametresi olarak gönderelim
      router.push(`/exam/enter-email?examCode=${encodeURIComponent(examCode.trim())}`);
    } else {
      toast.error("Geçersiz Giriş", {
        description: "Lütfen geçerli bir sınav kodu girin.",
      });
      setIsLoading(false);
    }
    // Gerçek uygulamada API yanıtını bekleyip ona göre yönlendirme veya hata gösterme yapılır.
    // setIsLoading(false); // API isteği bittikten sonra
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sınava Giriş</CardTitle>
          <CardDescription>Lütfen size e-posta ile gönderilen sınav kodunu girin.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="examCode">Sınav Kodu</Label>
              <Input
                id="examCode"
                type="text"
                placeholder="Sınav kodunuz"
                value={examCode}
                onChange={(e) => setExamCode(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'İşleniyor...' : 'Devam Et'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
