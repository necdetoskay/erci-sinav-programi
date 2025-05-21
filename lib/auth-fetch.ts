"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";

// API isteği için temel yapılandırma
interface AuthFetchOptions extends RequestInit {
  showErrorToast?: boolean;
  redirectOnAuthError?: boolean;
  saveFormState?: boolean;
  formStateKey?: string;
  formState?: any;
}

/**
 * Kimlik doğrulama hatalarını yöneten gelişmiş fetch fonksiyonu
 * 
 * @param url API endpoint URL'i
 * @param options Fetch seçenekleri ve ek parametreler
 * @returns API yanıtı
 */
export async function authFetch<T>(
  url: string,
  options: AuthFetchOptions = {}
): Promise<T> {
  const {
    showErrorToast = true,
    redirectOnAuthError = true,
    saveFormState = true,
    formStateKey = "lastFormState",
    formState = null,
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

    // Oturum hatası kontrolü (401 Unauthorized veya 403 Forbidden)
    if (response.status === 401 || response.status === 403) {
      console.error("Oturum hatası:", response.status, response.statusText);
      
      // Form verilerini localStorage'a kaydet
      if (saveFormState && formState) {
        try {
          localStorage.setItem(formStateKey, JSON.stringify({
            timestamp: new Date().toISOString(),
            formData: formState,
            lastUrl: window.location.pathname
          }));
          console.log("Form durumu kaydedildi:", formStateKey);
        } catch (error) {
          console.error("Form durumu kaydedilemedi:", error);
        }
      }
      
      if (showErrorToast) {
        toast.error(
          "Oturum süreniz doldu. Lütfen yeniden giriş yapın.",
          {
            duration: 5000,
            description: "Giriş sayfasına yönlendiriliyorsunuz..."
          }
        );
      }
      
      if (redirectOnAuthError) {
        // Kullanıcıyı giriş sayfasına yönlendir
        setTimeout(() => {
          const callbackUrl = encodeURIComponent(window.location.pathname);
          window.location.href = `/auth/login?callbackUrl=${callbackUrl}&sessionExpired=true`;
        }, 2000);
        
        // Promise'i reddet, böylece çağıran kod devam etmez
        throw new Error("JWT_EXPIRED");
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
    // JWT_EXPIRED hatası dışındaki hatalar için
    if (error instanceof Error && error.message !== "JWT_EXPIRED") {
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
 * Form durumunu localStorage'dan yükler
 * 
 * @param key Form durumu için localStorage anahtarı
 * @returns Kaydedilmiş form durumu veya null
 */
export function loadFormState<T>(key: string = "lastFormState"): { formData: T, timestamp: string, lastUrl: string } | null {
  try {
    const savedState = localStorage.getItem(key);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return parsedState;
    }
  } catch (error) {
    console.error("Form durumu yüklenemedi:", error);
  }
  return null;
}

/**
 * Form durumunu localStorage'dan temizler
 * 
 * @param key Form durumu için localStorage anahtarı
 */
export function clearFormState(key: string = "lastFormState"): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Form durumu temizlenemedi:", error);
  }
}
