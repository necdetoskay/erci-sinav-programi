"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckSquare } from "lucide-react";

// Soru havuzu sorusu tipi
interface PoolQuestion {
  id: number;
  questionText: string;
  options: Array<{
    text: string;
    label: string;
  }>;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
}

interface QuestionSelectorProps {
  questions: PoolQuestion[];
  selectedQuestions: number[];
  onToggleSelection: (questionId: number) => void;
  onSelectAll?: () => void;
  isLoading: boolean;
}

export const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  questions,
  selectedQuestions,
  onToggleSelection,
  onSelectAll,
  isLoading,
}) => {
  // Zorluk seviyesi badge renkleri
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "hard":
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // Zorluk seviyesi Türkçe karşılıkları
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "Kolay";
      case "medium":
        return "Orta";
      case "hard":
        return "Zor";
      default:
        return difficulty;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Soru bulunamadı.</p>
        <p className="text-sm mt-2">
          Lütfen başka bir soru havuzu seçin veya filtreleri değiştirin.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md max-h-[400px] overflow-y-auto">
      <div className="flex justify-between items-center p-3 border-b bg-muted/50">
        <div className="grid grid-cols-12 font-medium w-full">
          <div className="col-span-1">Seç</div>
          <div className="col-span-8">Soru</div>
          <div className="col-span-3">Zorluk</div>
        </div>
        {onSelectAll && questions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 whitespace-nowrap"
            onClick={onSelectAll}
          >
            <CheckSquare className="mr-1 h-4 w-4" />
            Tümünü Seç
          </Button>
        )}
      </div>
      <div className="divide-y">
        {questions.map((question) => (
          <div
            key={question.id}
            className="grid grid-cols-12 p-3 items-start hover:bg-muted/30 transition-colors"
          >
            <div className="col-span-1">
              <Checkbox
                checked={selectedQuestions.includes(question.id)}
                onCheckedChange={() => onToggleSelection(question.id)}
              />
            </div>
            <div className="col-span-8">
              <p className="text-sm">{question.questionText}</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {question.options.map((option) => (
                  <div
                    key={option.label}
                    className={
                      option.label === question.correctAnswer
                        ? "font-medium text-primary"
                        : ""
                    }
                  >
                    {option.label}: {option.text}
                    {option.label === question.correctAnswer && " ✓"}
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-3">
              <Badge
                variant="outline"
                className={getDifficultyColor(question.difficulty)}
              >
                {getDifficultyLabel(question.difficulty)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
