"use client";

import { useState, useEffect } from "react";
import { PoolQuestion } from "@prisma/client";
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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

interface ExtendedPoolQuestion extends BasePoolQuestion {
  position?: number;
  options: QuestionOption[];
}

interface QuestionListProps {
  questions: ExtendedPoolQuestion[];
  id: number;
}

interface SortableRowProps {
  question: ExtendedPoolQuestion;
  index: number;
  id: number;
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
            <PopoverContent className="w-96 space-y-4" align="start">
              <div>
                <h4 className="font-medium mb-2">Soru Detayları</h4>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: question.questionText }}
                />
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Şıklar</h4>
                {question.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`flex items-start gap-2 p-2 rounded-md ${
                      String.fromCharCode(65 + optionIndex) === question.correctAnswer
                        ? "bg-green-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="font-medium min-w-[20px]">
                      {String.fromCharCode(65 + optionIndex)}
                    </div>
                    <div
                      className="prose prose-sm flex-1"
                      dangerouslySetInnerHTML={{ __html: option.text }}
                    />
                  </div>
                ))}
              </div>
              {question.explanation && (
                <div>
                  <h4 className="font-medium mb-2">Açıklama</h4>
                  <div
                    className="prose prose-sm max-w-none bg-muted p-2 rounded-md"
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
          <UpdateQuestion id={id} question={question} />
          <DeleteQuestion id={id} questionId={question.id} />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function QuestionList({ questions: initialQuestions, id }: QuestionListProps) {
  const [questions, setQuestions] = useState<ExtendedPoolQuestion[]>(initialQuestions);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchQuestions() {
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

  useEffect(() => {
    // İlk yükleme için soruları güncelle
    setQuestions(initialQuestions);

    // Her 5 saniyede bir güncelle
    const interval = setInterval(fetchQuestions, 5000);

    return () => clearInterval(interval);
  }, [id, initialQuestions]);

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50%]">Soru</TableHead>
            <TableHead>Zorluk</TableHead>
            <TableHead>Oluşturulma</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questions.map((question) => (
            <TableRow key={question.id}>
              <TableCell>
                <div dangerouslySetInnerHTML={{ __html: question.questionText.substring(0, 100) + "..." }} />
              </TableCell>
              <TableCell>
                <Badge variant="outline">{question.difficulty}</Badge>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(question.createdAt), {
                  addSuffix: true,
                  locale: tr,
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-[600px]">
                      <div className="space-y-4">
                        <div className="prose prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: question.questionText }} />
                        </div>
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div
                              key={option.label}
                              className={
                                option.label === question.correctAnswer
                                  ? "p-3 rounded-lg bg-green-50 border border-green-200"
                                  : "p-3 rounded-lg bg-gray-50 border border-gray-200"
                              }
                            >
                              <span className="font-medium mr-2">{option.label})</span>
                              <span dangerouslySetInnerHTML={{ __html: option.text }} />
                            </div>
                          ))}
                        </div>
                        {question.explanation && (
                          <div className="prose prose-sm max-w-none">
                            <h4>Açıklama</h4>
                            <div dangerouslySetInnerHTML={{ __html: question.explanation }} />
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <UpdateQuestion id={id} question={question} />
                  <DeleteQuestion id={id} questionId={question.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 