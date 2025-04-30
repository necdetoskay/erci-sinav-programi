"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QuestionPool } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { UpdateQuestionPool } from "./update-question-pool";
import { DeleteQuestionPool } from "./delete-question-pool";

interface QuestionPoolHeaderProps {
  initialData: QuestionPool;
}

export function QuestionPoolHeader({ initialData }: QuestionPoolHeaderProps) {
  const params = useParams();
  const [questionPool, setQuestionPool] = useState<QuestionPool>(initialData);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    fetchQuestionPool();

    // Her 5 saniyede bir güncelle
    const interval = setInterval(fetchQuestionPool, 5000);

    return () => clearInterval(interval);
  }, [params.id]);

  if (isLoading) {
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
          <span>•</span>
          <Badge variant="outline">{questionPool.grade}</Badge>
          <span>•</span>
          <Badge variant="outline">{questionPool.difficulty}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <UpdateQuestionPool data={questionPool} />
        <DeleteQuestionPool id={questionPool.id} />
      </div>
    </div>
  );
} 