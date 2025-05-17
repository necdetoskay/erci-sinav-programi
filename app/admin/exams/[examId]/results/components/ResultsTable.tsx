'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ExamResult } from '../types';

interface ResultsTableProps {
  results: ExamResult[];
  loading: boolean;
  searchTerm: string;
  onViewDetails: (result: ExamResult) => void;
  onDeleteResult: (resultId: number) => void;
}

export function ResultsTable({
  results,
  loading,
  searchTerm,
  onViewDetails,
  onDeleteResult,
}: ResultsTableProps) {
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

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Henüz sonuç bulunmuyor
      </div>
    );
  }

  // Sonuçları filtrele - null kontrolleri ile
  const filteredResults = results.filter(result =>
    (result.participant_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (result.participant_email && result.participant_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (filteredResults.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Arama kriterlerine uygun sonuç bulunamadı
      </div>
    );
  }

  return (
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
        {filteredResults.map((result) => (
          <TableRow key={result.id}>
            <TableCell className="font-medium">{result.participant_name}</TableCell>
            <TableCell>{result.participant_email || '-'}</TableCell>
            <TableCell>
              {result.score !== null && result.total_questions && result.total_questions > 0 ? (
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
                  <DropdownMenuItem onClick={() => onViewDetails(result)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Detaylar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteResult(result.id)}
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
  );
}
