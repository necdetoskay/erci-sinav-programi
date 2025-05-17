"use client";

import { useState, useEffect } from "react";
import getConfig from 'next/config';

/**
 * Uygulama URL'sini döndüren hook
 *
 * Bu hook, önce veritabanından PUBLIC_SERVER_URL ayarını almaya çalışır.
 * Eğer bu değer yoksa, runtime config'den appUrl değerini alır.
 * Eğer bu değer de yoksa, client tarafında window.location.origin'i kullanır.
 *
 * @returns {string} Uygulama URL'si
 */
export function useAppUrl(): string {
  const [appUrl, setAppUrl] = useState<string>("");

  useEffect(() => {
    const fetchServerUrl = async () => {
      console.log("[useAppUrl] Hook çalıştırıldı");

      try {
        // Önce veritabanından PUBLIC_SERVER_URL ayarını almaya çalış
        console.log("[useAppUrl] Veritabanından PUBLIC_SERVER_URL ayarı alınıyor...");
        const response = await fetch('/api/settings?scope=global');
        if (response.ok) {
          const settings = await response.json();
          console.log("[useAppUrl] Veritabanından alınan ayarlar:", settings);

          if (settings.PUBLIC_SERVER_URL) {
            console.log("[useAppUrl] Veritabanından PUBLIC_SERVER_URL bulundu:", settings.PUBLIC_SERVER_URL);
            setAppUrl(settings.PUBLIC_SERVER_URL);
            return;
          } else {
            console.log("[useAppUrl] Veritabanında PUBLIC_SERVER_URL bulunamadı");
          }
        } else {
          console.error("[useAppUrl] Veritabanından ayarlar alınamadı, HTTP status:", response.status);
        }
      } catch (error) {
        console.error('[useAppUrl] Dış erişim URL ayarı alınamadı:', error);
      }

      // Veritabanından alınamazsa, runtime config'i kullan
      console.log("[useAppUrl] Runtime config kontrol ediliyor...");
      const { publicRuntimeConfig } = getConfig() || { publicRuntimeConfig: {} };
      console.log("[useAppUrl] Runtime config:", publicRuntimeConfig);

      // Client tarafında çalışıyorsa
      if (typeof window !== "undefined") {
        console.log("[useAppUrl] Client tarafında çalışıyor");

        // Runtime config'den appUrl değerini kontrol et
        const configUrl = publicRuntimeConfig?.appUrl;
        console.log("[useAppUrl] Runtime config'den appUrl:", configUrl);

        // Eğer config değeri varsa ve localhost değilse, onu kullan
        if (configUrl && !configUrl.includes("localhost")) {
          console.log("[useAppUrl] Runtime config'den appUrl kullanılıyor:", configUrl);
          setAppUrl(configUrl);
        } else {
          // Yoksa window.location.origin'i kullan
          console.log("[useAppUrl] window.location.origin kullanılıyor:", window.location.origin);
          setAppUrl(window.location.origin);
        }
      } else {
        // Server tarafında çalışıyorsa, sadece runtime config değerini kullan
        console.log("[useAppUrl] Server tarafında çalışıyor, runtime config kullanılıyor:", publicRuntimeConfig?.appUrl || "");
        setAppUrl(publicRuntimeConfig?.appUrl || "");
      }
    };

    fetchServerUrl();
  }, []);

  console.log("[useAppUrl] Döndürülen URL:", appUrl);
  return appUrl;
}
