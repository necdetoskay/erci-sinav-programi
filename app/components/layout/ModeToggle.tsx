"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Hidratlama sorunlarını önlemek için bileşenin monte edildiğini kontrol et
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Tema değiştirme işlevi
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative border-2 hover:bg-accent theme-toggle-icon"
    >
      <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${theme === 'dark' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
      <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
      <span className="sr-only">Temayı değiştir</span>
    </Button>
  )
}