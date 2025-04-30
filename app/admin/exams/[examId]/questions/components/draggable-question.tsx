'use client';

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash, GripVertical } from "lucide-react";
import { QuestionDetails } from "./question-details";

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

interface DraggableQuestionProps {
  question: Question;
  index: number;
  onRemove: () => void;
}

const difficultyOptions = [
  { value: 'easy', label: 'Kolay' },
  { value: 'medium', label: 'Orta' },
  { value: 'hard', label: 'Zor' },
];

export function DraggableQuestion({ question, index, onRemove }: DraggableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id?.toString() || `question-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={isDragging ? "border-primary" : ""}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4 flex-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="cursor-grab active:cursor-grabbing" 
              {...attributes} 
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
            <div className="font-medium min-w-[80px]">Soru {index + 1}</div>
            <div className="flex-1 line-clamp-1">{question.question_text}</div>
            <Badge variant={
              question.difficulty === 'easy' ? 'secondary' :
              question.difficulty === 'medium' ? 'default' : 'destructive'
            }>
              {difficultyOptions.find(opt => opt.value === question.difficulty)?.label}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <QuestionDetails question={question} index={index} />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRemove}
              className="text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 