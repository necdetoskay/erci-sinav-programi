"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GeneratedQuestion } from "./types";

interface QuestionReviewProps {
  currentQuestion: GeneratedQuestion;
  currentStep: number;
  totalSteps: number;
  toggleApproval: (questionId: string) => void;
  saveApprovedQuestions: () => void;
  setCurrentStep?: (step: number) => void;
}

export const QuestionReview: React.FC<QuestionReviewProps> = ({
  currentQuestion,
  currentStep,
  totalSteps,
  toggleApproval,
  saveApprovedQuestions,
  setCurrentStep
}) => {
  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Soru {currentStep} / {totalSteps}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={currentQuestion.approved ? "default" : "outline"}
            onClick={() => toggleApproval(currentQuestion.id)}
          >
            {currentQuestion.approved ? "Onaylandı ✓" : "Onayla"}
          </Button>
        </div>
      </div>

      <Card className={cn(
        "border-2 transition-colors",
        currentQuestion.approved ? "border-green-500" : "border-gray-200"
      )}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Soru:</h3>
              <p className="mt-1">{currentQuestion.questionText}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Seçenekler:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.label}
                    className={cn(
                      "p-2 rounded-md",
                      option.label === currentQuestion.correctAnswer
                        ? "bg-green-100 dark:bg-green-900"
                        : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    <span className="font-bold mr-2">{option.label})</span>
                    {option.text}
                  </div>
                ))}
              </div>
            </div>

            {currentQuestion.explanation && (
              <div>
                <h3 className="font-medium">Açıklama:</h3>
                <p className="mt-1">{currentQuestion.explanation}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">Zorluk: </span>
                <span className={cn(
                  currentQuestion.difficulty === "easy" && "text-green-500",
                  currentQuestion.difficulty === "medium" && "text-yellow-500",
                  currentQuestion.difficulty === "hard" && "text-red-500"
                )}>
                  {currentQuestion.difficulty === "easy" && "Kolay"}
                  {currentQuestion.difficulty === "medium" && "Orta"}
                  {currentQuestion.difficulty === "hard" && "Zor"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          disabled={currentStep === 1}
          onClick={() => {
            const prevStep = Math.max(1, currentStep - 1);
            if (setCurrentStep) setCurrentStep(prevStep);
          }}
        >
          Önceki Soru
        </Button>
        <div className="flex items-center gap-2">
          {currentStep === totalSteps && (
            <Button onClick={saveApprovedQuestions}>
              Onaylanan Soruları Kaydet
            </Button>
          )}
          <Button
            variant="outline"
            disabled={currentStep === totalSteps}
            onClick={() => {
              const nextStep = Math.min(totalSteps, currentStep + 1);
              if (setCurrentStep) setCurrentStep(nextStep);
            }}
          >
            Sonraki Soru
          </Button>
        </div>
      </div>
    </div>
  );
};
