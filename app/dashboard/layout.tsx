"use client";

import { UserNav } from "../components/layout/UserNav"
import { ModeToggle } from "../components/layout/ModeToggle"
import { SideNav } from "../components/layout/SideNav"
import { Toaster } from "@/components/ui/sonner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden border-r bg-background md:block md:w-64">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-bold">Kent Konut</h1>
        </div>
        <div className="p-6">
          <SideNav />
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background">
          <div className="container flex h-16 items-center justify-between py-4">
            <h1 className="text-xl font-bold md:hidden">Kent Konut</h1>
            <div className="flex items-center space-x-4">
              <ModeToggle />
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <Toaster />
      </div>
    </div>
  )
} 