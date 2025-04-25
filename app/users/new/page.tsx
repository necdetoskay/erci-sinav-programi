"use client"

import { Layout } from '@/components/layout/layout';
import { UserForm } from '@/components/users/user-form';

export default function NewUser() {
  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6">New User</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <UserForm />
        </div>
      </div>
    </Layout>
  )
} 