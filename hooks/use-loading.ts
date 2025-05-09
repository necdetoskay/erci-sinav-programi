// hooks/use-loading.ts
"use client";

import { useLoading } from "@/providers/loading-provider";

/**
 * Yükleme durumunu kontrol etmek için hook
 * @returns Yükleme durumunu kontrol etmek için fonksiyonlar
 * @example
 * const { showLoading, hideLoading } = useLoadingControl();
 *
 * // Yükleme ekranını göster
 * showLoading();
 *
 * // Yükleme ekranını gizle
 * hideLoading();
 */
export const useLoadingControl = () => {
  const { setIsLoading } = useLoading();

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return { showLoading, hideLoading };
};
