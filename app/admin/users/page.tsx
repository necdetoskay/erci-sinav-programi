"use client";

import { useState, useEffect } from "react";
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
import { LoadingLink } from "@/components/ui/loading-link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus, FileImport, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/ui/pagination";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: User[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("PERSONEL");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // Kullanıcıları getir
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/users?page=${currentPage}&limit=${limit}&role=${roleFilter}${
          searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
        }`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Kullanıcılar yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde ve filtreler değiştiğinde kullanıcıları getir
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, roleFilter]);

  // Arama işlemi
  const handleSearch = () => {
    setCurrentPage(1); // Aramada ilk sayfaya dön
    fetchUsers();
  };

  // Enter tuşuna basıldığında arama yap
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Tüm kullanıcıları seç/kaldır
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
    setIsAllSelected(!isAllSelected);
  };

  // Tek kullanıcı seç/kaldır
  const toggleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
      setIsAllSelected(false);
    } else {
      setSelectedUsers([...selectedUsers, userId]);
      if (selectedUsers.length + 1 === users.length) {
        setIsAllSelected(true);
      }
    }
  };

  // Seçili kullanıcılara şifre sıfırlama e-postası gönder
  const sendPasswordResetEmails = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Lütfen en az bir kullanıcı seçin");
      return;
    }

    try {
      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) {
        throw new Error("Failed to send password reset emails");
      }

      const data = await response.json();
      toast.success(`${data.successCount} kullanıcıya şifre sıfırlama e-postası gönderildi`);
      setSelectedUsers([]);
      setIsAllSelected(false);
    } catch (error) {
      console.error("Error sending password reset emails:", error);
      toast.error("Şifre sıfırlama e-postaları gönderilirken bir hata oluştu");
    }
  };

  // Rol badge'i için renk belirle
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "destructive";
      case "ADMIN":
        return "default";
      case "USER":
        return "secondary";
      case "PERSONEL":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Rol adını Türkçe'ye çevir
  const getRoleName = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "Süper Admin";
      case "ADMIN":
        return "Admin";
      case "USER":
        return "Kullanıcı";
      case "PERSONEL":
        return "Personel";
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-muted-foreground">
            Toplam {totalCount} kullanıcı bulundu
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline">
            <LoadingLink href="/admin/users/bulk-import">
              <FileImport className="mr-2 h-4 w-4" />
              Toplu İçe Aktar
            </LoadingLink>
          </Button>
          <Button asChild>
            <LoadingLink href="/users/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Kullanıcı Ekle
            </LoadingLink>
          </Button>
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
          <Button variant="outline" onClick={handleSearch}>
            Ara
          </Button>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rol Filtresi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERSONEL">Personel</SelectItem>
              <SelectItem value="USER">Kullanıcı</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="ALL">Tüm Roller</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={fetchUsers} title="Yenile">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toplu İşlemler */}
      {selectedUsers.length > 0 && (
        <div className="bg-muted p-4 rounded-lg mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-sm">
            {selectedUsers.length} kullanıcı seçildi
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedUsers([]);
                setIsAllSelected(false);
              }}
            >
              Seçimi Temizle
            </Button>
            <Button size="sm" onClick={sendPasswordResetEmails}>
              Şifre Sıfırlama E-postası Gönder
            </Button>
          </div>
        </div>
      )}

      {/* Kullanıcı Tablosu */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Tümünü Seç"
                />
              </TableHead>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Kullanıcılar yükleniyor...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Kullanıcı bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleSelectUser(user.id)}
                      aria-label={`${user.name || user.email} seç`}
                    />
                  </TableCell>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>{user.email?.replace(/^"|"$/g, '')}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleName(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <LoadingLink href={`/users/${user.id}`}>
                          Düzenle
                        </LoadingLink>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
