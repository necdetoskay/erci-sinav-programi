'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useRouter import edildi
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // CardFooter import edildi
import { Skeleton } from '@/components/ui/skeleton';
import { ExamAttemptStatus } from "@/types/prisma";
import { Button } from '@/components/ui/button'; // Button import edildi
import { toast } from 'sonner'; // toast import edildi
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // AlertDialog import edildi

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
    const router = useRouter(); // useRouter hook'u kullanıldı
    const attemptId = params.attemptId as string;
    const [result, setResult] = useState<ExamResultResponse | null>(null); // Tip güncellendi
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false); // Deleting state
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

    const handleDeleteAttempt = async () => {
        if (!attemptId) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/exam/attempt/${attemptId}/delete`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete attempt.');
            }
            toast.success("Attempt Deleted", { description: "You can now retake the exam." });
            // Redirect back to the start page after successful deletion
            router.push('/exam/enter-code');
        } catch (err: any) {
            console.error("Error deleting attempt:", err);
            toast.error("Deletion Failed", { description: err.message || 'Could not delete the exam attempt.' });
        } finally {
            setIsDeleting(false);
        }
    };

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
                <CardFooter className="flex justify-center">
                    {/* Delete Attempt Button */}
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isDeleting}>
                                {isDeleting ? 'Siliniyor...' : 'Denemeyi Sil & Tekrar Başla'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bu işlem geri alınamaz. Bu sınav denemesi ve cevaplarınız kalıcı olarak silinecektir.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>İptal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAttempt} disabled={isDeleting}>
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );
}
