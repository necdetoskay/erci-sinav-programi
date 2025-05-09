"use client";

import { useState, Suspense } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function FixQuestionFormComponent() {
  const [questionId, setQuestionId] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionId || !correctAnswer) {
      toast.error("Soru ID ve doğru cevap gereklidir");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/admin/fix-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: parseInt(questionId),
          correctAnswer,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Bir hata oluştu");
      }

      setResult(data);
      toast.success("Soru başarıyla güncellendi");
    } catch (error) {
      console.error("Hata:", error);
      toast.error("Soru güncellenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Soru Cevabını Düzelt</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="questionId" className="block text-sm font-medium mb-1">
                Soru ID
              </label>
              <Input
                id="questionId"
                type="number"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                placeholder="Soru ID'sini girin"
                required
              />
            </div>
            
            <div>
              <label htmlFor="correctAnswer" className="block text-sm font-medium mb-1">
                Doğru Cevap
              </label>
              <Input
                id="correctAnswer"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Doğru cevabı girin (örn: '3')"
                required
              />
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </form>
          
          {result && (
            <div className="mt-6 p-4 border rounded-md bg-green-50">
              <h3 className="font-medium text-green-800">Güncelleme Başarılı</h3>
              <pre className="mt-2 text-sm overflow-auto p-2 bg-white rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FixQuestionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FixQuestionFormComponent />
    </Suspense>
  );
}
