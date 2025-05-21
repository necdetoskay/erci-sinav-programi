import { LoadingLink } from "@/components/ui/loading-link";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { QuestionPool, User } from "@prisma/client";
import { QuestionPoolStatus } from "@/types/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Başlık</TableHead>
            <TableHead className="whitespace-nowrap">Konu</TableHead>
            <TableHead className="whitespace-nowrap">Soru Sayısı</TableHead>
            <TableHead className="whitespace-nowrap">Zorluk</TableHead>
            <TableHead className="whitespace-nowrap">Oluşturan</TableHead>
            <TableHead className="whitespace-nowrap">Son Güncelleme</TableHead>
            <TableHead className="whitespace-nowrap">Durum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {questionPools.map((pool) => (
            <TableRow
              key={pool.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <LoadingLink
                href={`/question-pools/${pool.id}`}
                className="contents" // Makes the link behave like its children, spanning the entire row
              >
                <TableCell className="font-medium">{pool.title}</TableCell>
                <TableCell>{pool.subject}</TableCell>
                <TableCell>{pool.questions.length} Soru</TableCell>
                <TableCell className="capitalize">{pool.difficulty}</TableCell>
                <TableCell>
                  {pool.createdBy && (
                    <span className="text-muted-foreground">
                      {pool.createdBy.name || pool.createdBy.email}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(pool.updatedAt), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={pool.status === QuestionPoolStatus.ACTIVE ? "default" : "secondary"}>
                    {pool.status === QuestionPoolStatus.ACTIVE ? "Aktif" : "Pasif"}
                    {/* Debug: {JSON.stringify(pool.status)} */}
                  </Badge>
                </TableCell>
              </LoadingLink>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
