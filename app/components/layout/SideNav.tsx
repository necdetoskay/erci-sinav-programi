"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Settings, BookOpen, PenTool } from "lucide-react"

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
    title: "Soru Havuzu",
    href: "/question-pools",
    icon: PenTool,
  },
  {
    title: "Kullanıcılar",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Ayarlar",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function SideNav() {
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