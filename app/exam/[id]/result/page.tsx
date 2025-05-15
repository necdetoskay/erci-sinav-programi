"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface ExamResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  examTitle: string;
  examDescription: string | null;
  participantName: string;
  participantEmail: string | null;
  startTime: string;
  endTime: string;
  answers: Record<string, {
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string | null;
  }>;
}

export default function ExamResultPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const examId = parseInt(params.id);

  const [result, setResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) {
      toast.error("Sınav sonucu bulunamadı");
      router.push("/exam");
      return;
    }

    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/exams/${examId}/attempt/${attemptId}/result`);

        if (!response.ok) {
          throw new Error("Sınav sonucu yüklenirken bir hata oluştu");
        }

        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error("Sınav sonucu yükleme hatası:", error);
        toast.error("Sınav sonucu yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [examId, attemptId, router]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Sınav sonucu yükleniyor...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Sınav sonucu bulunamadı</h2>
          <Button onClick={() => router.push("/exam")}>Sınav Sayfasına Dön</Button>
        </div>
      </div>
    );
  }

  const percentage = Math.round(result.score || 0);

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Sınav Sonucu</CardTitle>
          <CardDescription>{result.examTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium mb-2">Sınav Bilgileri</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sınav Adı:</span>
                  <span className="font-medium">{result.examTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Katılımcı:</span>
                  <span className="font-medium">{result.participantName}</span>
                </div>
                {result.participantEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-posta:</span>
                    <span className="font-medium">{result.participantEmail}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Başlangıç:</span>
                  <span className="font-medium">{formatDate(result.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bitiş:</span>
                  <span className="font-medium">{formatDate(result.endTime)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-3xl font-bold">{percentage}%</div>
                </div>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200 stroke-current"
                    strokeWidth="10"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                  ></circle>
                  <circle
                    className={`${
                      percentage >= 70
                        ? "text-green-500"
                        : percentage >= 50
                        ? "text-yellow-500"
                        : "text-red-500"
                    } stroke-current`}
                    strokeWidth="10"
                    strokeLinecap="round"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    strokeDasharray={`${percentage * 2.51} 251`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  ></circle>
                </svg>
              </div>
              <div className="text-center">
                <div className="font-medium">
                  {result.correctAnswers} / {result.totalQuestions} doğru cevap
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {percentage >= 70
                    ? "Tebrikler! Harika bir sonuç."
                    : percentage >= 50
                    ? "İyi bir sonuç. Biraz daha çalışabilirsiniz."
                    : "Daha fazla çalışmanız gerekiyor."}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center mb-8">
        <Button onClick={() => router.push("/exam")}>Sınav Sayfasına Dön</Button>
      </div>
    </div>
  );
}
