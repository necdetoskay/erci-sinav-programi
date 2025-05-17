'use client';

import { useState, useEffect, Suspense } from 'react';
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '../../components/breadcrumb';
import { ExamStatus, ExamStatusLabels, ExamStatusValues } from '@/lib/constants/exam-status';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Exam {
  id: number;
  title: string;
  status: string; // ExamStatus değerlerini alacak
  created_at: string;
  updated_at: string;
  access_code: string; // Sınav kodunu ekle
  participantCount?: number;
  totalParticipants?: number;
}

function ExamsTable() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [updatingExamId, setUpdatingExamId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchExams() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/exams?page=${currentPage}&limit=10`);

        if (!response.ok) {
          throw new Error('Sınavlar yüklenirken bir hata oluştu');
        }

        const data = await response.json();
        setExams(data.exams || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('Sınav listesi yüklenirken hata:', error);
        setError('Sınavlar yüklenemedi. Lütfen daha sonra tekrar deneyin.');
        toast.error('Sınavlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    }

    fetchExams();
  }, [currentPage]);

  function handleCreateExam() {
    router.push('/admin/exams/create');
  }

  function handleEditExam(examId: number) {
    router.push(`/admin/exams/${examId}/edit`);
  }

  function handleViewExam(examId: number) {
    router.push(`/admin/exams/${examId}`);
  }

  function handleViewResults(examId: number) {
    router.push(`/admin/exams/${examId}/results`);
  }

  function handleShareExam(examId: number) {
    router.push(`/admin/exams/${examId}/share`);
  }

  // Sınav durumunu değiştirme fonksiyonu
  async function handleStatusChange(examId: number, newStatus: string) {
    try {
      setUpdatingExamId(examId);

      const response = await fetch(`/api/admin/exams/${examId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sınav durumu güncellenirken bir hata oluştu');
      }

      // Başarılı olduğunda, sınav listesini güncelle
      setExams(exams.map(exam =>
        exam.id === examId ? { ...exam, status: newStatus } : exam
      ));

      toast.success('Sınav durumu başarıyla güncellendi');
    } catch (error) {
      console.error('Sınav durumu güncellenirken hata:', error);
      toast.error('Sınav durumu güncellenirken bir hata oluştu');
    } finally {
      setUpdatingExamId(null);
    }
  }

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleDeleteExam(examId: number) {
    setExamToDelete(examId);
    setDeleteModalOpen(true);
  }

  async function confirmDeleteExam() {
    if (!examToDelete) return;

    try {
      setIsDeleting(true);

      // Doğrudan veritabanından silme işlemi yap
      const response = await fetch(`/api/admin/exams/delete-exam?id=${examToDelete}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sınav silinirken bir hata oluştu');
      }

      // Silinen sınavı listeden kaldır
      setExams(exams.filter(exam => exam.id !== examToDelete));
      toast.success('Sınav başarıyla silindi');
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Sınav silinirken hata:', error);
      toast.error('Sınav silinirken bir hata oluştu');
    } finally {
      setIsDeleting(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('tr-TR');
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb kaldırıldı */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sınavlar</h1>
        <div className="flex gap-2">
          <Button onClick={handleCreateExam}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Sınav
          </Button>
        </div>
      </div>

      {/* Card bileşeni kaldırıldı, tablo doğrudan div içine alındı */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="flex justify-center py-8 px-6"> {/* Padding eklendi */}
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setCurrentPage(1)}
              >
                Tekrar Dene
              </Button>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-8 px-6 text-muted-foreground"> {/* Padding eklendi */}
              <p>Henüz sınav oluşturulmamış.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleCreateExam}
              >
                İlk Sınavı Oluştur
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sınav Adı</TableHead>
                    <TableHead>Sınav Kodu</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Katılım</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.access_code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {exam.status === ExamStatus.ACTIVE ? (
                            <Badge variant="default">{ExamStatusLabels[ExamStatus.ACTIVE]}</Badge>
                          ) : exam.status === ExamStatus.COMPLETED ? (
                            <Badge variant="success">{ExamStatusLabels[ExamStatus.COMPLETED]}</Badge>
                          ) : exam.status === ExamStatus.ARCHIVED ? (
                            <Badge variant="outline">{ExamStatusLabels[ExamStatus.ARCHIVED]}</Badge>
                          ) : (
                            <Badge variant="secondary">{ExamStatusLabels[ExamStatus.DRAFT]}</Badge>
                          )}

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
                                  <div className="flex items-center gap-2">
                                    {exam.status === status && <Check className="h-4 w-4" />}
                                    <span>{ExamStatusLabels[status as ExamStatus]}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        {exam.status === ExamStatus.ACTIVE || exam.status === ExamStatus.COMPLETED ?
                          `${exam.participantCount}/${exam.totalParticipants || 'Sınırsız'}` :
                          '0/0'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewExam(exam.id)}>
                              Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditExam(exam.id)}>
                              Düzenle
                            </DropdownMenuItem>
                            {(exam.status === ExamStatus.ACTIVE || exam.status === ExamStatus.COMPLETED) && (
                              <DropdownMenuItem onClick={() => handleViewResults(exam.id)}>
                                Sonuçlar
                              </DropdownMenuItem>
                            )}
                            {exam.status === ExamStatus.ACTIVE && (
                              <DropdownMenuItem onClick={() => handleShareExam(exam.id)}>
                                Paylaş
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteExam(exam.id)}
                              className="text-destructive"
                            >
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Sayfalama */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      &gt;
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
      </div> {/* bg-white div kapanışı */}

      {/* Silme Onay Modalı */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sınavı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu sınavı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm sınav verileri silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExam}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ExamsPage() {
  return (
    <Suspense fallback={<div>Loading exams...</div>}>
      <ExamsTable />
    </Suspense>
  );
}
