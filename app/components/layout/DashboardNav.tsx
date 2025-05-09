"use client"

import { LoadingLink } from "@/components/ui/loading-link";
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const mainNav = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Kullanıcılar",
    href: "/dashboard/users",
  },
  {
    title: "Ayarlar",
    href: "/dashboard/settings",
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {mainNav.map((item) => (
          <NavigationMenuItem key={item.href}>
            <LoadingLink href={item.href}>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === item.href &&
                    "bg-accent text-accent-foreground"
                )}
              >
                {item.title}
              </NavigationMenuLink>
            </LoadingLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
