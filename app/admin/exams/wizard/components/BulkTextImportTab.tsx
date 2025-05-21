"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { FileText } from "lucide-react";
import { AddQuestionFunction } from "./types";

interface BulkTextImportTabProps {
  addQuestion: AddQuestionFunction;
  questionsCount: number;
  onSuccess: () => void;
}

export const BulkTextImportTab: React.FC<BulkTextImportTabProps> = ({
  addQuestion,
  questionsCount,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [bulkText, setBulkText] = useState("");
  
  // Toplu metin girişinden soru ekleme işlemi
  const handleBulkImport = () => {
    if (!bulkText.trim()) {
      toast({
        title: "Hata",
        description: "Lütfen soru metni girin",
        variant: "destructive",
      });
      return;
    }
    
    // Basit bir parser örneği (gerçek uygulamada daha sağlam bir parser gerekir)
    try {
      const questionBlocks = bulkText.split(/\d+\.\s/).filter(block => block.trim());
      const parsedQuestions = questionBlocks.map((block, index) => {
        const lines = block.trim().split('\n');
        const questionText = lines[0].trim();
        
        // Seçenekleri bul
        const options = [];
        let correctAnswer = "";
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('A)') || line.startsWith('A) ')) {
            options.push({ id: Date.now() + (index * 100) + 1, text: line.substring(2).trim() });
          } else if (line.startsWith('B)') || line.startsWith('B) ')) {
            options.push({ id: Date.now() + (index * 100) + 2, text: line.substring(2).trim() });
          } else if (line.startsWith('C)') || line.startsWith('C) ')) {
            options.push({ id: Date.now() + (index * 100) + 3, text: line.substring(2).trim() });
          } else if (line.startsWith('D)') || line.startsWith('D) ')) {
            options.push({ id: Date.now() + (index * 100) + 4, text: line.substring(2).trim() });
          } else if (line.toLowerCase().includes('doğru cevap:')) {
            correctAnswer = line.split(':')[1].trim();
          }
        }
        
        return {
          id: Date.now() + index,
          text: questionText,
          options,
          correctAnswer,
          position: questionsCount + index + 1
        };
      });
      
      // Soruları ekle
      parsedQuestions.forEach(q => addQuestion(q));
      
      toast({
        title: "Başarılı",
        description: `${parsedQuestions.length} soru başarıyla eklendi.`,
      });
      
      setBulkText("");
      onSuccess();
    } catch (error) {
      console.error("Soru ayrıştırma hatası:", error);
      toast({
        title: "Hata",
        description: "Sorular ayrıştırılırken bir hata oluştu. Lütfen formatı kontrol edin.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bulk-text">Toplu Metin Girişi</Label>
        <Textarea
          id="bulk-text"
          placeholder="Soruları aşağıdaki formatta girin:

1. Soru metni?
A) Seçenek 1
B) Seçenek 2
C) Seçenek 3
D) Seçenek 4
Doğru Cevap: A

2. Diğer soru metni?
A) Seçenek 1
B) Seçenek 2
C) Seçenek 3
D) Seçenek 4
Doğru Cevap: C"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={10}
        />
        <p className="text-xs text-muted-foreground">
          Her soru için soru metni, seçenekler ve doğru cevabı belirtin. Soruları yukarıdaki formatta girin.
        </p>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleBulkImport}>
          <FileText className="mr-2 h-4 w-4" />
          Metinden Soruları Ekle
        </Button>
      </div>
    </div>
  );
};
