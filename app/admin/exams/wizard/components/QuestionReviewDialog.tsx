"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, ArrowRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { AIGeneratedQuestion, AddQuestionFunction } from "./types";

interface QuestionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generatedQuestions: AIGeneratedQuestion[];
  onToggleApproval: (questionId: number) => void;
  onAddApprovedQuestions: () => void;
  onCancel: () => void;
  saveToQuestionPool: boolean;
}

export const QuestionReviewDialog: React.FC<QuestionReviewDialogProps> = ({
  open,
  onOpenChange,
  generatedQuestions,
  onToggleApproval,
  onAddApprovedQuestions,
  onCancel,
  saveToQuestionPool,
}) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Eğer soru yoksa boş diyalog göster
  if (generatedQuestions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Oluşturulan Sorular</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            Henüz soru oluşturulmadı.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const currentQuestion = generatedQuestions[currentQuestionIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Oluşturulan Soruları İnceleyin</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Soru {currentQuestionIndex + 1} / {generatedQuestions.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleApproval(currentQuestion.id)}
              >
                {currentQuestion.approved ? (
                  <>
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Onayı Kaldır
                  </>
                ) : (
                  <>
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Onayla
                  </>
                )}
              </Button>
            </div>
          </div>

          <Card className={currentQuestion.approved ? "border-green-500" : ""}>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentQuestion.text}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => {
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                  const isCorrect = currentQuestion.correctAnswer === optionLabel;

                  return (
                    <div
                      key={option.id}
                      className={`p-3 rounded-md border ${isCorrect ? "bg-green-50 border-green-200" : "bg-card"}`}
                    >
                      <div className="flex items-start">
                        <div className="font-medium mr-2">{optionLabel})</div>
                        <div>{option.text}</div>
                        {isCorrect && <Check className="ml-auto h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {currentQuestion.explanation && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md">
                  <div className="font-medium">Açıklama:</div>
                  <div>{currentQuestion.explanation}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Önceki Soru
            </Button>

            {currentQuestionIndex < generatedQuestions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(generatedQuestions.length - 1, prev + 1))}
              >
                Sonraki Soru
              </Button>
            ) : (
              <Button onClick={onAddApprovedQuestions}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Onaylanan Soruları Ekle ve Devam Et
              </Button>
            )}
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Tüm Sorular:</div>
            <div className="flex flex-wrap gap-2">
              {generatedQuestions.map((q, index) => (
                <Button
                  key={q.id}
                  variant={currentQuestionIndex === index ? "default" : "outline"}
                  size="sm"
                  className={q.approved ? "border-green-500" : ""}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                  {q.approved && <Check className="ml-1 h-3 w-3" />}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              onClick={() => {
                if (confirm("Oluşturulan soruları iptal etmek istediğinize emin misiniz?")) {
                  onCancel();
                }
              }}
            >
              <X className="mr-2 h-4 w-4" />
              İptal
            </Button>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {generatedQuestions.filter(q => q.approved).length} / {generatedQuestions.length} soru onaylandı
              </div>
              <Button onClick={onAddApprovedQuestions}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Onaylanan Soruları Ekle ve Devam Et
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
