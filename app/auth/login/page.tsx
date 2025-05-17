"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");

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
        // E-posta doğrulama gerekiyorsa
        if (response.status === 403 && result.needsVerification) {
          setVerificationNeeded(true);
          setVerificationEmail(result.email || email);
          toast.error(result.message || "Hesabınız henüz onaylanmamıştır. Lütfen sistem yöneticisiyle iletişime geçin.");
        } else {
          const errorMessage = result.message || result.error || "Giriş yapılamadı";
          toast.error(errorMessage);
        }
        setIsLoading(false);
        return;
      }

      // Başarılı giriş
      toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");

      // Kullanıcı rolüne göre yönlendirme
      const targetUrl = result.user.role === "PERSONEL" ? "/exam" : "/dashboard";
      console.log(`Redirecting to ${targetUrl}`);

      // Doğrudan window.location ile yönlendirme
      window.location.href = targetUrl;
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      setIsLoading(false);
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
