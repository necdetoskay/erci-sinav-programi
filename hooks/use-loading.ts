// hooks/use-loading.ts
"use client";

import { useLoading } from "@/providers/loading-provider";

/**
 * Yükleme durumunu kontrol etmek için hook
 * @returns Yükleme durumunu kontrol etmek için fonksiyonlar
 * @example
 * const { showLoading, hideLoading, isLoading, setLoadingTimeout } = useLoadingControl();
 *
 * // Yükleme ekranını göster
 * showLoading();
 *
 * // Yükleme ekranını gizle
 * hideLoading();
 *
 * // Yükleme durumunu kontrol et
 * if (isLoading) {
 *   // ...
 * }
 *
 * // Yükleme timeout süresini ayarla (milisaniye cinsinden)
 * setLoadingTimeout(60000); // 60 saniye
 */
export const useLoadingControl = () => {
  const { showLoading, hideLoading, isLoading, setLoadingTimeout } = useLoading();

  /**
   * Belirli bir işlem için loading ekranını göster ve işlem tamamlandığında gizle
   * @param asyncFn Asenkron fonksiyon
   * @returns Asenkron fonksiyonun sonucu
   * @example
   * const result = await withLoading(async () => {
   *   const response = await fetch('/api/data');
   *   return response.json();
   * });
   */
  const withLoading = async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    try {
      showLoading();
      return await asyncFn();
    } finally {
      hideLoading();
    }
  };

  return {
    showLoading,
    hideLoading,
    isLoading,
    setLoadingTimeout,
    withLoading
  };
};
