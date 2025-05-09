"use client"

import { Suspense } from "react";
export const dynamic = 'force-dynamic'; // Force dynamic rendering
import { Layout } from '@/components/layout/layout';
import { UserForm } from '@/components/users/user-form';

function NewUserContent() {
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

export default function NewUser() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <NewUserContent />
    </Suspense>
  );
}
