"use client";

import { useState, Suspense } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useUsers, User } from "@/app/context/UserContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import UserFormModal from "@/app/components/modals/UserFormModal";
import { toast } from "sonner";

function UsersTable() {
  const { users, deleteUser } = useUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [mode, setMode] = useState<"add" | "edit">("add");

  const handleAddUser = () => {
    setMode("add");
    setSelectedUser(undefined);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setMode("edit");
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => { // Changed type to string
    try {
      await deleteUser(userId);
      toast.success("Kullanıcı başarıyla silindi");
    } catch (error) {
      toast.error("Kullanıcı silinirken bir hata oluştu");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Kullanıcılar</h2>
        <Button onClick={handleAddUser}>Yeni Kullanıcı</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.role === "ADMIN"
                        ? "default"
                        : user.role === "PERSONEL"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {user.role === "ADMIN"
                      ? "Yönetici"
                      : user.role === "PERSONEL"
                        ? "Personel"
                        : "Kullanıcı"
                    }
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    className="mr-2"
                    onClick={() => handleEditUser(user)}
                  >
                    Düzenle
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Sil
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        mode={mode}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UsersTable />
    </Suspense>
  );
}
