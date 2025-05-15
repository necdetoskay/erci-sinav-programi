"use client";

import { useState, Suspense, useEffect } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { useUsers } from "@/app/context/UserContext";
import { User } from "@/app/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  ChevronDown,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  Search,
  RefreshCw
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DeleteUserModal from "@/app/components/users/DeleteUserModal";
import { toast } from "sonner";
import { useLoadingControl } from "@/hooks/use-loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function UsersTable() {
  const { users, fetchUsers, isLoading } = useUsers();
  const router = useRouter();
  const { showLoading, hideLoading } = useLoadingControl();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [filteredUsers, setFilteredUsers] = useState<User[]>(users);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    success: boolean;
    message: string;
    successCount?: number;
    failedCount?: number;
    failedUsers?: Array<{ email: string; error: string }>;
  } | null>(null);

  const handleAddUser = () => {
    router.push('/dashboard/users/new');
  };

  const handleEditUser = (user: User) => {
    router.push(`/dashboard/users/${user.id}`);
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleCheckboxChange = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  // Filtreleme ve arama işlemi
  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  // Arama ve filtreleme işlemi
  const handleSearch = () => {
    fetchUsers(searchTerm, roleFilter);
  };

  // Enter tuşuna basıldığında arama yap
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleResetPasswordClick = () => {
    if (selectedUsers.length === 0) {
      toast.error('Lütfen en az bir kullanıcı seçin');
      return;
    }
    setIsResetPasswordModalOpen(true);
  };

  const handleSendResetPasswordLinks = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Lütfen en az bir kullanıcı seçin');
      return;
    }

    try {
      setIsProcessing(true);
      showLoading();

      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'İşlem sırasında bir hata oluştu');
      }

      setResetPasswordResult(data);
    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      setResetPasswordResult({
        success: false,
        message: error instanceof Error ? error.message : 'İşlem sırasında bir hata oluştu',
      });
    } finally {
      setIsProcessing(false);
      hideLoading();
    }
  };

  const closeResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setResetPasswordResult(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Kullanıcılar</h2>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={selectedUsers.length === 0}>
              <Button variant="outline">
                Toplu İşlemler <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleResetPasswordClick}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Şifre Sıfırlama Bağlantısı Gönder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => router.push('/admin/users/bulk-import')}>
            Toplu Personel Kaydı
          </Button>
          <Button onClick={handleAddUser}>Yeni Kullanıcı</Button>
        </div>
      </div>

      {/* Filtreleme ve Arama Alanları */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim veya e-posta ile ara..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              // Rol değiştiğinde hemen ara
              setTimeout(() => fetchUsers(searchTerm, value), 0);
            }}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Rol Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tüm Roller</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="PERSONEL">Personel</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSearch}>
            Ara
          </Button>
          <Button variant="ghost" onClick={() => fetchUsers()} title="Yenile">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                  aria-label="Tümünü seç"
                />
              </TableHead>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2">Kullanıcılar yükleniyor...</p>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  {users.length === 0 ? "Henüz kullanıcı bulunmuyor." : "Arama kriterlerine uygun kullanıcı bulunamadı."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(user.id, checked as boolean)}
                      aria-label={`${user.name || user.email} seç`}
                    />
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email?.replace(/^"|"$/g, '')}</TableCell>
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
                      onClick={() => handleDeleteClick(user)}
                    >
                      Sil
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={selectedUser}
      />

      {/* Şifre Sıfırlama Modalı */}
      <Dialog open={isResetPasswordModalOpen} onOpenChange={closeResetPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Şifre Sıfırlama Bağlantısı Gönder</DialogTitle>
            <DialogDescription>
              Seçili kullanıcılara şifre sıfırlama bağlantısı gönderilecektir.
            </DialogDescription>
          </DialogHeader>

          {resetPasswordResult ? (
            <div className="space-y-4">
              <Alert variant={resetPasswordResult.success ? "default" : "destructive"}>
                {resetPasswordResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {resetPasswordResult.success ? "İşlem Başarılı" : "İşlem Sırasında Hatalar Oluştu"}
                </AlertTitle>
                <AlertDescription>{resetPasswordResult.message}</AlertDescription>
              </Alert>

              <DialogFooter>
                <Button onClick={closeResetPasswordModal}>Kapat</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  {selectedUsers.length} kullanıcıya şifre sıfırlama bağlantısı gönderilecektir. Bu işlem geri alınamaz.
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={closeResetPasswordModal} disabled={isProcessing}>
                  İptal
                </Button>
                <Button onClick={handleSendResetPasswordLinks} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isProcessing ? 'Gönderiliyor...' : 'Gönder'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
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