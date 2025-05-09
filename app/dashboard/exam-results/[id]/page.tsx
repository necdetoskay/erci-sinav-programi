"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ExamDetail {
  id: number;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  duration_minutes: number;
  question_count: number;
}

interface ExamStatistics {
  participantCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageCompletionTime: number;
  hardestQuestion: {
    id: number;
    question_text: string;
    incorrectAnswerRate: number;
  } | null;
  easiestQuestion: {
    id: number;
    question_text: string;
    correctAnswerRate: number;
  } | null;
}

interface Participant {
  id: string;
  participantName: string;
  participantEmail: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: string;
  endTime: string | null;
  completionTime: number | null;
  status: string;
}

export default function ExamResultDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const examId = parseInt(params.id);

  const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
  const [statistics, setStatistics] = useState<ExamStatistics | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        setIsLoading(true);

        // Sınav detaylarını getir
        const detailResponse = await fetch(`/api/exams/${examId}/results`);

        if (!detailResponse.ok) {
          throw new Error("Sınav detayları yüklenirken bir hata oluştu");
        }

        const detailData = await detailResponse.json();
        setExamDetail(detailData.exam);
        setStatistics(detailData.statistics);
        setParticipants(detailData.participants);
      } catch (error) {
        console.error("Sınav detayları yüklenirken hata:", error);
        toast.error("Sınav detayları yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    if (!isNaN(examId)) {
      fetchExamDetails();
    }
  }, [examId]);

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return "-";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours} saat ${mins} dakika`;
    }

    return `${mins} dakika`;
  };

  // Sınav durumunu güncelleme fonksiyonu
  const handleStatusChange = async (newStatus: string) => {
    if (!examDetail || isUpdatingStatus) return;

    try {
      setIsUpdatingStatus(true);

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

      const data = await response.json();

      // Sınav detaylarını güncelle
      setExamDetail({
        ...examDetail,
        status: newStatus,
      });

      toast.success("Sınav durumu başarıyla güncellendi");
    } catch (error) {
      console.error("Sınav durumu güncellenirken hata:", error);
      toast.error("Sınav durumu güncellenirken bir hata oluştu");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!examDetail) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Sınav bulunamadı</h2>
              <p className="text-muted-foreground mb-6">
                İstediğiniz sınav bulunamadı veya erişim izniniz yok.
              </p>
              <Button onClick={() => router.push("/dashboard/exam-results")}>
                Sınav Listesine Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/exam-results")}
            className="mb-2"
          >
            ← Sınav Listesine Dön
          </Button>
          <h1 className="text-3xl font-bold">{examDetail.title}</h1>
          {examDetail.description && (
            <p className="text-muted-foreground mt-1">{examDetail.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge className={
            examDetail.status === "active" ? "bg-green-500" :
            examDetail.status === "completed" ? "bg-blue-500" :
            examDetail.status === "archived" ? "bg-secondary" :
            "bg-muted"
          }>
            {examDetail.status === "active" ? "Aktif" :
             examDetail.status === "completed" ? "Tamamlandı" :
             examDetail.status === "archived" ? "Arşivlenmiş" :
             examDetail.status === "draft" ? "Taslak" :
             examDetail.status}
          </Badge>

          <Select
            value={examDetail.status}
            onValueChange={handleStatusChange}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger className="w-[180px]">
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
      </div>

      <Tabs defaultValue="statistics" className="mb-6">
        <TabsList>
          <TabsTrigger value="statistics">İstatistikler</TabsTrigger>
          <TabsTrigger value="participants">Katılımcılar</TabsTrigger>
        </TabsList>

        <TabsContent value="statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sınav Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Oluşturulma Tarihi</dt>
                    <dd className="text-lg">
                      {format(new Date(examDetail.created_at), "PPP", { locale: tr })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Süre</dt>
                    <dd className="text-lg">{examDetail.duration_minutes} dakika</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Soru Sayısı</dt>
                    <dd className="text-lg">{examDetail.question_count}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Katılımcı Sayısı</dt>
                    <dd className="text-lg">{statistics?.participantCount || 0}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performans Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Ortalama Puan</dt>
                    <dd>
                      <div className="flex items-center gap-2">
                        <Progress value={statistics?.averageScore || 0} className="h-2" />
                        <span className="text-lg font-medium">{statistics?.averageScore.toFixed(1) || 0}/100</span>
                      </div>
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">En Yüksek Puan</dt>
                      <dd className="text-lg">{statistics?.highestScore.toFixed(1) || 0}/100</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">En Düşük Puan</dt>
                      <dd className="text-lg">{statistics?.lowestScore.toFixed(1) || 0}/100</dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Ortalama Tamamlama Süresi</dt>
                    <dd className="text-lg">{formatDuration(statistics?.averageCompletionTime || null)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Soru Analizi</CardTitle>
                <CardDescription>En zor ve en kolay sorular</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {statistics?.hardestQuestion ? (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">En Zor Soru</h3>
                      <p className="text-sm mb-2">{statistics.hardestQuestion.question_text}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Yanlış Oranı:</span>
                        <Progress value={statistics.hardestQuestion.incorrectAnswerRate * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">%{(statistics.hardestQuestion.incorrectAnswerRate * 100).toFixed(1)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">En Zor Soru</h3>
                      <p className="text-sm text-muted-foreground">Yeterli veri yok</p>
                    </div>
                  )}

                  {statistics?.easiestQuestion ? (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">En Kolay Soru</h3>
                      <p className="text-sm mb-2">{statistics.easiestQuestion.question_text}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Doğru Oranı:</span>
                        <Progress value={statistics.easiestQuestion.correctAnswerRate * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">%{(statistics.easiestQuestion.correctAnswerRate * 100).toFixed(1)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">En Kolay Soru</h3>
                      <p className="text-sm text-muted-foreground">Yeterli veri yok</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Katılımcı Listesi</CardTitle>
              <CardDescription>
                Sınava katılan kullanıcıların performans detayları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Bu sınava henüz katılım olmamış
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Katılımcı</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Puan</TableHead>
                      <TableHead>Doğru</TableHead>
                      <TableHead>Yanlış</TableHead>
                      <TableHead>Başlangıç</TableHead>
                      <TableHead>Süre</TableHead>
                      <TableHead>Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-medium">{participant.participantName}</TableCell>
                        <TableCell>{participant.participantEmail}</TableCell>
                        <TableCell>{participant.score.toFixed(1)}/100</TableCell>
                        <TableCell className="text-green-600">{participant.correctAnswers}</TableCell>
                        <TableCell className="text-red-600">{participant.incorrectAnswers}</TableCell>
                        <TableCell>
                          {format(new Date(participant.startTime), "Pp", { locale: tr })}
                        </TableCell>
                        <TableCell>
                          {participant.completionTime
                            ? `${participant.completionTime} dk`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            participant.status === "SUBMITTED" ? "bg-green-500" :
                            participant.status === "TIMED_OUT" ? "bg-amber-500" :
                            participant.status === "IN_PROGRESS" ? "bg-blue-500" :
                            "bg-muted"
                          }>
                            {participant.status === "SUBMITTED" ? "Tamamlandı" :
                             participant.status === "TIMED_OUT" ? "Süre Aşımı" :
                             participant.status === "IN_PROGRESS" ? "Devam Ediyor" :
                             participant.status === "STARTED" ? "Başladı" :
                             participant.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
