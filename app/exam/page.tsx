"use client";

import { useState, useEffect, Suspense } from "react";
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

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }

    checkSession();
  }, []);

  const handleJoinExamWithCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!examCode.trim()) {
      toast.error("Lütfen bir sınav kodu girin");
      return;
    }

    try {
      setIsLoading(true);

      // Sınav kodunu doğrula
      const response = await fetch("/api/exams/validate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessCode: examCode }),
      });

      if (!response.ok) {
        throw new Error("Geçersiz sınav kodu");
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
        throw new Error("Sınav başlatılırken bir hata oluştu");
      }

      const startData = await startResponse.json();

      toast.success("Sınav başlatılıyor...");

      // Sınav sayfasına yönlendir
      window.location.href = `/exam/${data.examId}/take?attemptId=${startData.attemptId}`;
    } catch (error) {
      console.error("Sınav kodu doğrulama hatası:", error);
      toast.error(error instanceof Error ? error.message : "Geçersiz sınav kodu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center">EYSS Sınav Portalı</h1>

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
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kontrol Ediliyor...
                </span>
              ) : (
                "Sınava Katıl"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Sınav kodunu sınav yöneticisinden alabilirsiniz.</p>
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
