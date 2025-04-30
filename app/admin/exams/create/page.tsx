'use client';

import { useState } from 'react';
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
import { toast } from 'sonner';
import { Breadcrumb } from '../../../components/breadcrumb';

export default function CreateExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [accessCode, setAccessCode] = useState('');
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
      
      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          duration_minutes: parseInt(durationMinutes),
          access_code: accessCode || undefined, // Boş ise undefined olarak gönder
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sınav oluşturulurken bir hata oluştu');
      }
      
      const data = await response.json();
      
      toast.success('Sınav başarıyla oluşturuldu');
      
      // Soru ekleme sayfasına yönlendir
      router.push(`/admin/exams/${data.id}/questions`);
    } catch (error) {
      console.error('Sınav oluşturulurken hata:', error);
      toast.error(error instanceof Error ? error.message : 'Sınav oluşturulurken bir hata meydana geldi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/exams');
  };

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb 
        items={[
          { label: 'Yönetim', href: '/admin' },
          { label: 'Sınavlar', href: '/admin/exams' },
          { label: 'Yeni Sınav' }
        ]} 
      />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Yeni Sınav Oluştur</h1>
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
                placeholder="Boş bırakırsanız otomatik oluşturulacak"
              />
              <p className="text-sm text-muted-foreground">
                Personel bu kodu kullanarak sınava erişebilecek.
              </p>
            </div>
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
              {isSubmitting ? 'Oluşturuluyor...' : 'Devam Et'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 