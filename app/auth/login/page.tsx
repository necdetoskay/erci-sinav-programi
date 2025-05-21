"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";
import { loadFormState, clearFormState } from "@/lib/auth-fetch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [savedFormState, setSavedFormState] = useState<any>(null);
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  // URL parametrelerini ve kaydedilmiş form durumunu kontrol et
  useEffect(() => {
    // URL parametrelerini kontrol et
    const sessionExpiredParam = searchParams.get('sessionExpired');
    const callbackUrl = searchParams.get('callbackUrl');

    if (sessionExpiredParam === 'true') {
      setSessionExpired(true);
    }

    if (callbackUrl) {
      setReturnUrl(callbackUrl);
    }

    // Kaydedilmiş form durumunu yükle
    const savedState = loadFormState("exam-wizard-data");
    if (savedState) {
      setSavedFormState(savedState);

      // Otomatik olarak e-posta alanını doldur (eğer varsa)
      if (savedState.formData?.basicInfo?.createdBy?.email) {
        setEmail(savedState.formData.basicInfo.createdBy.email);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting login with:", { email, password, rememberMe: !!rememberMe });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe: !!rememberMe, // Boolean'a dönüştür
        }),
      });

      const result = await response.json();
      console.log("Login API response:", result);

      if (!response.ok) {
        // Hata durumunda loading ekranını HEMEN kapat
        setIsLoading(false);

        // Hata mesajını göstermeden önce kısa bir gecikme ekle
        // Bu, loading ekranının tamamen kapanmasını sağlar
        await new Promise(resolve => setTimeout(resolve, 100));

        // E-posta doğrulama gerekiyorsa
        if (response.status === 403 && result.needsVerification) {
          setVerificationNeeded(true);
          setVerificationEmail(result.email || email);
          // Hata mesajını daha uzun süre göster (15 saniye)
          toast.error(result.message || "Hesabınız henüz onaylanmamıştır. Lütfen sistem yöneticisiyle iletişime geçin.", {
            duration: 15000, // 15 saniye
            id: "login-error", // Aynı ID ile önceki toast'u değiştirir
            important: true // Önemli bir mesaj olduğunu belirt
          });
        } else {
          const errorMessage = result.message || result.error || "Giriş yapılamadı";
          // Hata mesajını daha uzun süre göster (15 saniye)
          toast.error(errorMessage, {
            duration: 15000, // 15 saniye
            id: "login-error", // Aynı ID ile önceki toast'u değiştirir
            important: true // Önemli bir mesaj olduğunu belirt
          });
        }
        return;
      }

      // Başarılı giriş
      toast.success("Giriş başarılı! Yönlendiriliyorsunuz...", {
        duration: 5000, // 5 saniye
        id: "login-success" // Aynı ID ile önceki toast'u değiştirir
      });

      // Yönlendirme hedefini belirle
      let targetUrl = result.user.role === "PERSONEL" ? "/exam" : "/dashboard";

      // Eğer bir geri dönüş URL'i varsa ve oturum süresi dolmuşsa, oraya yönlendir
      if (returnUrl && sessionExpired) {
        targetUrl = returnUrl;
      }

      console.log(`Redirecting to ${targetUrl}`);

      // Kısa bir gecikme ile yönlendirme yap (toast mesajının görünmesi için)
      setTimeout(() => {
        // Doğrudan window.location ile yönlendirme
        window.location.href = targetUrl;
      }, 1000);
    } catch (error) {
      // Hata durumunda loading ekranını HEMEN kapat
      setIsLoading(false);

      // Hata mesajını göstermeden önce kısa bir gecikme ekle
      // Bu, loading ekranının tamamen kapanmasını sağlar
      await new Promise(resolve => setTimeout(resolve, 100));

      console.error("Login error:", error);
      // Hata mesajını daha uzun süre göster (15 saniye)
      toast.error("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.", {
        duration: 15000, // 15 saniye
        id: "login-error", // Aynı ID ile önceki toast'u değiştirir
        important: true // Önemli bir mesaj olduğunu belirt
      });
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Kent Konut Sınav Portalı</CardTitle>
          <CardDescription className="text-center">
            E-posta ve şifrenizle giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Oturum süresi dolduğunda gösterilecek uyarı */}
          {sessionExpired && (
            <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
              <Icons.alertTriangle className="h-4 w-4" />
              <AlertTitle>Oturum süreniz doldu</AlertTitle>
              <AlertDescription>
                Güvenlik nedeniyle oturumunuz sonlandırıldı. Lütfen yeniden giriş yapın.
                {savedFormState && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Çalışmanız kaydedildi ve giriş yaptıktan sonra kaldığınız yerden devam edebilirsiniz.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => clearFormState("exam-wizard-data")}
                    >
                      <Icons.trash className="mr-2 h-3 w-3" />
                      Kaydedilen verileri temizle
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {verificationNeeded ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Icons.alertTriangle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Hesabınız henüz onaylanmamıştır. Lütfen sistem yöneticisiyle iletişime geçin veya <strong>{verificationEmail}</strong> adresine gönderilen onay e-postasını kontrol edin.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVerificationNeeded(false)}
                >
                  Farklı bir hesapla giriş yap
                </Button>
                <Button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      // Doğrulama e-postasını yeniden gönder
                      const response = await fetch("/api/auth/resend-verification", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: verificationEmail }),
                      });

                      if (response.ok) {
                        toast.success("Doğrulama e-postası yeniden gönderildi");
                      } else {
                        const data = await response.json();
                        toast.error(data.message || "E-posta gönderilemedi");
                      }
                    } catch (error) {
                      console.error("Error resending verification:", error);
                      toast.error("E-posta gönderilirken bir hata oluştu");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    "Doğrulama e-postasını yeniden gönder"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  E-posta
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                  disabled={isLoading}
                />
              </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Şifre
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <Icons.eyeOff className="h-4 w-4" />
                  ) : (
                    <Icons.eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
              />
              <label
                htmlFor="remember-me"
                className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Beni hatırla
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center w-full">
            Hesabınız yok mu?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Kayıt Ol
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
