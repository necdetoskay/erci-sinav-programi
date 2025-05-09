"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle, Ref } from "react";
import { PoolQuestion } from "@/types/prisma";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { UpdateQuestion } from "./update-question";
import { DeleteQuestion } from "./delete-question";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Eye, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"; // Corrected import path
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"; // Corrected import path
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

interface QuestionOption {
  [key: string]: string;
  label: string;
  text: string;
}

interface BasePoolQuestion {
  id: number;
  questionText: string;
  correctAnswer: string;
  explanation: string | null;
  tags: string[];
  difficulty: string;
  createdAt: Date;
  updatedAt: Date;
  poolId: number;
}

export interface ExtendedPoolQuestion extends BasePoolQuestion {
  position: number; // Ensure position is always a number
  options: Array<{ text: string; label: string; }>; // Define options structure
}

interface QuestionListProps {
  questions: ExtendedPoolQuestion[];
  id: number | undefined; // Updated to allow undefined
}

export interface QuestionListRef {
  refreshQuestions: () => void;
}

interface SortableRowProps {
  question: ExtendedPoolQuestion;
  index: number;
  id: number | undefined; // Updated to allow undefined
}

function SortableRow({ question, index, id }: SortableRowProps) {
  const {
    attributes,
    listeners,
    transform,
    transition,
    setNodeRef,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? "relative" : "static",
    opacity: isDragging ? 0.5 : 1,
  } as const;

  // Soru metnini kısaltma fonksiyonu
  const truncateText = (text: string, maxLength: number = 100) => {
    const cleanText = text.replace(/<[^>]*>/g, '');
    if (cleanText.length <= maxLength) return cleanText;
    return cleanText.substring(0, maxLength) + '...';
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="font-medium w-12">
        <div className="flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab hover:text-foreground text-muted-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          {index + 1}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="max-w-xl">
            {truncateText(question.questionText)}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 space-y-4 dark:bg-popover"> {/* Removed align="start", Added dark:bg-popover */}
              <div>
                <h4 className="font-medium mb-2 dark:text-foreground">Soru Detayları</h4>
                <div
                  className="max-w-none dark:text-gray-100" // Force light text color in dark mode
                  dangerouslySetInnerHTML={{ __html: question.questionText }}
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium dark:text-foreground">Şıklar</h4>
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`flex items-start gap-2 p-2 rounded-md ${
                      String.fromCharCode(65 + optionIndex) === question.correctAnswer
                        ? "bg-green-100 dark:bg-green-900/30" // Adjusted background for dark mode
                        : "bg-gray-100 dark:bg-gray-800/30" // Adjusted background for dark mode
                    }`}
                  >
                    <div className="font-medium min-w-[20px] dark:text-foreground"> {/* Added dark mode text color */}
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <div
                      className="flex-1 dark:text-gray-100" // Force light text color in dark mode
                      dangerouslySetInnerHTML={{ __html: option.text }}
                    />
                  </div>
                ))}
              </div>
              {question.explanation && (
                <div>
                  <h4 className="font-medium mb-2 dark:text-foreground">Açıklama</h4>
                  <div
                    className="max-w-none bg-muted dark:bg-muted/50 p-2 rounded-md dark:text-gray-100" // Force light text color in dark mode
                    dangerouslySetInnerHTML={{ __html: question.explanation }}
                  />
                </div>
              )}
              {question.tags && question.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="capitalize">
          {question.difficulty}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(question.createdAt), {
          addSuffix: true,
          locale: tr,
        })}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {id !== undefined && (
            <>
              <UpdateQuestion id={id} question={question} />
              <DeleteQuestion id={id} questionId={question.id} />
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export const QuestionList = forwardRef<QuestionListRef, QuestionListProps>(
  ({ questions: initialQuestions, id }: QuestionListProps, ref: Ref<QuestionListRef>) => {
    const [questions, setQuestions] = useState<ExtendedPoolQuestion[]>(
      initialQuestions.map((q, index) => ({ ...q, position: q.position ?? index }))
    );
    const [isLoading, setIsLoading] = useState(false);

    async function fetchQuestions() {
      if (id === undefined) {
        console.warn("poolId is undefined, cannot fetch questions.");
        return;
      }
      try {
        setIsLoading(true);
        const response = await fetch(`/api/question-pools/${id}/questions`);
        if (!response.ok) {
          throw new Error("Sorular yüklenirken bir hata oluştu");
        }
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Sorular yüklenirken bir hata oluştu:", error);
        toast.error("Sorular yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    }

    // Expose fetchQuestions function to the parent component via ref
    useImperativeHandle(ref, () => ({
      refreshQuestions: fetchQuestions,
    }));

    useEffect(() => {
      setQuestions(initialQuestions);
    }, [id, initialQuestions]);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      })
    );

    function handleDragEnd(event: DragEndEvent) {
      const { active, over } = event;

      if (active.id !== over?.id) {
        setQuestions((items) => {
          const oldIndex = items.findIndex((item) => item.id === active.id);
          const newIndex = items.findIndex((item) => item.id === over?.id);
          const newOrder = arrayMove(items, oldIndex, newIndex);

          // Update positions in the backend
          updateQuestionPositions(newOrder);

          return newOrder;
        });
      }
    }

    async function updateQuestionPositions(updatedQuestions: ExtendedPoolQuestion[]) {
      if (id === undefined) {
        console.warn("poolId is undefined, cannot update question positions.");
        return;
      }
      try {
        const response = await fetch(`/api/question-pools/${id}/reorder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questions: updatedQuestions.map((q, index) => ({
              id: q.id,
              position: index,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Soru sıralaması güncellenirken bir hata oluştu");
        }

        toast.success("Soru sıralaması güncellendi");
      } catch (error) {
        console.error("Soru sıralaması güncellenirken bir hata oluştu:", error);
        toast.error("Soru sıralaması güncellenirken bir hata oluştu");
        // Revert to initial questions on error
        setQuestions(initialQuestions);
      }
    }

    if (isLoading) {
      return (
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded mb-2" />
          ))}
        </div>
      );
    }

    if (questions.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          Henüz soru eklenmemiş
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{/* Sıra */}</TableHead>
                  <TableHead className="w-[50%]">Soru</TableHead>
                  <TableHead>Zorluk</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question, index) => (
                  <SortableRow key={question.id} question={question} index={index} id={id} />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      </div>
    );
  }
);

QuestionList.displayName = "QuestionList";
