"use client";

import { useState, useEffect } from "react";

/**
 * Uygulama URL'sini döndüren hook
 * 
 * Bu hook, client tarafında window.location.origin'i,
 * server tarafında ise NEXT_PUBLIC_APP_URL environment değişkenini kullanır.
 * 
 * @returns {string} Uygulama URL'si
 */
export function useAppUrl(): string {
  const [appUrl, setAppUrl] = useState<string>("");

  useEffect(() => {
    // Client tarafında çalışıyorsa
    if (typeof window !== "undefined") {
      // Önce NEXT_PUBLIC_APP_URL environment değişkenini kontrol et
      const envUrl = process.env.NEXT_PUBLIC_APP_URL;
      
      // Eğer environment değişkeni varsa ve localhost değilse, onu kullan
      if (envUrl && !envUrl.includes("localhost")) {
        setAppUrl(envUrl);
      } else {
        // Yoksa window.location.origin'i kullan
        setAppUrl(window.location.origin);
      }
    } else {
      // Server tarafında çalışıyorsa, sadece environment değişkenini kullan
      setAppUrl(process.env.NEXT_PUBLIC_APP_URL || "");
    }
  }, []);

  return appUrl;
}
