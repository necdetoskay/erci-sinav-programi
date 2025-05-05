'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react'; // Import useState and useEffect
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
  // { name: 'Ayarlar', href: '/settings', icon: SettingsIcon }, // Ayarlar linki kaldırıldı
  { name: 'Öğrenci Sınav Girişi (Test)', href: '/exam/enter-email', icon: ClipboardCheckIcon }, // Test linki en sonda
];

import { getSettings } from '@/lib/settings'; // Import getSettings (for type)

export function Sidebar() {
  const pathname = usePathname();
  const [applicationTitle, setApplicationTitle] = useState('Loading...'); // State for application title

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings'); // Fetch settings client-side
        if (response.ok) {
          const data = await response.json();
          setApplicationTitle(data.applicationTitle || 'Default Application Title'); // Set application title from settings
        } else {
          console.error('Failed to fetch settings in sidebar.');
          setApplicationTitle('Error Loading Title'); // Indicate error
        }
      } catch (error) {
        console.error('Error fetching settings in sidebar:', error);
        setApplicationTitle('Error Loading Title'); // Indicate error
      }
    };
    fetchSettings();
  }, []); // Empty dependency array ensures this runs only once on mount


  return (
    <div className="flex h-full w-64 flex-col border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold">{applicationTitle}</span> {/* Use dynamic application title */}
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
