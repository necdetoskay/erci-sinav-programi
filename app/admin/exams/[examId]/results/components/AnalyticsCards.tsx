'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Award, Clock } from 'lucide-react';
import { ExamResult } from '../types';

interface AnalyticsCardsProps {
  totalResults: number;
  averageScore: number;
  results: ExamResult[];
  loading: boolean;
}

export function AnalyticsCards({
  totalResults,
  averageScore,
  results,
  loading
}: AnalyticsCardsProps) {
  // Ortalama süre hesapla
  const calculateAverageDuration = () => {
    if (results.length === 0) return '0dk';

    let totalDurationMs = 0;
    let validResultsCount = 0;

    results.forEach(result => {
      if (result.start_time && result.end_time) {
        const start = new Date(result.start_time);
        const end = new Date(result.end_time);
        const durationMs = end.getTime() - start.getTime();
        
        if (durationMs > 0) {
          totalDurationMs += durationMs;
          validResultsCount++;
        }
      }
    });

    if (validResultsCount === 0) return '0dk';

    const averageDurationMs = totalDurationMs / validResultsCount;
    const minutes = Math.floor(averageDurationMs / 60000);
    const seconds = Math.floor((averageDurationMs % 60000) / 1000);

    return `${minutes}dk ${seconds}sn`;
  };

  return (
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
  );
}
