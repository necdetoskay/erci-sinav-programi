/**
 * API istekleri için yardımcı fonksiyonlar
 */

import { toast } from "sonner";

// API isteği için temel yapılandırma
interface FetchOptions extends RequestInit {
  showErrorToast?: boolean;
  redirectOnAuthError?: boolean;
}

/**
 * Gelişmiş fetch fonksiyonu - hata işleme ve oturum kontrolü ile
 */
export async function fetchWithAuth<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    showErrorToast = true,
    redirectOnAuthError = true,
    ...fetchOptions
  } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    });

    // Oturum hatası kontrolü (401 Unauthorized)
    if (response.status === 401) {
      console.error("Oturum hatası: Yetkilendirme başarısız");
      
      if (showErrorToast) {
        toast.error("Oturum süreniz doldu. Lütfen yeniden giriş yapın.");
      }
      
      if (redirectOnAuthError) {
        // Oturum yenileme sayfasına yönlendir
        window.location.href = "/auth/refresh";
        // Promise'i reddet, böylece çağıran kod devam etmez
        throw new Error("Unauthorized: Redirecting to login page");
      }
    }

    // Diğer API hataları için
    if (!response.ok) {
      let errorMessage = `API Hatası: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // JSON parse hatası - varsayılan hata mesajını kullan
      }
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }

    // Başarılı yanıt
    return await response.json() as T;
  } catch (error) {
    // Ağ hataları veya diğer istisnalar
    if (error instanceof Error && error.message !== "Unauthorized: Redirecting to login page") {
      const errorMessage = `İstek hatası: ${error.message}`;
      
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      
      console.error("API isteği başarısız:", error);
    }
    
    throw error;
  }
}

/**
 * Veritabanı bağlantısını kontrol etmek için sağlık kontrolü
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const response = await fetch("/api/health", {
      method: "GET",
      cache: "no-store",
    });
    
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    return data.database === "connected";
  } catch (error) {
    console.error("Veritabanı sağlık kontrolü başarısız:", error);
    return false;
  }
}
