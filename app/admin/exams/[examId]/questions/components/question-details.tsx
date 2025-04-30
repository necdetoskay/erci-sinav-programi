'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id?: number;
  question_text: string;
  options: Option[];
  correct_answer: string;
  explanation?: string;
  difficulty: string;
  position: number;
}

interface QuestionDetailsProps {
  question: Question;
  index: number;
}

export function QuestionDetails({ question, index }: QuestionDetailsProps) {
  const getOptionLetter = (index: number): string => {
    return String.fromCharCode(65 + index);
  };

  const difficultyLabels = {
    easy: { label: 'Kolay', variant: 'secondary' },
    medium: { label: 'Orta', variant: 'default' },
    hard: { label: 'Zor', variant: 'destructive' },
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Soru {index + 1}</span>
            <Badge variant={difficultyLabels[question.difficulty as keyof typeof difficultyLabels].variant as any}>
              {difficultyLabels[question.difficulty as keyof typeof difficultyLabels].label}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <p className="font-medium mb-4">{question.question_text}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {question.options.map((option, oIndex) => (
                <div 
                  key={option.id} 
                  className={`p-3 rounded-md border ${
                    question.correct_answer === getOptionLetter(oIndex)
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                      : 'border-muted'
                  }`}
                >
                  <span className="font-medium">{getOptionLetter(oIndex)}.</span> {option.text}
                </div>
              ))}
            </div>
          </div>
          
          {question.explanation && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Açıklama</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 