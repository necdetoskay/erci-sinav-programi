'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExamAttemptStatus } from '@prisma/client'; // ExamAttemptStatus import edildi

// API'den gelen yanıt tipini tanımlayalım
interface ExamResultResponse {
    attemptId: string;
    examTitle: string;
    score: number; // Doğru cevap sayısı
    totalQuestions: number;
    percentage: number;
    status: ExamAttemptStatus; // Sınavın bitiş durumu
}

export default function ExamResultsPage() {
    const params = useParams();
    const attemptId = params.attemptId as string;
    const [result, setResult] = useState<ExamResultResponse | null>(null); // Tip güncellendi
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResult = async () => {
            if (!attemptId) return;
            setIsLoading(true);
            setError(null);
            try {
                // API endpoint'inden veriyi çek
                const response = await fetch(`/api/exam/attempt/${attemptId}/results`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Sonuçlar alınamadı.');
                }
                const data: ExamResultResponse = await response.json(); // Gelen veriyi doğru tiple al
                setResult(data);

            } catch (err: any) {
                setError(err.message || 'Sonuçlar yüklenirken bir hata oluştu.');
                console.error("Sonuçları alma hatası:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResult();
    }, [attemptId]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return <div className="flex min-h-screen items-center justify-center text-red-600">{error}</div>;
    }

    if (!result) {
        return <div className="flex min-h-screen items-center justify-center">Sonuç bulunamadı.</div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 md:p-8 bg-gray-100 dark:bg-gray-950">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl mb-2">Sınav Sonucu</CardTitle>
                    <CardDescription>{result.examTitle}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <div className="text-4xl font-bold">
                        %{result.percentage.toFixed(0)}
                    </div>
                    <p className="text-lg">
                        {result.score} / {result.totalQuestions} Doğru Cevap
                    </p>
                    {/* İleride daha fazla detay eklenebilir */}
                    {/* <p>Süre: {result.timeTaken ? `${Math.floor(result.timeTaken / 60)}dk ${result.timeTaken % 60}sn` : '-'}</p> */}
                </CardContent>
                {/* İsteğe bağlı: Ana sayfaya veya başka bir yere dön butonu */}
                {/* <CardFooter>
                    <Button className="w-full">Ana Sayfaya Dön</Button>
                </CardFooter> */}
            </Card>
        </div>
    );
}
