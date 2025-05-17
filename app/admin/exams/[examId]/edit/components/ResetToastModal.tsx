'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ResetToastModalProps {
  examId: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  attemptCount: number;
}

export function ResetToastModal({
  examId,
  isOpen,
  onClose,
  onConfirm,
  attemptCount,
}: ResetToastModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);

      const response = await fetch(`/api/admin/exams/${examId}/reset-to-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sınav sıfırlanırken bir hata oluştu');
      }

      const data = await response.json();
      toast.success(`Sınav taslak durumuna çevrildi. ${data.attemptCount} katılımcı kaydı silindi.`);
      onConfirm();
    } catch (error) {
      console.error('Sınav sıfırlanırken hata:', error);
      toast.error(error instanceof Error ? error.message : 'Sınav sıfırlanırken bir hata oluştu');
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sınavı Taslak Durumuna Çevir</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p className="font-medium text-destructive">
              Bu sınavı taslak durumuna çevirmek, tüm katılımcı kayıtlarının ve sınav sonuçlarının silinmesine neden olacaktır.
            </p>
            <p>
              Bu sınava ait <strong>{attemptCount}</strong> katılımcı kaydı bulunmaktadır.
            </p>
            <p>
              Bu işlem geri alınamaz. Devam etmek istiyor musunuz?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>İptal</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  İşleniyor...
                </>
              ) : (
                'Evet, Taslak Durumuna Çevir'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
