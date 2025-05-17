'use client';

import { useState, Suspense } from 'react';
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, BarChart, Users, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb } from '../../../../components/breadcrumb';

// Modülerleştirilmiş bileşenler
import { ResultsTable } from './components/ResultsTable';
import { AnalyticsCards } from './components/AnalyticsCards';
import { ResultDetails } from './components/ResultDetails';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';

// Custom hook
import { useExamResults } from './hooks/useExamResults';

function ExamResultsComponent({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const examId = parseInt(params.examId);
  const [activeTab, setActiveTab] = useState('results');

  // Custom hook kullanımı
  const {
    exam,
    results,
    loading,
    currentPage,
    totalPages,
    totalResults,
    averageScore,
    searchTerm,
    selectedResult,
    showResultDialog,
    deleteConfirmDialog,
    resultToDelete,
    deleteLoading,
    setCurrentPage,
    setSearchTerm,
    setSelectedResult,
    setShowResultDialog,
    setDeleteConfirmDialog,
    setResultToDelete,
    handleDeleteResult,
    exportToCSV
  } = useExamResults(examId);

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
              <ResultsTable
                results={results}
                loading={loading}
                searchTerm={searchTerm}
                onViewDetails={(result) => {
                  setSelectedResult(result);
                  setShowResultDialog(true);
                }}
                onDeleteResult={(resultId) => {
                  setResultToDelete(resultId);
                  setDeleteConfirmDialog(true);
                }}
              />
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
          <AnalyticsCards
            totalResults={totalResults}
            averageScore={averageScore}
            results={results}
            loading={loading}
          />

          <Card>
            <CardHeader>
              <CardTitle>Puan Dağılımı</CardTitle>
              <CardDescription>
                Katılımcıların puan aralıklarına göre dağılımı
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 animate-pulse bg-muted rounded-md" />
              ) : (
                <div className="space-y-4">
                  {renderScoreDistribution()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modülerleştirilmiş bileşenler */}
      <ResultDetails
        result={selectedResult}
        open={showResultDialog}
        onOpenChange={setShowResultDialog}
      />

      <DeleteConfirmDialog
        open={deleteConfirmDialog}
        onOpenChange={setDeleteConfirmDialog}
        onConfirm={handleDeleteResult}
        isLoading={deleteLoading}
      />
    </div>
  );
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
