"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, BookOpen, Users, PenTool, Settings, ClipboardCheckIcon } from "lucide-react" // ClipboardCheckIcon eklendi

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Sınavlar",
    href: "/admin/exams",
    icon: BookOpen,
  },
  {
    title: "Kullanıcılar",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Soru Havuzu",
    href: "/question-pools",
    icon: PenTool,
  },
  {
    title: "Ayarlar",
    href: "/dashboard/settings", // Not: Bu yol /settings olabilir, kontrol etmek gerekebilir.
    icon: Settings,
  },
  {
    title: "Öğrenci Sınav Girişi (Test)",
    href: "/exam/enter-email",
    icon: ClipboardCheckIcon, // Test linki eklendi
  },
]

export function AdminSideNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {sidebarNavItems.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname === item.href || pathname.startsWith(item.href + "/") ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}
