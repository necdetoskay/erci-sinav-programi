"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportQuestionsProps {
  id: number;
  title: string;
}

export function ExportQuestions({ id, title }: ExportQuestionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleExport() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/question-pools/${id}/questions`);
      
      if (!response.ok) {
        throw new Error("Sorular yüklenirken bir hata oluştu");
      }
      
      const questions = await response.json();
      
      // Dışa aktarılacak veriyi hazırla
      const exportData = {
        title: title,
        difficulty: questions.length > 0 ? questions[0].difficulty : "medium",
        questions: questions.map((q: any) => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }))
      };
      
      // JSON dosyasını oluştur
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      // Dosyayı indir
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_sorular.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Sorular başarıyla dışa aktarıldı");
    } catch (error) {
      console.error("Sorular dışa aktarılırken bir hata oluştu:", error);
      toast.error("Sorular dışa aktarılırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleExport}
      disabled={isLoading}
      title="Soruları Dışa Aktar"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}
