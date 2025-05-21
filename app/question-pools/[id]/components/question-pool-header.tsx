"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QuestionPool, QuestionPoolStatus } from "@/types/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { UpdateQuestionPool } from "./update-question-pool";
import { DeleteQuestionPool } from "./delete-question-pool";
import { ExportQuestions } from "./export-questions";
import { ImportQuestions } from "./import-questions";
import { PrintQuestions } from "./print-questions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuestionPoolHeaderProps {
  initialData: QuestionPool | null;
}

export function QuestionPoolHeader({ initialData }: QuestionPoolHeaderProps) {
  const params = useParams();
  const [questionPool, setQuestionPool] = useState<QuestionPool | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchQuestionPool() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/question-pools/${params.id}`);
        if (!response.ok) {
          throw new Error("Soru havuzu yüklenirken bir hata oluştu");
        }
        const data = await response.json();
        setQuestionPool(data);
      } catch (error) {
        console.error("Soru havuzu yüklenirken bir hata oluştu:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestionPool();

    // Otomatik güncelleme iptal edildi
    // const interval = setInterval(fetchQuestionPool, 5000);
    // return () => clearInterval(interval);
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-muted rounded mb-2" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    );
  }

  // Eğer questionPool null ise, yükleniyor veya bulunamadı mesajı gösterilebilir
  if (!questionPool) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-muted rounded mb-2" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold mb-2">{questionPool.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(questionPool.createdAt), {
              addSuffix: true,
              locale: tr,
            })}
          </span>
          <span>•</span>
          <Badge variant="outline">{questionPool.subject}</Badge>
          {/* <span>•</span> // Sınıf kaldırıldığı için ayıraç kaldırıldı */}
          {/* <Badge variant="outline">{questionPool.grade}</Badge> // Sınıf Badge kaldırıldı */}
          <span>•</span>
          <Badge variant="outline">{questionPool.difficulty}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <UpdateQuestionPool data={questionPool} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Soru Havuzunu Düzenle</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ImportQuestions id={questionPool.id} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Soruları İçe Aktar</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <ExportQuestions id={questionPool.id} title={questionPool.title} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Soruları Dışa Aktar</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <PrintQuestions id={questionPool.id} title={questionPool.title} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Soruları Yazdır</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <DeleteQuestionPool id={questionPool.id} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Soru Havuzunu Sil</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
