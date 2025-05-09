"use client";

import { useState, useEffect, Suspense } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Exam {
  id: number;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  duration_minutes: number;
  participantCount: number;
  averageScore: number | null;
}

function ExamResultsTable() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingExamId, setUpdatingExamId] = useState<number | null>(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/exams/results");

        if (!response.ok) {
          throw new Error("Sınav sonuçları yüklenirken bir hata oluştu");
        }

        const data = await response.json();
        setExams(data);
      } catch (error) {
        console.error("Sınav sonuçları yüklenirken hata:", error);
        toast.error("Sınav sonuçları yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleViewExamDetails = (examId: number) => {
    router.push(`/dashboard/exam-results/${examId}`);
  };

  // Sınav durumunu değiştirme fonksiyonu
  const handleStatusChange = async (examId: number, newStatus: string) => {
    if (updatingExamId !== null) return;

    try {
      setUpdatingExamId(examId);

      const response = await fetch(`/api/admin/exams/${examId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Sınav durumu güncellenirken bir hata oluştu");
      }

      // Sınav listesini güncelle
      setExams(exams.map(exam =>
        exam.id === examId ? { ...exam, status: newStatus } : exam
      ));

      toast.success("Sınav durumu başarıyla güncellendi");
    } catch (error) {
      console.error("Sınav durumu güncellenirken hata:", error);
      toast.error("Sınav durumu güncellenirken bir hata oluştu");
    } finally {
      setUpdatingExamId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Aktif</Badge>;
      case "draft":
        return <Badge variant="outline">Taslak</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Tamamlandı</Badge>;
      case "archived":
        return <Badge variant="secondary">Arşivlenmiş</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sınav Sonuçları</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tüm Sınavlar</CardTitle>
          <CardDescription>
            Sistemdeki tüm sınavların sonuçlarını görüntüleyin ve analiz edin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz sınav bulunmuyor
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sınav Adı</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturulma Tarihi</TableHead>
                  <TableHead>Süre</TableHead>
                  <TableHead>Katılımcı Sayısı</TableHead>
                  <TableHead>Ortalama Puan</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(exam.status)}
                        <Select
                          value={exam.status}
                          onValueChange={(value) => handleStatusChange(exam.id, value)}
                          disabled={updatingExamId === exam.id}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue placeholder="Durum Değiştir" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Taslak</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="completed">Tamamlandı</SelectItem>
                            <SelectItem value="archived">Arşivlenmiş</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(exam.created_at), {
                        addSuffix: true,
                        locale: tr
                      })}
                    </TableCell>
                    <TableCell>{exam.duration_minutes} dakika</TableCell>
                    <TableCell>{exam.participantCount}</TableCell>
                    <TableCell>
                      {exam.averageScore !== null
                        ? `${exam.averageScore.toFixed(1)} / 100`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewExamDetails(exam.id)}
                      >
                        Detaylar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ExamResultsPage() {
  return (
    <Suspense fallback={<div>Loading exam results...</div>}>
      <ExamResultsTable />
    </Suspense>
  );
}
