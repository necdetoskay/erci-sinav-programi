'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function EditExamPage({ params }: { params: { examId: string } }) {
  const router = useRouter();
  const examId = params.examId;
  
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [accessCode, setAccessCode] = useState('');
  const [status, setStatus] = useState('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sınav süresi seçenekleri
  const durationOptions = [
    { value: '15', label: '15 dakika' },
    { value: '30', label: '30 dakika' },
    { value: '45', label: '45 dakika' },
    { value: '60', label: '1 saat' },
    { value: '90', label: '1 saat 30 dakika' },
    { value: '120', label: '2 saat' },
    { value: '180', label: '3 saat' }
  ];

  useEffect(() => {
    async function fetchExam() {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/exams/${examId}`);
        
        if (!response.ok) {
          throw new Error('Sınav yüklenirken bir hata oluştu');
        }
        
        const exam = await response.json();
        
        // Form alanlarını doldur
        setTitle(exam.title);
        setDescription(exam.description || '');
        setDurationMinutes(exam.duration_minutes.toString());
        setAccessCode(exam.access_code || '');
        setStatus(exam.status);
      } catch (error) {
        console.error('Sınav yüklenirken hata:', error);
        toast.error('Sınav yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [examId]);

  const generateAccessCode = () => {
    // Rastgele 6 karakterlik alfanumerik kod oluştur
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karışabilecek karakterler (0, O, 1, I) hariç tutuldu
    let result = '';
    
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }
    
    setAccessCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Lütfen sınav adını giriniz');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          duration_minutes: parseInt(durationMinutes),
          access_code: accessCode,
          status
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sınav güncellenirken bir hata oluştu');
      }
      
      toast.success('Sınav başarıyla güncellendi');
      
      // Sınav listesine geri dön
      router.push('/admin/exams');
    } catch (error) {
      console.error('Sınav güncellenirken hata:', error);
      toast.error(error instanceof Error ? error.message : 'Sınav güncellenirken bir hata meydana geldi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/exams');
  };

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
          <CardContent className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sınavı Düzenle</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Sınav Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Sınav Adı *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sınav adını giriniz"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Sınav açıklaması giriniz (isteğe bağlı)"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Sınav Süresi</Label>
              <Select
                value={durationMinutes}
                onValueChange={setDurationMinutes}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Süre seçin" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="accessCode">Erişim Kodu</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={generateAccessCode}
                >
                  Kod Oluştur
                </Button>
              </div>
              <Input
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Erişim kodu giriniz"
              />
              <p className="text-sm text-muted-foreground">
                Personel bu kodu kullanarak sınava erişebilecek.
              </p>
            </div>

            {status === 'published' && (
              <div className="space-y-2">
                <Label htmlFor="status">Durum</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Durum seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="published">Yayında</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 