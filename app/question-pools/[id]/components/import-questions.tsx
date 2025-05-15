"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImportQuestionsProps {
  id: number;
}

export function ImportQuestions({ id }: ImportQuestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImport(event: React.FormEvent) {
    event.preventDefault();
    
    if (!fileInputRef.current?.files?.length) {
      toast.error("Lütfen bir dosya seçin");
      return;
    }
    
    const file = fileInputRef.current.files[0];
    
    if (file.type !== "application/json") {
      toast.error("Lütfen JSON formatında bir dosya seçin");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Dosyayı oku
      const fileContent = await file.text();
      let importData;
      
      try {
        importData = JSON.parse(fileContent);
      } catch (error) {
        toast.error("Geçersiz JSON formatı");
        return;
      }
      
      // Veri yapısını kontrol et
      if (!importData.questions || !Array.isArray(importData.questions)) {
        toast.error("Geçersiz soru formatı");
        return;
      }
      
      // Soruları ekle
      const response = await fetch(`/api/question-pools/${id}/questions/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: importData.questions.map((q: any) => ({
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            difficulty: q.difficulty || importData.difficulty || "medium",
            tags: q.tags || []
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error("Sorular içe aktarılırken bir hata oluştu");
      }
      
      toast.success(`${importData.questions.length} soru başarıyla içe aktarıldı`);
      setOpen(false);
      
      // Sayfayı yenile
      window.location.reload();
    } catch (error) {
      console.error("Sorular içe aktarılırken bir hata oluştu:", error);
      toast.error("Sorular içe aktarılırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Soruları İçe Aktar"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Soruları İçe Aktar</DialogTitle>
          <DialogDescription>
            Daha önce dışa aktarılmış soruları içe aktarın. Dosya JSON formatında olmalıdır.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleImport}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">JSON Dosyası</Label>
              <Input
                id="file"
                type="file"
                accept=".json"
                ref={fileInputRef}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "İçe Aktarılıyor..." : "İçe Aktar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
