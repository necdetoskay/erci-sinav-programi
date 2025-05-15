"use client";

import { useState, useEffect } from "react";
import { useUsers } from "@/app/context/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, UserRole, CreateUserData, UpdateUserData } from "@/app/types";
import { toast } from "sonner";

interface UserFormProps {
  user?: User;
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
  const { addUser, updateUser } = useUsers();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as UserRole,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && mode === "edit") {
      setFormData({
        name: user.name ?? "",
        email: user.email,
        password: "",
        role: user.role,
      });
    }
  }, [user, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "add") {
        const newUserData: CreateUserData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };
        await addUser(newUserData);
        toast.success("Kullanıcı başarıyla eklendi");
      } else if (user) {
        const updateData: UpdateUserData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        
        // Şifre varsa ekle
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await updateUser(user.id, updateData);
        toast.success("Kullanıcı başarıyla güncellendi");
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      console.error("Form error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modal olmayan kullanım için kart içinde form
  if (!isModal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "add" ? "Yeni Kullanıcı Ekle" : "Kullanıcıyı Düzenle"}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {renderFormContent()}
          </CardContent>
          <CardFooter className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                İptal
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Kaydediliyor..."
                : mode === "add"
                ? "Ekle"
                : "Güncelle"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  // Modal kullanımı için sadece form içeriği
  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}
      {renderFormContent()}
      <div className="flex justify-end space-x-3 mt-6">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            İptal
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Kaydediliyor..."
            : mode === "add"
            ? "Ekle"
            : "Güncelle"}
        </Button>
      </div>
    </form>
  );

  // Form içeriği fonksiyonu
  function renderFormContent() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            {mode === "add" ? "Şifre" : "Yeni Şifre (Opsiyonel)"}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required={mode === "add"}
            placeholder={mode === "edit" ? "Değiştirmek için yeni şifre girin" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rol</Label>
          <select
            id="role"
            className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
          >
            <option value="USER">Kullanıcı</option>
            <option value="ADMIN">Yönetici</option>
            <option value="PERSONEL">Personel</option>
            <option value="SUPERADMIN">Süper Admin</option>
          </select>
        </div>
      </div>
    );
  }
}
