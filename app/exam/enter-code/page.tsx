'use client';

import { useState, Suspense } from 'react';
// useRouter şimdilik kullanılmayacak, API sonrası yönlendirme yapılacak
// import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link'; // Sınav linki için

function EnterExamCodeForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [examCode, setExamCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Sınav detaylarını (ID, başlık, soru sayısı) ve linki tutacak state
  const [examDetails, setExamDetails] = useState<{ id: number; title: string; questionCount: number; link: string; } | null>(null);
  // const router = useRouter(); // Şimdilik kullanılmayacak

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setExamDetails(null); // Yeni sorguda eski detayları temizle

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedExamCode = examCode.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedExamCode) {
      toast.error("Eksik Bilgi", {
        description: "Lütfen Ad, Soyad ve Sınav Kodu alanlarını doldurun.",
      });
      setIsLoading(false);
      return;
    }

    console.log('Sorgulanan Bilgiler:', { firstName: trimmedFirstName, lastName: trimmedLastName, examCode: trimmedExamCode });

    // --- API Çağrısı Bölümü ---
    try {
      const response = await fetch('/api/exam/check-details', { // Yeni API endpoint'i
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          examCode: trimmedExamCode
        }),
      });

      const data = await response.json();

      if (response.ok && data.examId) {
        // Başarılı: Sınav detaylarını ve linki state'e kaydet
        // Linke firstName ve lastName'i de ekleyelim
        const examLink = `/exam/start/${data.examId}?code=${encodeURIComponent(trimmedExamCode)}&firstName=${encodeURIComponent(trimmedFirstName)}&lastName=${encodeURIComponent(trimmedLastName)}`;
        setExamDetails({
          id: data.examId,
          title: data.examTitle || 'Başlıksız Sınav',
          questionCount: data.questionCount,
          link: examLink
        });
        toast.success(data.message || "Sınav Bulundu", {
          description: `"${data.examTitle || 'Sınav'}" için aşağıdaki bilgileri kontrol edip sınava başlayabilirsiniz.`,
        });
      } else {
        // Başarısız veya sınav bulunamadı
        toast.error("İşlem Başarısız", {
          description: data.message || "Girdiğiniz bilgilere uygun bir sınav bulunamadı veya bir hata oluştu.",
        });
      }
    } catch (error) {
      console.error("API isteği sırasında hata:", error);
      toast.error("Hata", {
        description: "Sınav bilgileri sorgulanırken bir ağ hatası veya sunucu hatası oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsLoading(false);
    }
    // --- API Çağrısı Bölümü Bitiş ---
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sınava Giriş</CardTitle>
          <CardDescription>Sınava girmek için lütfen bilgilerinizi ve sınav kodunu girin.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Adınız</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Adınız"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Soyadınız</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Soyadınız"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
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
            {/* Sınav detayları ve link alanı */}
            {examDetails && !isLoading && (
              <div className="mt-6 border-t pt-4 text-center space-y-3">
                <h3 className="text-lg font-semibold">{examDetails.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Soru Sayısı: {examDetails.questionCount}
                </p>
                {/* Zorluk seviyesi bilgisi API'den gelmediği için gösterilmiyor */}
                 <Link href={examDetails.link} passHref legacyBehavior>
                    <a className="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-700 dark:hover:bg-green-800 dark:focus:ring-green-600 dark:focus:ring-offset-gray-950">
                        Sınava Başla
                    </a>
                </Link>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sorgulanıyor...' : 'Sınavı Sorgula'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function EnterExamCodePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnterExamCodeForm />
    </Suspense>
  );
}
