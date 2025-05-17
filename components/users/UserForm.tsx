"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/app/context/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { toast } from "sonner";

// User tipi
interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface UserFormProps {
  user?: User | null;
  mode: "add" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function UserForm({
  user,
  mode,
  onSuccess,
  onCancel,
  isModal = false,
}: UserFormProps) {
  const { user: authUser } = useAuth();
  const { fetchUsers } = useUsers();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [role, setRole] = useState<string>("USER");
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Kullanıcı bilgilerini form alanlarına doldur
  useEffect(() => {
    if (user && mode === "edit") {
      setName(user.name || "");
      setEmail(user.email);
      setRole(user.role);
      setEmailVerified(!!user.emailVerified);
    }

    // Şifre alanlarını her zaman boş bırak ve dokunulmamış olarak işaretle
    setPassword("");
    setConfirmPassword("");
    setPasswordTouched(false);

    // Tarayıcının otomatik doldurmasını engellemek için form alanlarını sıfırla
    const resetPasswordFields = () => {
      const passwordInput = document.getElementById("password") as HTMLInputElement;
      const confirmPasswordInput = document.getElementById("confirmPassword") as HTMLInputElement;

      if (passwordInput) passwordInput.value = "";
      if (confirmPasswordInput) confirmPasswordInput.value = "";
    };

    // Form yüklendikten sonra şifre alanlarını sıfırla
    setTimeout(resetPasswordFields, 100);
  }, [user, mode]);

  // Form doğrulama
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Ad Soyad alanı zorunludur";
    }

    if (!email.trim()) {
      newErrors.email = "E-posta alanı zorunludur";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Geçerli bir e-posta adresi giriniz";
    }

    // Yeni kullanıcı eklerken şifre zorunlu
    if (mode === "add" && !password) {
      newErrors.password = "Şifre alanı zorunludur";
    }

    // Yeni kullanıcı eklerken şifre tekrarı zorunlu ve eşleşmeli
    if (mode === "add" && password !== confirmPassword) {
      newErrors.confirmPassword = "Şifreler eşleşmiyor";
    }

    // Düzenleme modunda şifre girilmişse, şifre tekrarı da girilmeli ve eşleşmeli
    if (mode === "edit" && passwordTouched && password && password !== confirmPassword) {
      newErrors.confirmPassword = "Şifreler eşleşmiyor";
    }

    if (!role) {
      newErrors.role = "Rol seçimi zorunludur";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Şifre alanı dolu ve dokunulmuş ise şifreyi güncelle
      const hasPasswordChange = mode === "edit" && passwordTouched && password.trim() !== "";

      const userData = {
        name,
        email,
        role,
        emailVerified,
        ...(mode === "add" || hasPasswordChange ? { password } : {}),
      };

      const url = mode === "add" ? "/api/users" : `/api/users/${user?.id}`;
      const method = mode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "İşlem sırasında bir hata oluştu");
      }

      toast.success(
        mode === "add"
          ? "Kullanıcı başarıyla oluşturuldu"
          : "Kullanıcı başarıyla güncellendi"
      );

      // Kullanıcı listesini yenile
      await fetchUsers();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "İşlem sırasında bir hata oluştu"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kullanıcının erişebileceği rolleri belirle
  const getAvailableRoles = () => {
    if (authUser?.role === "SUPERADMIN") {
      return ["SUPERADMIN", "ADMIN", "USER", "PERSONEL"];
    } else if (authUser?.role === "ADMIN") {
      return ["USER", "PERSONEL"];
    } else {
      return ["USER"];
    }
  };

  const availableRoles = getAvailableRoles();

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <Card className={isModal ? "border-0 shadow-none" : ""}>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ad Soyad"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emailVerified" className="text-sm font-medium">Hesap Onayı</Label>
            <div className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                id="emailVerified"
                checked={emailVerified}
                onChange={(e) => setEmailVerified(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-600">
                {emailVerified
                  ? "Hesap onaylı (Kullanıcı sisteme giriş yapabilir)"
                  : "Hesap onaylı değil (Kullanıcı sisteme giriş yapamaz)"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Bu seçeneği işaretlerseniz, kullanıcı hesabı onaylanmış olarak işaretlenir ve sisteme giriş yapabilir.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">
              {mode === "add" ? "Şifre" : "Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)"}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                const newValue = e.target.value;
                setPassword(newValue);
                // Sadece değer boş değilse dokunulmuş olarak işaretle
                if (newValue.trim() !== "") {
                  setPasswordTouched(true);
                } else {
                  setPasswordTouched(false);
                }
              }}
              placeholder={mode === "add" ? "Şifre" : "Yeni şifre (opsiyonel)"}
              className={errors.password ? "border-red-500" : ""}
              required={mode === "add"} // Sadece yeni kullanıcı eklerken zorunlu
              autoComplete="new-password" // Tarayıcının otomatik doldurmasını engelle
              key={`password-${user?.id || 'new'}-${Date.now()}`} // Her form açılışında yeni bir key oluştur
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
            {mode === "edit" && (
              <p className="text-xs text-gray-500">
                Şifre değiştirmek istemiyorsanız bu alanı boş bırakın. Mevcut şifre korunacaktır.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">
              {mode === "add" ? "Şifre Tekrarı" : "Yeni Şifre Tekrarı (Değiştirmek istemiyorsanız boş bırakın)"}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                const newValue = e.target.value;
                setConfirmPassword(newValue);
                // Şifre alanı dolu ise ve şifre tekrarı alanı da dolu ise dokunulmuş olarak işaretle
                if (password.trim() !== "" && newValue.trim() !== "") {
                  setPasswordTouched(true);
                }
              }}
              placeholder={mode === "add" ? "Şifre tekrarı" : "Yeni şifre tekrarı (opsiyonel)"}
              className={errors.confirmPassword ? "border-red-500" : ""}
              required={mode === "add"} // Sadece yeni kullanıcı eklerken zorunlu
              autoComplete="new-password" // Tarayıcının otomatik doldurmasını engelle
              key={`confirm-password-${user?.id || 'new'}-${Date.now()}`} // Her form açılışında yeni bir key oluştur
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={role}
              onValueChange={setRole}
            >
              <SelectTrigger
                id="role"
                className={errors.role ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r === "SUPERADMIN"
                      ? "Süper Admin"
                      : r === "ADMIN"
                      ? "Admin"
                      : r === "PERSONEL"
                      ? "Personel"
                      : "Kullanıcı"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              İptal
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                {mode === "add" ? "Oluşturuluyor..." : "Güncelleniyor..."}
              </>
            ) : (
              <>{mode === "add" ? "Oluştur" : "Güncelle"}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
