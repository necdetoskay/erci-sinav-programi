"use client";

import { useRouter } from 'next/navigation';
import UserForm from '@/components/users/UserForm';

export default function NewUserPage() {
  const router = useRouter();

  const handleCancel = () => {
    router.push('/dashboard/users');
  };

  const handleSuccess = () => {
    router.push('/dashboard/users');
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Yeni Kullanıcı Ekle</h1>
      <UserForm
        mode="add"
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
