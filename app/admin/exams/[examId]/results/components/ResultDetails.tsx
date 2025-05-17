'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { FileText } from 'lucide-react';
import { ExamResult } from '../types';

interface ResultDetailsProps {
  result: ExamResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResultDetails({ result, open, onOpenChange }: ResultDetailsProps) {
  if (!result) return null;

  // Tarih formatla
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd MMMM yyyy HH:mm:ss', { locale: tr });
  };

  // Süre hesapla
  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return '-';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();

    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    return `${minutes} dakika ${seconds} saniye`;
  };

  // Puan yüzdesi hesapla
  const calculatePercentage = () => {
    if (result.score === null || !result.total_questions) return 0;
    return Math.round((result.score / result.total_questions) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sınav Sonuç Detayları</DialogTitle>
          <DialogDescription>
            {result.participant_name} - {result.participant_email || 'E-posta yok'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Katılımcı Bilgileri</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">İsim:</div>
                <div>{result.participant_name}</div>
                <div className="text-sm font-medium">E-posta:</div>
                <div>{result.participant_email || '-'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Sınav Bilgileri</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Başlangıç:</div>
                <div>{formatDate(result.start_time)}</div>
                <div className="text-sm font-medium">Bitiş:</div>
                <div>{formatDate(result.end_time)}</div>
                <div className="text-sm font-medium">Süre:</div>
                <div>{calculateDuration(result.start_time, result.end_time)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Sonuç</h3>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                {result.score !== null && result.total_questions ? (
                  <>{result.score}/{result.total_questions}</>
                ) : (
                  '-'
                )}
              </div>
              {result.score !== null && result.total_questions && (
                <Badge className="text-lg px-3 py-1" variant={calculatePercentage() >= 70 ? 'default' : 'secondary'}>
                  {calculatePercentage()}%
                </Badge>
              )}
            </div>
          </div>

          {result.answers && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Cevaplar</h3>
              <div className="border rounded-md p-4 space-y-4">
                {Array.isArray(result.answers) ? (
                  result.answers.map((answer, index) => (
                    <div key={index} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="font-medium mb-2">Soru {index + 1}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Verilen Cevap:</div>
                        <div>{answer.userAnswer || '-'}</div>
                        <div className="text-muted-foreground">Doğru Cevap:</div>
                        <div>{answer.correctAnswer || '-'}</div>
                        <div className="text-muted-foreground">Sonuç:</div>
                        <div>
                          <Badge variant={answer.isCorrect ? 'default' : 'destructive'}>
                            {answer.isCorrect ? 'Doğru' : 'Yanlış'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-center py-2">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Cevap detayları mevcut değil
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button>Kapat</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
