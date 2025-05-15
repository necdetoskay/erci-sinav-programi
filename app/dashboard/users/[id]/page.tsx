"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import UserForm from '@/components/users/UserForm';
import { User } from '@/app/types';
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import DeleteUserModal from '@/app/components/users/DeleteUserModal';

export default function UserEditPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { user: authUser } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${params.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
        toast.error('Kullanıcı bilgileri yüklenirken bir hata oluştu');
        router.push('/dashboard/users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id, router]);

  const handleCancel = () => {
    router.push('/dashboard/users');
  };

  const handleSuccess = () => {
    router.push('/dashboard/users');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Kullanıcı Bulunamadı</h2>
          <p className="text-gray-500 mb-4">İstediğiniz kullanıcı bulunamadı veya erişim izniniz yok.</p>
          <button
            onClick={() => router.push('/dashboard/users')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Kullanıcı Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kullanıcı Düzenle</h1>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          Kullanıcıyı Sil
        </Button>
      </div>

      <UserForm
        user={user}
        mode="edit"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={user}
      />
    </div>
  );
}
