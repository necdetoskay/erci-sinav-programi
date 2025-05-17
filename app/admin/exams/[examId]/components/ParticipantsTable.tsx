'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Search, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface Participant {
  id: string;
  name: string;
  email: string | null;
  status: string;
  startTime: string;
  endTime: string | null;
  correctAnswers: number;
  wrongAnswers: number;
  score: number | null;
}

interface ParticipantsTableProps {
  examId: number;
}

export function ParticipantsTable({ examId }: ParticipantsTableProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [restartingId, setRestartingId] = useState<string | null>(null);

  // Katılımcıları getir
  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/exams/${examId}/participants`);

      if (!response.ok) {
        throw new Error('Katılımcılar yüklenirken bir hata oluştu');
      }

      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error('Katılımcılar yüklenirken hata:', error);
      toast.error('Katılımcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Sınavı yeniden başlat
  const handleRestartExam = async (participant: Participant) => {
    try {
      setRestartingId(participant.id);

      const response = await fetch(`/api/admin/exams/${examId}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantEmail: participant.email,
          participantName: participant.name,
        }),
      });

      if (!response.ok) {
        throw new Error('Sınav yeniden başlatılırken bir hata oluştu');
      }

      toast.success(`${participant.name} için sınav yeniden başlatıldı`);

      // Katılımcı listesini güncelle
      fetchParticipants();
    } catch (error) {
      console.error('Sınav yeniden başlatılırken hata:', error);
      toast.error('Sınav yeniden başlatılamadı');
    } finally {
      setRestartingId(null);
    }
  };

  // Durum badge'i
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'STARTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Başladı</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Devam Ediyor</Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Tamamlandı</Badge>;
      case 'TIMED_OUT':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Süre Doldu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filtrelenmiş katılımcılar
  const filteredParticipants = participants.filter(participant => {
    const searchLower = searchTerm.toLowerCase();
    return (
      participant.name.toLowerCase().includes(searchLower) ||
      (participant.email && participant.email.toLowerCase().includes(searchLower))
    );
  });

  // İlk yükleme
  useEffect(() => {
    fetchParticipants();
  }, [examId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim veya e-posta ara..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchParticipants} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Yenile
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Başlama Tarihi</TableHead>
              <TableHead>Bitiş Tarihi</TableHead>
              <TableHead>Doğru / Yanlış</TableHead>
              <TableHead>Puan</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">Katılımcılar yükleniyor...</p>
                </TableCell>
              </TableRow>
            ) : filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {searchTerm ? (
                    <div className="space-y-3">
                      <Search className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Arama kriterine uygun katılımcı bulunamadı</p>
                        <p className="text-xs text-muted-foreground">Farklı bir arama terimi deneyin veya tüm katılımcıları görmek için arama kutusunu temizleyin</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <UserX className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-muted-foreground font-medium">Henüz hiçbir personel sınava başlamamıştır</p>
                        <p className="text-xs text-muted-foreground">Personel sınava başladığında, sınav bilgileri burada listelenecektir</p>
                      </div>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">
                    {participant.name}
                    {participant.email && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {participant.email}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {participant.startTime ? (
                      format(new Date(participant.startTime), 'dd MMM yyyy HH:mm', { locale: tr })
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {participant.endTime ? (
                      format(new Date(participant.endTime), 'dd MMM yyyy HH:mm', { locale: tr })
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {participant.correctAnswers}/{participant.wrongAnswers}
                  </TableCell>
                  <TableCell>
                    {participant.score !== null ? `${participant.score}` : '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(participant.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestartExam(participant)}
                      disabled={restartingId === participant.id}
                    >
                      {restartingId === participant.id ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-2" />
                      )}
                      Yeniden Başlat
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
