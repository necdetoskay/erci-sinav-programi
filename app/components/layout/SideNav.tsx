"use client"

import { LoadingLink } from "@/components/ui/loading-link";
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Settings,
  BookOpen,
  PenTool,
  ClipboardCheckIcon,
  BarChart,
  Shield,
  ChevronDown,
  ChevronRight,
  Brain,
  Wand2
} from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"

// Menü grupları
const sidebarNavGroups = [
  {
    title: "Ana Sayfa",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Sınav Yönetimi",
    items: [
      {
        title: "Sınavlar",
        href: "/admin/exams",
        icon: BookOpen,
      },
      // Sınav Oluşturma Sihirbazı geçici olarak kaldırıldı
      {
        title: "Soru Havuzları",
        href: "/question-pools",
        icon: PenTool,
      },
      {
        title: "Sınav Sonuçları",
        href: "/dashboard/exam-results",
        icon: BarChart,
      },
    ],
  },
  {
    title: "Kullanıcı Yönetimi",
    items: [
      {
        title: "Kullanıcılar",
        href: "/dashboard/users",
        icon: Users,
      },
      {
        title: "Rol Yönetimi",
        href: "/dashboard/roles",
        icon: Shield,
      },
    ],
  },
  {
    title: "Sistem",
    items: [
      {
        title: "Ayarlar",
        href: "/dashboard/settings",
        icon: Settings,
      },
      {
        title: "Sınav Giriş Sayfası",
        href: "/exam",
        icon: ClipboardCheckIcon,
      },
      {
        title: "Yapay Zeka Model Test",
        href: "/dashboard/ai-model-test",
        icon: Brain,
      },
    ],
  },
];

export function SideNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Başlangıçta tüm grupları açık olarak ayarla
    const initialState: Record<string, boolean> = {};
    sidebarNavGroups.forEach((group) => {
      // Aktif sayfanın bulunduğu grubu otomatik olarak aç
      const isActiveGroup = group.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      );
      initialState[group.title] = isActiveGroup;
    });
    return initialState;
  });

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  return (
    <nav className="space-y-1">
      {sidebarNavGroups.map((group) => (
        <div key={group.title} className="mb-4">
          <button
            onClick={() => toggleGroup(group.title)}
            className="flex items-center w-full text-sm font-medium text-muted-foreground hover:text-foreground mb-1 px-2"
          >
            {openGroups[group.title] ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            {group.title}
          </button>

          {openGroups[group.title] && (
            <div className="grid items-start gap-1 pl-4">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                // Rol yönetimi ve Yapay Zeka Model Test sayfalarını sadece superadmin kullanıcılar görebilir
                if ((item.href === "/dashboard/roles" || item.href === "/dashboard/ai-model-test") && user?.role !== "SUPERADMIN") {
                  return null;
                }

                return (
                  <LoadingLink key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start gap-2 h-9 ${isActive ? 'sidebar-link active' : 'sidebar-link'}`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </LoadingLink>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
