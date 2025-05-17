'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ExamResult, Exam } from '../types';
import { useLoadingControl } from '@/hooks/use-loading';

export function useExamResults(examId: number) {
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
  const [deleteLoading, setDeleteLoading] = useState(false);

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
  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      showLoading(); // Loading ekranını göster

      // API isteğini try-catch bloğu içinde yap
      const response = await fetch(`/api/admin/exams/${examId}/results?page=${currentPage}&limit=10`);

      // Yanıt durumunu kontrol et
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API yanıt hatası:', response.status, errorData);
        throw new Error(errorData.error || 'Sonuçlar yüklenirken bir hata oluştu');
      }

      // Yanıtı JSON olarak parse et
      const data = await response.json();

      // Veriyi kontrol et ve varsayılan değerler ata
      setResults(Array.isArray(data.results) ? data.results : []);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.totalCount || 0);
      setAverageScore(data.averageScore || 0);
    } catch (error) {
      console.error('Sonuçlar yüklenirken hata:', error);
      toast.error('Sonuçlar yüklenemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
      hideLoading(); // Loading ekranını gizle
    }
  }, [examId, currentPage, showLoading, hideLoading]);

  // Sonuçları getir - sayfa yüklendiğinde ve sayfa değiştiğinde
  useEffect(() => {
    // Sayfa yüklendiğinde veya sayfa değiştiğinde sonuçları getir
    const getResults = async () => {
      try {
        await fetchResults();
      } catch (error) {
        console.error('Sonuçları getirme hatası:', error);
      }
    };

    getResults();
  }, [examId, currentPage]);

  // Sonuç silme işlemi
  const handleDeleteResult = async () => {
    if (!resultToDelete) return;

    try {
      setDeleteLoading(true);
      showLoading(); // Loading ekranını göster

      const response = await fetch(`/api/admin/exams/${examId}/results?resultId=${resultToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Sonuç silinirken bir hata oluştu');
      }

      // Sonuçları güncelle
      setResults(results.filter(result => result.id !== resultToDelete));
      setTotalResults(prev => prev - 1);
      toast.success('Sonuç başarıyla silindi');
      setDeleteConfirmDialog(false);
    } catch (error) {
      console.error('Sonuç silinirken hata:', error);
      toast.error('Sonuç silinemedi');
    } finally {
      setDeleteLoading(false);
      hideLoading(); // Loading ekranını gizle
    }
  };

  // CSV olarak dışa aktar
  const exportToCSV = useCallback(() => {
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
  }, [results, exam, showLoading, hideLoading]);

  return {
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
    exportToCSV,
    fetchResults
  };
}
