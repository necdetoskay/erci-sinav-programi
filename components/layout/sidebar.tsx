'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  Building2Icon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon,
  BookOpenIcon,
  ClipboardCheckIcon, // Yeni ikonu import et
  FileTextIcon, // Soru Havuzu için daha standart bir ikon
} from 'lucide-react';

// Navigasyon öğelerini ekran görüntüsüne göre düzenle ve test linkini sona ekle
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Sınavlar', href: '/admin/exams', icon: BookOpenIcon }, // Yönetici sınavları
  { name: 'Kullanıcılar', href: '/users', icon: UsersIcon }, // Kullanıcılar sayfası (varsayım)
  { name: 'Soru Havuzu', href: '/question-pools', icon: FileTextIcon }, // Soru Havuzu ikonu değiştirildi
  { name: 'Ayarlar', href: '/settings', icon: SettingsIcon },
  { name: 'Sınav Giriş Sayfası', href: '/exam', icon: ClipboardCheckIcon }, // Doğrudan sınav giriş sayfası
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold">Kent Konut</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Link
          href="/api/auth/signout"
          className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOutIcon className="h-5 w-5" />
          <span>Log out</span>
        </Link>
      </div>
    </div>
  );
}
