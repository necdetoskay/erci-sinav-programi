"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
  isSystemRole?: boolean;
}

function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  // Mevcut izinler listesi
  const availablePermissions = [
    { id: "dashboard_access", name: "Dashboard Erişimi" },
    { id: "exams_view", name: "Sınavları Görüntüleme" },
    { id: "exams_create", name: "Sınav Oluşturma" },
    { id: "exams_edit", name: "Sınav Düzenleme" },
    { id: "exams_delete", name: "Sınav Silme" },
    { id: "users_view", name: "Kullanıcıları Görüntüleme" },
    { id: "users_create", name: "Kullanıcı Oluşturma" },
    { id: "users_edit", name: "Kullanıcı Düzenleme" },
    { id: "users_delete", name: "Kullanıcı Silme" },
    { id: "roles_manage", name: "Rolleri Yönetme" },
  ];

  // Roller veritabanından yüklenecek

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/roles");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Response:", errorData);
          throw new Error(errorData.error || "Roller yüklenirken bir hata oluştu");
        }

        const data = await response.json();
        console.log("Roles data:", data);
        setRoles(data);
      } catch (error) {
        console.error("Roller yüklenirken hata:", error);
        toast.error(error instanceof Error ? error.message : "Roller yüklenirken bir hata oluştu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || "");
      setRolePermissions(role.permissions);
    } else {
      setSelectedRole(null);
      setRoleName("");
      setRoleDescription("");
      setRolePermissions([]);
    }
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handlePermissionChange = (permission: string) => {
    setRolePermissions((prev) => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast.error("Rol adı zorunludur");
      return;
    }

    try {
      // Yeni rol oluşturma veya mevcut rolü güncelleme
      if (selectedRole) {
        // Güncelleme işlemi
        const response = await fetch(`/api/roles/${selectedRole.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: roleName,
            description: roleDescription,
            permissions: rolePermissions,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Rol güncellenirken bir hata oluştu");
        }

        const updatedRole = await response.json();

        // Rolleri güncelle
        setRoles(roles.map(role =>
          role.id === selectedRole.id ? updatedRole : role
        ));

        toast.success("Rol başarıyla güncellendi");
      } else {
        // Yeni rol oluşturma
        const response = await fetch("/api/roles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: roleName,
            description: roleDescription,
            permissions: rolePermissions,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Rol oluşturulurken bir hata oluştu");
        }

        const newRole = await response.json();

        // Rolleri güncelle
        setRoles([...roles, newRole]);
        toast.success("Rol başarıyla oluşturuldu");
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Rol kaydedilirken hata:", error);
      toast.error(error instanceof Error ? error.message : "Rol kaydedilirken bir hata oluştu");
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      // Rol silme işlemi
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Rol silinirken bir hata oluştu");
      }

      // Rolleri güncelle
      setRoles(roles.filter(role => role.id !== selectedRole.id));

      toast.success("Rol başarıyla silindi");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Rol silinirken hata:", error);
      toast.error(error instanceof Error ? error.message : "Rol silinirken bir hata oluştu");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Rol Yönetimi</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Rol Ekle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roller</CardTitle>
          <CardDescription>
            Sistem rollerini ve izinlerini yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Henüz rol bulunmuyor
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol Adı</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>İzinler</TableHead>
                  <TableHead>Kullanıcı Sayısı</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.length > 0 ? (
                          role.permissions.slice(0, 3).map((permission) => (
                            <Badge key={permission} variant="outline" className="mr-1">
                              {availablePermissions.find(p => p.id === permission)?.name || permission}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">İzin yok</span>
                        )}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline">+{role.permissions.length - 3} daha</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        {role.userCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(role)}
                        disabled={role.isSystemRole}
                        title={role.isSystemRole ? "Sistem rolleri düzenlenemez" : "Rolü düzenle"}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDeleteDialog(role)}
                        disabled={role.userCount > 0 || role.isSystemRole}
                        title={
                          role.isSystemRole
                            ? "Sistem rolleri silinemez"
                            : role.userCount > 0
                              ? "Kullanıcılara atanmış roller silinemez"
                              : "Rolü sil"
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rol Ekleme/Düzenleme Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:max-w-[500px]"
          onPointerDownOutside={(e) => {
            // Dışarı tıklamayı engelle
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? "Rolü Düzenle" : "Yeni Rol Ekle"}
            </DialogTitle>
            <DialogDescription>
              {selectedRole
                ? "Rol bilgilerini ve izinlerini güncelleyin"
                : "Yeni bir rol ve izinlerini tanımlayın"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Rol Adı
              </Label>
              <Input
                id="name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Açıklama
              </Label>
              <Input
                id="description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <Label className="text-right pt-2">
                İzinler
              </Label>
              <div className="col-span-3 space-y-2">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={permission.id}
                      checked={rolePermissions.includes(permission.id)}
                      onChange={() => handlePermissionChange(permission.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor={permission.id} className="font-normal">
                      {permission.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveRole}>
              {selectedRole ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rol Silme Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent
          className="sm:max-w-[425px]"
          onPointerDownOutside={(e) => {
            // Dışarı tıklamayı engelle
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Rolü Sil</DialogTitle>
            <DialogDescription>
              Bu rolü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>{selectedRole?.name}</strong> rolünü silmek üzeresiniz.
              {selectedRole?.userCount && selectedRole.userCount > 0 ? (
                <span className="text-destructive"> Bu rol kullanıcılara atanmış durumda, önce kullanıcıların rollerini değiştirmelisiniz.</span>
              ) : null}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={!!selectedRole?.userCount && selectedRole.userCount > 0}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={<div>Loading roles...</div>}>
      <RolesManagement />
    </Suspense>
  );
}
