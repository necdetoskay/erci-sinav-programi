'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '../../components/breadcrumb';

interface Exam {
  id: number;
  title: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  access_code: string; // Sınav kodunu ekle
  participantCount?: number;
  totalParticipants?: number;
}

export default function ExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

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

  async function handleDeleteExam(examId: number) {
    if (window.confirm('Bu sınavı silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/admin/exams/${examId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Sınav silinirken bir hata oluştu');
        }
        
        // Silinen sınavı listeden kaldır
        setExams(exams.filter(exam => exam.id !== examId));
        toast.success('Sınav başarıyla silindi');
      } catch (error) {
        console.error('Sınav silinirken hata:', error);
        toast.error('Sınav silinirken bir hata oluştu');
      }
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
        <Button onClick={handleCreateExam}>
          <Plus className="mr-2 h-4 w-4" />
          Yeni Sınav
        </Button>
      </div>

      {/* Card bileşeni kaldırıldı, tablo doğrudan div içine alındı */}
      <div className="bg-white rounded-lg shadow">
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
                    <TableHead>Sınav Kodu</TableHead> {/* Yeni sütun başlığı */}
                    <TableHead>Durum</TableHead>
                    <TableHead>Katılım</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>{exam.access_code}</TableCell> {/* Sınav kodunu göster */}
                      <TableCell>
                        <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                          {exam.status === 'published' ? 'Yayında' : 'Taslak'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {exam.status === 'published' ? 
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
                            {exam.status === 'published' && (
                              <DropdownMenuItem onClick={() => handleViewResults(exam.id)}>
                                Sonuçlar
                              </DropdownMenuItem>
                            )}
                            {exam.status === 'published' && (
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
    </div>
  );
}
