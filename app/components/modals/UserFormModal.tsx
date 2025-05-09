"use client";

import { useState, useEffect } from "react";
import { useUsers, User } from "../../context/UserContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Role = "ADMIN" | "USER" | "PERSONEL";
type Status = "ACTIVE" | "INACTIVE";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  mode: "add" | "edit";
}

export default function UserFormModal({
  isOpen,
  onClose,
  user,
  mode,
}: UserFormModalProps) {
  const { addUser, updateUser } = useUsers();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as Role,
    // status: "ACTIVE" as Status, // Removed status from initial state
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && mode === "edit") {
      setFormData({
        name: user.name ?? "", // Handle potential null name
        email: user.email,
        password: "", // Keep password empty for edit
        role: user.role as Role,
        // status: user.status as Status, // Removed status
      });
    }
  }, [user, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "add") {
        await addUser(formData);
      } else if (user) {
        // Construct updateData carefully, excluding status and optional password
        const updatePayload: { name: string; email: string; role: Role; password?: string } = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        // Only include password if it's not empty
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        // Pass the cleaned payload (without status) to updateUser
        await updateUser(user.id, updatePayload);
      }
      onClose();
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <Card className="relative max-w-md w-full">
          <CardHeader>
            <CardTitle>
              {mode === "add" ? "Yeni Kullanıcı Ekle" : "Kullanıcıyı Düzenle"}
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent>
              {error && (
                <div className="mb-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
                  {error}
                </div>
              )}

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
                {mode === "add" ? (
                  <div className="space-y-2">
                    <Label htmlFor="password">Şifre</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="password">Yeni Şifre (Opsiyonel)</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Değiştirmek için yeni şifre girin"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: Role) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">Kullanıcı</SelectItem>
                      <SelectItem value="ADMIN">Yönetici</SelectItem>
                      <SelectItem value="PERSONEL">Personel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Removed Status Select Field */}

              </div>
            </CardContent>

            <CardFooter className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                İptal
              </Button>
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
      </div>
    </div>
  );
}
