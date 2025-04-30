'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, PenSquare, Share2, BarChart2 } from 'lucide-react';
import { toast } from 'sonner';
import { Breadcrumb } from '../../../components/breadcrumb';

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  difficulty: string;
  position: number;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  status: string;
  duration_minutes: number;
  access_code: string;
  questions: Question[];
  participantCount: number;
  totalParticipants: number;
}

export default function ExamDetailPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const examId = parseInt(params.examId);
  
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    async function fetchExam() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/exams/${examId}`);
        
        if (!response.ok) {
          throw new Error('Sınav yüklenirken bir hata oluştu');
        }
        
        const data = await response.json();
        setExam(data);
      } catch (error) {
        console.error('Sınav yüklenirken hata:', error);
        toast.error('Sınav yüklenemedi');
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [examId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-1/4" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Sınav bulunamadı</p>
            <Button variant="outline" onClick={() => router.push('/admin/exams')}>
              Sınav Listesine Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb 
        items={[
          { label: 'Yönetim', href: '/admin' },
          { label: 'Sınavlar', href: '/admin/exams' },
          { label: exam?.title || 'Sınav Detayı' }
        ]} 
      />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          {exam.description && (
            <p className="text-muted-foreground mt-2">{exam.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/exams/${examId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button onClick={() => router.push(`/admin/exams/${examId}/questions`)}>
            <PenSquare className="h-4 w-4 mr-2" />
            Soruları Düzenle
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sınav Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Durum</span>
              <Badge variant={exam.status === 'published' ? 'default' : 'secondary'}>
                {exam.status === 'published' ? 'Yayında' : 'Taslak'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Soru Sayısı</span>
              <span className="font-medium">{exam.questions?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Süre</span>
              <span className="font-medium">{exam.duration_minutes} dakika</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Erişim Kodu</span>
              <code className="bg-muted px-2 py-1 rounded">{exam.access_code}</code>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Katılım Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Katılımcı Sayısı</span>
              <span className="font-medium">
                {exam.participantCount}/{exam.totalParticipants || 'Sınırsız'}
              </span>
            </div>
            <div className="flex gap-2 mt-6">
              {exam.status === 'published' && (
                <>
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => router.push(`/admin/exams/${examId}/share`)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Paylaş
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => router.push(`/admin/exams/${examId}/results`)}
                  >
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Sonuçlar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 