import { LoadingLink } from "@/components/ui/loading-link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionPool, User } from "@prisma/client";

interface QuestionPoolWithQuestions extends QuestionPool {
  questions: any[];
  createdBy?: {
    name: string;
    email: string;
    role: string;
  };
}

interface QuestionPoolListProps {
  questionPools: QuestionPoolWithQuestions[];
}

export function QuestionPoolList({ questionPools }: QuestionPoolListProps) {
  if (questionPools.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Henüz soru havuzu oluşturmadınız.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {questionPools.map((pool) => (
        <LoadingLink key={pool.id} href={`/question-pools/${pool.id}`}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="line-clamp-2">{pool.title}</CardTitle>
                <Badge variant={pool.status === "ACTIVE" ? "default" : "secondary"}>
                  {pool.status === "ACTIVE" ? "Aktif" : "Pasif"}
                </Badge>
              </div>
              <CardDescription>
                {formatDistanceToNow(new Date(pool.updatedAt), {
                  addSuffix: true,
                  locale: tr,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div>
                  <p>{pool.subject}</p>
                  {pool.createdBy && (
                    <p className="text-xs text-muted-foreground">
                      {pool.createdBy.name || pool.createdBy.email}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p>{pool.questions.length} Soru</p>
                  <p className="capitalize">{pool.difficulty}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </LoadingLink>
      ))}
    </div>
  );
}
