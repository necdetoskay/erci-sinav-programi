"use client";

import { SideNav } from "../components/layout/SideNav"
import { Toaster } from "@/components/ui/sonner"
import { UserNav } from "../components/layout/UserNav"

export default function QuestionPoolsLayout({
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
          <SideNav />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div></div>
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  )
} 