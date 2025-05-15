"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Token is missing');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok) {
          setIsVerified(true);
        } else {
          setError(data.message || 'Failed to verify email');
        }
      } catch (error) {
        setError('An error occurred during verification');
        console.error('Verification error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">E-posta Doğrulama</CardTitle>
          <CardDescription className="text-center">
            Hesabınızın e-posta doğrulama durumu
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-lg">E-posta adresiniz doğrulanıyor...</p>
            </div>
          ) : isVerified ? (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg text-center">E-posta adresiniz başarıyla doğrulandı!</p>
              <p className="text-center text-gray-600">
                Artık hesabınıza giriş yapabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg text-center">E-posta doğrulama başarısız oldu.</p>
              <p className="text-center text-gray-600">
                {error || 'Doğrulama bağlantısı geçersiz veya süresi dolmuş olabilir.'}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login">
            <Button>
              {isVerified ? 'Giriş Yap' : 'Giriş Sayfasına Dön'}
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
