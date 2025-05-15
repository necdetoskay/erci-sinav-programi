'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoadingControl } from '@/hooks/use-loading';

/**
 * Next.js App Router için sayfa geçişlerini izleyen bileşen.
 * Bu bileşen, sayfa geçişlerinde loading ekranını otomatik olarak gösterir ve gizler.
 */
export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showLoading, hideLoading } = useLoadingControl();

  // Sayfa değişikliklerini izle
  useEffect(() => {
    // Sayfa değiştiğinde yükleme durumunu false yap
    hideLoading();
  }, [pathname, searchParams, hideLoading]);

  return null;
}
