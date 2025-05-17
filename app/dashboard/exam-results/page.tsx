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
import { ExamStatus, ExamStatusLabels, ExamStatusColors, ExamStatusValues } from "@/lib/constants/exam-status";

interface Exam {
  id: number;
  title: string;
  description: string | null;
  status: ExamStatus;
  created_at: string;
  duration_minutes: number;
  participantCount: number;
  averageScore: number | null;
}

function ExamResultsTable() {
  console.log("[ExamResultsTable] Bileşen render edildi:", new Date().toISOString());
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingExamId, setUpdatingExamId] = useState<number | null>(null);

  useEffect(() => {
    console.log("[ExamResultsTable] useEffect hook çalıştırıldı:", new Date().toISOString());

    const fetchExams = async () => {
      console.log("[ExamResultsTable] fetchExams fonksiyonu başlatıldı:", new Date().toISOString());
      const startTime = performance.now();

      try {
        setIsLoading(true);
        console.log("[ExamResultsTable] API isteği yapılıyor: /api/exams/results");

        const response = await fetch("/api/exams/results");
        console.log("[ExamResultsTable] API yanıtı alındı, status:", response.status);

        if (!response.ok) {
          console.error("[ExamResultsTable] API hatası, status:", response.status);
          throw new Error("Sınav sonuçları yüklenirken bir hata oluştu");
        }

        const data = await response.json();
        console.log("[ExamResultsTable] API'den alınan veri:", data);
        console.log("[ExamResultsTable] Veri uzunluğu:", data.length);

        setExams(data);
        console.log("[ExamResultsTable] Sınavlar state'e kaydedildi");
      } catch (error) {
        console.error("[ExamResultsTable] Sınav sonuçları yüklenirken hata:", error);
        toast.error("Sınav sonuçları yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
        const endTime = performance.now();
        console.log(`[ExamResultsTable] fetchExams tamamlandı, süre: ${(endTime - startTime).toFixed(2)}ms`);
      }
    };

    fetchExams();
  }, []);

  const handleViewExamDetails = (examId: number) => {
    router.push(`/dashboard/exam-results/${examId}`);
  };

  // Sınav durumunu değiştirme fonksiyonu
  const handleStatusChange = async (examId: number, newStatus: ExamStatus) => {
    console.log(`[ExamResultsTable] handleStatusChange çağrıldı, examId: ${examId}, newStatus: ${newStatus}`);

    if (updatingExamId !== null) {
      console.log(`[ExamResultsTable] Başka bir güncelleme işlemi devam ediyor, updatingExamId: ${updatingExamId}`);
      return;
    }

    try {
      setUpdatingExamId(examId);
      console.log(`[ExamResultsTable] updatingExamId ayarlandı: ${examId}`);

      console.log(`[ExamResultsTable] API isteği yapılıyor: /api/admin/exams/${examId}/status`);
      const response = await fetch(`/api/admin/exams/${examId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log(`[ExamResultsTable] API yanıtı alındı, status: ${response.status}`);

      if (!response.ok) {
        console.error(`[ExamResultsTable] API hatası, status: ${response.status}`);
        throw new Error("Sınav durumu güncellenirken bir hata oluştu");
      }

      // Sınav listesini güncelle
      console.log(`[ExamResultsTable] Sınav listesi güncelleniyor, examId: ${examId}, newStatus: ${newStatus}`);
      setExams(exams.map(exam =>
        exam.id === examId ? { ...exam, status: newStatus } : exam
      ));
      console.log(`[ExamResultsTable] Sınav listesi güncellendi`);

      toast.success("Sınav durumu başarıyla güncellendi");
    } catch (error) {
      console.error("[ExamResultsTable] Sınav durumu güncellenirken hata:", error);
      toast.error("Sınav durumu güncellenirken bir hata oluştu");
    } finally {
      setUpdatingExamId(null);
      console.log(`[ExamResultsTable] updatingExamId sıfırlandı`);
    }
  };

  const getStatusBadge = (status: ExamStatus) => {
    return <Badge className={ExamStatusColors[status]} variant={ExamStatusColors[status] === "outline" ? "outline" : "default"}>
      {ExamStatusLabels[status]}
    </Badge>;
  };

  return (
    <div className="container mx-auto py-6 exam-results-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sınav Sonuçları</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tüm Sınavlar</CardTitle>
          <CardDescription className="card-description">
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
                    <TableCell className="font-medium table-cell">{exam.title}</TableCell>
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
                            {ExamStatusValues.map((status) => (
                              <SelectItem key={status} value={status}>
                                {ExamStatusLabels[status]}
                              </SelectItem>
                            ))}
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
                    <TableCell className="table-cell">{exam.duration_minutes} dakika</TableCell>
                    <TableCell className="table-cell">{exam.participantCount}</TableCell>
                    <TableCell className="table-cell">
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
  console.log("[ExamResultsPage] Ana sayfa bileşeni render edildi:", new Date().toISOString());

  return (
    <Suspense fallback={<div>Loading exam results...</div>}>
      <ExamResultsTable />
    </Suspense>
  );
}
