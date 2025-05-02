"use client"

import { useParams } from 'next/navigation';
import { Layout } from '@/components/layout/layout';
import { UserForm } from '@/components/users/user-form';
import { useUsers } from '@/app/context/UserContext';

export default function EditUser() {
  const params = useParams();
  const { users } = useUsers();
  // Corrected: Compare string ID from params directly with user.id (string)
  const userId = params.id as string; // Ensure params.id is treated as string
  const user = users.find((user) => user.id === userId); 

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-6">User not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6">Edit User</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <UserForm initialData={user} />
        </div>
      </div>
    </Layout>
  );
}
