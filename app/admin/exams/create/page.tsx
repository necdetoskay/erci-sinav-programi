'use client';

import { useState, Suspense } from 'react';
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  title: z.string().min(1, 'Sınav adı zorunludur'),
  description: z.string().optional(),
  duration_minutes: z.string(),
  access_code: z.string().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']),
});

type FormValues = z.infer<typeof formSchema>;

function CreateExamFormComponent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      duration_minutes: '60',
      access_code: '',
      status: 'draft',
    },
  });

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
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';

    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
    }

    form.setValue('access_code', result);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          duration_minutes: parseInt(values.duration_minutes),
          access_code: values.access_code || undefined,
          status: values.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sınav oluşturulurken bir hata oluştu');
      }

      const data = await response.json();
      toast.success('Sınav başarıyla oluşturuldu');
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Yeni Sınav Oluştur</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            İptal
          </Button>
          <Button
            type="submit"
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Oluşturuluyor...' : 'Devam Et'}
          </Button>
        </div>
      </div>

      <Form form={form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-lg">Sınav Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem className="space-y-1">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <>
                        <FormLabel>Sınav Adı *</FormLabel>
                        <FormControl>
                          <Input placeholder="Sınav adını giriniz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </>
                    )}
                  />
                </FormItem>

                <FormItem className="space-y-1">
                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <>
                        <FormLabel>Sınav Süresi</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Süre seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {durationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </>
                    )}
                  />
                </FormItem>

                <FormItem className="space-y-1">
                  <FormField
                    control={form.control}
                    name="access_code"
                    render={({ field }) => (
                      <>
                        <div className="flex items-center justify-between">
                          <FormLabel>Erişim Kodu</FormLabel>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateAccessCode}
                          >
                            Kod Oluştur
                          </Button>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Boş bırakırsanız otomatik oluşturulacak"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Personel bu kodu kullanarak sınava erişebilecek.
                        </FormDescription>
                        <FormMessage />
                      </>
                    )}
                  />
                </FormItem>

                <FormItem className="space-y-1">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <>
                        <FormLabel>Durum</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Durum seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Taslak</SelectItem>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="completed">Tamamlandı</SelectItem>
                            <SelectItem value="archived">Arşivlenmiş</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Sadece &quot;Aktif&quot; durumdaki sınavlara katılım sağlanabilir.
                        </FormDescription>
                        <FormMessage />
                      </>
                    )}
                  />
                </FormItem>

                <FormItem className="space-y-1 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <>
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Sınav açıklaması giriniz (isteğe bağlı)"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </>
                    )}
                  />
                </FormItem>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateExamFormComponent />
    </Suspense>
  );
}
