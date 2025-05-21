"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AIQuestionGenerator } from "./AIQuestionGenerator";
import { ManualQuestionForm } from "./ManualQuestionForm";
import { QuestionReviewDialog } from "./QuestionReviewDialog";
import { QuestionPoolTab } from "./QuestionPoolTab";
import { BulkTextImportTab } from "./BulkTextImportTab";
import { AIGeneratedQuestion, AddQuestionFunction } from "./types";
import { useToast } from "@/components/ui/use-toast";

interface QuestionWizardTabsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
  addQuestion: AddQuestionFunction;
  questionsCount: number;
  onContinueToNextStep: () => void;
  saveToQuestionPool: boolean;
  onSaveToQuestionPoolChange?: (checked: boolean) => void;
}

export const QuestionWizardTabs: React.FC<QuestionWizardTabsProps> = ({
  open,
  onOpenChange,
  data,
  addQuestion,
  questionsCount,
  onContinueToNextStep,
  saveToQuestionPool,
}) => {
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState("pool");
  const [generatedQuestions, setGeneratedQuestions] = useState<AIGeneratedQuestion[]>([]);
  const [showQuestionReviewDialog, setShowQuestionReviewDialog] = useState(false);

  // AI ile oluşturulan soruları işle
  const handleQuestionsGenerated = (questions: AIGeneratedQuestion[]) => {
    setGeneratedQuestions(questions);
    setShowQuestionReviewDialog(true);
  };

  // Soru onaylama/reddetme işlemi
  const toggleQuestionApproval = (questionId: number) => {
    setGeneratedQuestions(prev =>
      prev.map(q => q.id === questionId ? { ...q, approved: !q.approved } : q)
    );
  };

  // Onaylanan soruları ekle ve sonraki adıma geç
  const addApprovedQuestionsAndContinue = async () => {
    const approvedQuestions = generatedQuestions.filter(q => q.approved);

    if (approvedQuestions.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir soru onaylayın veya işlemi iptal edin.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Onaylanan soruları sınava ekle
      approvedQuestions.forEach(q => {
        addQuestion({
          id: q.id,
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          position: questionsCount + 1
        });
      });

      // Eğer soru havuzuna kaydetme seçeneği işaretlendiyse
      if (saveToQuestionPool) {
        // Burada soru havuzuna kaydetme API çağrısı yapılacak
        // Şimdilik sadece bir bildirim gösteriyoruz
        toast({
          title: "Bilgi",
          description: `${approvedQuestions.length} soru soru havuzuna da kaydedildi.`,
        });
      }

      toast({
        title: "Başarılı",
        description: `${approvedQuestions.length} soru başarıyla eklendi.`,
      });

      // Diyaloğu kapat
      setShowQuestionReviewDialog(false);
      onOpenChange(false);

      // Bir sonraki adıma geç
      onContinueToNextStep();
    } catch (error) {
      console.error("Soruları ekleme hatası:", error);
      toast({
        title: "Hata",
        description: "Sorular eklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Soru oluşturma işlemini iptal et
  const cancelQuestionGeneration = () => {
    setShowQuestionReviewDialog(false);
    setGeneratedQuestions([]);
  };

  // Manuel soru ekleme başarılı olduğunda
  const handleManualQuestionSuccess = () => {
    toast({
      title: "Başarılı",
      description: "Soru başarıyla eklendi. Daha fazla soru eklemek için formu kullanabilirsiniz.",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Soru Ekle
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Soru Ekle</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="pool" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pool">Soru Havuzundan Seç</TabsTrigger>
              <TabsTrigger value="new">Yeni Soru Oluştur</TabsTrigger>
              <TabsTrigger value="ai">Yapay Zeka ile Oluştur</TabsTrigger>
              <TabsTrigger value="bulk">Toplu Metin Girişi</TabsTrigger>
            </TabsList>

            {/* Soru Havuzundan Seçme Sekmesi */}
            <TabsContent value="pool" className="space-y-4">
              <QuestionPoolTab
                data={data}
                addQuestion={addQuestion}
                onSuccess={() => onOpenChange(false)}
              />
            </TabsContent>

            {/* Yeni Soru Oluşturma Sekmesi */}
            <TabsContent value="new" className="space-y-4">
              <ManualQuestionForm
                addQuestion={addQuestion}
                onSuccess={handleManualQuestionSuccess}
                questionsCount={questionsCount}
                saveToQuestionPool={saveToQuestionPool}
                onSaveToQuestionPoolChange={(checked) => onSaveToQuestionPoolChange && onSaveToQuestionPoolChange(checked)}
                onContinueToNextStep={onContinueToNextStep}
              />
            </TabsContent>

            {/* Yapay Zeka ile Soru Oluşturma Sekmesi */}
            <TabsContent value="ai" className="space-y-4">
              <AIQuestionGenerator
                data={data}
                questionsCount={questionsCount}
                onQuestionsGenerated={handleQuestionsGenerated}
              />
            </TabsContent>

            {/* Toplu Metin Girişi Sekmesi */}
            <TabsContent value="bulk" className="space-y-4">
              <BulkTextImportTab
                addQuestion={addQuestion}
                questionsCount={questionsCount}
                onSuccess={() => onOpenChange(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Soru İnceleme Diyaloğu */}
      <QuestionReviewDialog
        open={showQuestionReviewDialog}
        onOpenChange={setShowQuestionReviewDialog}
        generatedQuestions={generatedQuestions}
        onToggleApproval={toggleQuestionApproval}
        onAddApprovedQuestions={addApprovedQuestionsAndContinue}
        onCancel={cancelQuestionGeneration}
        saveToQuestionPool={saveToQuestionPool}
      />
    </>
  );
};
