'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Şifre sıfırlama formu için şema
const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Token kontrolü
  useEffect(() => {
    if (!token) {
      setError('Geçersiz veya eksik şifre sıfırlama bağlantısı');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Geçersiz veya eksik şifre sıfırlama bağlantısı');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Şifre sıfırlama işlemi başarısız oldu');
      }

      setIsSuccess(true);
      toast.success('Şifreniz başarıyla sıfırlandı');
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      setError(error instanceof Error ? error.message : 'Şifre sıfırlama işlemi sırasında bir hata oluştu');
      toast.error(error instanceof Error ? error.message : 'Şifre sıfırlama işlemi sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Şifre Sıfırlama</CardTitle>
          <CardDescription className="text-center">
            Yeni şifrenizi belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Hata</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSuccess ? (
            <div className="space-y-4">
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Başarılı</AlertTitle>
                <AlertDescription>Şifreniz başarıyla sıfırlandı. Artık yeni şifrenizle giriş yapabilirsiniz.</AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => router.push('/auth/login')}>
                Giriş Sayfasına Git
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Yeni Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...register('password')}
                  disabled={isLoading || !token}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  {...register('confirmPassword')}
                  disabled={isLoading || !token}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !token}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'İşleniyor...' : 'Şifremi Sıfırla'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:underline">
            Giriş sayfasına dön
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
