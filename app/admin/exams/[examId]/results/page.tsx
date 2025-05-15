'use client';

import { useState, useEffect, Suspense } from 'react';
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useRouter } from 'next/navigation';
import { useLoadingControl } from '@/hooks/use-loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MoreHorizontal,
  Download,
  Search,
  BarChart,
  Users,
  Clock,
  Award,
  ArrowLeft,
  Trash2,
  Eye,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '../../../../components/breadcrumb';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Sonuç tipi
interface ExamResult {
  id: number;
  exam_id: number;
  participant_name: string;
  participant_email: string | null;
  score: number | null;
  total_questions: number | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  answers: any | null;
}

// Sınav tipi
interface Exam {
  id: number;
  title: string;
  description: string | null;
  status: string;
  duration_minutes: number;
  access_code: string;
  created_at: string;
}

function ExamResultsComponent({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const examId = parseInt(params.examId);
  const { showLoading, hideLoading } = useLoadingControl();

  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('results');

  // Sayfa yüklendiğinde loading ekranını göster
  useEffect(() => {
    showLoading();
    return () => hideLoading();
  }, []);

  // Sınav bilgilerini getir
  useEffect(() => {
    async function fetchExam() {
      try {
        const response = await fetch(`/api/admin/exams/${examId}`);
        if (!response.ok) {
          throw new Error('Sınav bilgileri yüklenirken bir hata oluştu');
        }
        const data = await response.json();
        setExam(data);
      } catch (error) {
        console.error('Sınav bilgileri yüklenirken hata:', error);
        toast.error('Sınav bilgileri yüklenemedi');
      }
    }

    fetchExam();
  }, [examId]);

  // Sonuçları getir
  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        showLoading(); // Loading ekranını göster

        const response = await fetch(`/api/admin/exams/${examId}/results?page=${currentPage}&limit=10`);

        if (!response.ok) {
          throw new Error('Sonuçlar yüklenirken bir hata oluştu');
        }

        const data = await response.json();
        setResults(data.results || []);
        setTotalPages(data.totalPages || 1);
        setTotalResults(data.totalCount || 0);
        setAverageScore(data.averageScore || 0);
      } catch (error) {
        console.error('Sonuçlar yüklenirken hata:', error);
        toast.error('Sonuçlar yüklenemedi');
      } finally {
        setLoading(false);
        hideLoading(); // Loading ekranını gizle
      }
    }

    fetchResults();
  }, [examId, currentPage]);

  // Sonuç silme işlemi
  const handleDeleteResult = async (resultId: number) => {
    try {
      showLoading(); // Loading ekranını göster

      const response = await fetch(`/api/admin/exams/${examId}/results?resultId=${resultId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Sonuç silinirken bir hata oluştu');
      }

      // Sonuçları güncelle
      setResults(results.filter(result => result.id !== resultId));
      setTotalResults(prev => prev - 1);
      toast.success('Sonuç başarıyla silindi');
      setDeleteConfirmDialog(false);
    } catch (error) {
      console.error('Sonuç silinirken hata:', error);
      toast.error('Sonuç silinemedi');
    } finally {
      hideLoading(); // Loading ekranını gizle
    }
  };

  // CSV olarak dışa aktar
  const exportToCSV = () => {
    if (results.length === 0) {
      toast.error('Dışa aktarılacak sonuç bulunamadı');
      return;
    }

    try {
      showLoading(); // Loading ekranını göster

      // CSV başlıkları
      const headers = [
        'ID',
        'Katılımcı Adı',
        'E-posta',
        'Puan',
        'Toplam Soru',
        'Başlangıç Zamanı',
        'Bitiş Zamanı',
        'Oluşturulma Tarihi'
      ];

      // CSV satırları
      const csvRows = [
        headers.join(','),
        ...results.map(result => [
          result.id,
          `"${result.participant_name}"`,
          `"${result.participant_email || ''}"`,
          result.score,
          result.total_questions,
          result.start_time ? new Date(result.start_time).toLocaleString('tr-TR') : '',
          result.end_time ? new Date(result.end_time).toLocaleString('tr-TR') : '',
          new Date(result.created_at).toLocaleString('tr-TR')
        ].join(','))
      ];

      // CSV içeriğini oluştur
      const csvContent = csvRows.join('\n');

      // Dosyayı indir
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${exam?.title || 'sinav'}_sonuclari.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Sonuçlar CSV olarak indirildi');
    } catch (error) {
      console.error('CSV dışa aktarma hatası:', error);
      toast.error('Sonuçlar dışa aktarılamadı');
    } finally {
      hideLoading(); // Loading ekranını gizle
    }
  };

  // Sonuç detaylarını görüntüle
  const viewResultDetails = (result: ExamResult) => {
    setSelectedResult(result);
    setShowResultDialog(true);
  };

  // Tarih formatla
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: tr });
  };

  // Süre hesapla
  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return '-';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();

    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    return `${minutes}dk ${seconds}sn`;
  };

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb
        items={[
          { label: 'Yönetim', href: '/admin' },
          { label: 'Sınavlar', href: '/admin/exams' },
          { label: exam?.title || 'Sınav', href: `/admin/exams/${examId}` },
          { label: 'Sonuçlar' }
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Sınav Sonuçları</h1>
          {exam && (
            <p className="text-muted-foreground mt-2">{exam.title}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/exams/${examId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Sınava Dön
          </Button>
          <Button onClick={exportToCSV} disabled={results.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            CSV İndir
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">
            <Users className="h-4 w-4 mr-2" />
            Katılımcı Sonuçları
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="h-4 w-4 mr-2" />
            Analiz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Katılımcı Listesi</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="İsim veya e-posta ara..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <CardDescription>
                Toplam {totalResults} katılımcı, ortalama puan: {averageScore}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz sonuç bulunmuyor
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Katılımcı</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Puan</TableHead>
                      <TableHead>Süre</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results
                      .filter(result =>
                        result.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (result.participant_email && result.participant_email.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.participant_name}</TableCell>
                          <TableCell>{result.participant_email || '-'}</TableCell>
                          <TableCell>
                            {result.score !== null && result.total_questions ? (
                              <div className="flex items-center gap-2">
                                <span>{result.score}/{result.total_questions}</span>
                                <Badge variant={result.score / result.total_questions >= 0.7 ? 'default' : 'secondary'}>
                                  {Math.round((result.score / result.total_questions) * 100)}%
                                </Badge>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {calculateDuration(result.start_time, result.end_time)}
                          </TableCell>
                          <TableCell>{formatDate(result.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => viewResultDetails(result)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Detaylar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setResultToDelete(result.id);
                                    setDeleteConfirmDialog(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {totalPages > 1 && (
              <CardFooter className="flex justify-center pt-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Önceki
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      disabled={loading}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Sonraki
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Toplam Katılımcı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-2xl font-bold">{totalResults}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Puan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-2xl font-bold">{averageScore}%</span>
                </div>
                <Progress value={averageScore} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ortalama Süre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-muted-foreground mr-2" />
                  <span className="text-2xl font-bold">
                    {loading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      calculateAverageDuration()
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Puan Dağılımı</CardTitle>
              <CardDescription>
                Katılımcıların puan aralıklarına göre dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="space-y-4">
                  {renderScoreDistribution()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sonuç Detay Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sonuç Detayları</DialogTitle>
            <DialogDescription>
              {selectedResult?.participant_name} - {formatDate(selectedResult?.created_at || '')}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Katılımcı Bilgileri</h3>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Ad Soyad:</span>
                      <span>{selectedResult.participant_name}</span>

                      <span className="text-muted-foreground">E-posta:</span>
                      <span>{selectedResult.participant_email || '-'}</span>

                      <span className="text-muted-foreground">Başlangıç:</span>
                      <span>{formatDate(selectedResult.start_time)}</span>

                      <span className="text-muted-foreground">Bitiş:</span>
                      <span>{formatDate(selectedResult.end_time)}</span>

                      <span className="text-muted-foreground">Süre:</span>
                      <span>{calculateDuration(selectedResult.start_time, selectedResult.end_time)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-1">Sınav Sonucu</h3>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Puan:</span>
                      <span className="font-medium">
                        {selectedResult.score !== null && selectedResult.total_questions ? (
                          `${Math.round((selectedResult.score / selectedResult.total_questions) * 100)}%`
                        ) : '-'}
                      </span>

                      <span className="text-muted-foreground">Doğru Sayısı:</span>
                      <span>{selectedResult.score || 0}/{selectedResult.total_questions || 0}</span>

                      <span className="text-muted-foreground">Başarı Durumu:</span>
                      <span>
                        {selectedResult.score !== null && selectedResult.total_questions ? (
                          <Badge variant={(selectedResult.score / selectedResult.total_questions) >= 0.7 ? 'default' : 'secondary'}>
                            {(selectedResult.score / selectedResult.total_questions) >= 0.7 ? 'Başarılı' : 'Başarısız'}
                          </Badge>
                        ) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cevaplar bölümü - eğer varsa */}
              {selectedResult.answers && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Cevaplar</h3>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p className="text-muted-foreground mb-2">Detaylı cevap bilgileri mevcut değil.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <Dialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sonuç Silme Onayı</DialogTitle>
            <DialogDescription>
              Bu sonucu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline">İptal</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => resultToDelete && handleDeleteResult(resultToDelete)}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Ortalama süre hesaplama
  function calculateAverageDuration() {
    if (results.length === 0) return '-';

    let totalDuration = 0;
    let validResults = 0;

    results.forEach(result => {
      if (result.start_time && result.end_time) {
        const start = new Date(result.start_time);
        const end = new Date(result.end_time);
        const duration = end.getTime() - start.getTime();

        if (duration > 0) {
          totalDuration += duration;
          validResults++;
        }
      }
    });

    if (validResults === 0) return '-';

    const avgDurationMs = totalDuration / validResults;
    const minutes = Math.floor(avgDurationMs / 60000);
    const seconds = Math.floor((avgDurationMs % 60000) / 1000);

    return `${minutes}dk ${seconds}sn`;
  }

  // Puan dağılımı render
  function renderScoreDistribution() {
    if (results.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Henüz sonuç bulunmuyor
        </div>
      );
    }

    // Puan aralıkları
    const ranges = [
      { min: 0, max: 49, label: '0-49%', color: 'bg-red-500' },
      { min: 50, max: 69, label: '50-69%', color: 'bg-yellow-500' },
      { min: 70, max: 84, label: '70-84%', color: 'bg-green-500' },
      { min: 85, max: 100, label: '85-100%', color: 'bg-emerald-500' },
    ];

    // Her aralık için sonuç sayısını hesapla
    const distribution = ranges.map(range => {
      const count = results.filter(result => {
        if (result.score === null || result.total_questions === null) return false;
        const percentage = (result.score / result.total_questions) * 100;
        return percentage >= range.min && percentage <= range.max;
      }).length;

      return {
        ...range,
        count,
        percentage: results.length > 0 ? (count / results.length) * 100 : 0
      };
    });

    return (
      <div className="space-y-3">
        {distribution.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span>{item.count} kişi ({Math.round(item.percentage)}%)</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
}

// Yükleme ekranı bileşeni
function LoadingScreen() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Skeleton className="h-12 w-full mb-6" />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>

        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function ExamResultsPage({ params }: { params: { examId: string } }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ExamResultsComponent params={params} />
    </Suspense>
  );
}
