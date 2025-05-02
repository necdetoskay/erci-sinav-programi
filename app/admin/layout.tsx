"use client";

import { Header } from "@/components/layout/header"; // Header'ı import et
import { AdminSideNav } from "../components/layout/AdminSideNav"
import { Toaster } from "@/components/ui/sonner"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden border-r bg-background md:block md:w-64">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-bold">Erci Sınav Programı</h1>
        </div>
        <div className="p-6">
          <AdminSideNav />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header bileşeni kaldırıldı */}
        <main className="flex-1 overflow-y-auto p-6"> {/* Padding ekleyelim */}
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  )
}
