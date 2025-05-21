"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

// Soru tipi
interface Question {
  id: number;
  text: string;
  options: Array<{
    id: number;
    text: string;
  }>;
  correctAnswer: string;
  position: number;
}

interface QuestionListProps {
  questions: Question[];
  onRemove: (questionId: number) => void;
  onReorder: (questions: Question[]) => void;
}

// Sıralanabilir soru öğesi
const SortableQuestion = ({
  question,
  onRemove,
}: {
  question: Question;
  onRemove: (questionId: number) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start p-3 border rounded-md mb-2 bg-card",
        isDragging ? "opacity-50 border-dashed" : ""
      )}
      {...attributes}
    >
      <div
        className="flex items-center justify-center p-2 cursor-grab text-muted-foreground hover:text-foreground"
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-1 ml-2">
        <div className="flex items-start justify-between">
          <div className="font-medium">{question.text}</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onRemove(question.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {question.options.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index);
            const isCorrect = optionLetter === question.correctAnswer;
            return (
              <div
                key={option.id}
                className={cn(
                  "text-sm p-2 rounded-md",
                  isCorrect
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className="font-medium mr-1">{optionLetter}:</span>
                {option.text}
                {isCorrect && (
                  <Badge variant="outline" className="ml-2 bg-primary/20 text-primary border-primary/30">
                    Doğru
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  onRemove,
  onReorder,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);

      const newQuestions = arrayMove(questions, oldIndex, newIndex).map(
        (q, index) => ({
          ...q,
          position: index + 1,
        })
      );

      onReorder(newQuestions);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={questions.map((q) => q.id)}
        strategy={verticalListSortingStrategy}
      >
        {questions.map((question) => (
          <SortableQuestion
            key={question.id}
            question={question}
            onRemove={onRemove}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};
