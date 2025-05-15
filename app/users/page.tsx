"use client"

import { Suspense, useState, useEffect } from "react";
import { useUsers } from "@/app/context/UserContext"
import { Layout } from '@/components/layout/layout';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingLink } from "@/components/ui/loading-link";
import { toast } from "sonner"
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search } from "lucide-react"

function UsersContent() {
  const { users, deleteUser, fetchUsers, isLoading } = useUsers()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [filteredUsers, setFilteredUsers] = useState(users)

  // Corrected handleDelete to accept string ID and show specific error
  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id); // Pass string ID to context function
      // Success toast is already handled within deleteUser context function if needed
      // toast.success("User deleted successfully"); // Can be removed if context handles it
    } catch (error) {
      // Error toast is already handled within deleteUser context function
      // toast.error(error instanceof Error ? error.message : "Something went wrong"); // Can be removed
      console.error("Error caught in page handleDelete:", error); // Keep console log if desired
    }
  }

  // Filtreleme ve arama işlemi
  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  // Arama ve filtreleme işlemi
  const handleSearch = () => {
    fetchUsers(searchTerm, roleFilter);
  };

  return (
    <Layout>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Users</h1>
          <Button asChild>
            <LoadingLink href="/users/new">Add User</LoadingLink>
          </Button>
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    Kullanıcılar yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    {users.length === 0 ? "Henüz kullanıcı bulunmuyor." : "Arama kriterlerine uygun kullanıcı bulunamadı."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email?.replace(/^"|"$/g, '')}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role === "ADMIN" ? "Admin" : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" asChild>
                        <LoadingLink href={`/users/${user.id}`}>Edit</LoadingLink>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the user.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(user.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UsersContent />
    </Suspense>
  );
}
