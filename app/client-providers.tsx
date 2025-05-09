"use client";

import { Providers } from "@/providers/providers";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";

// Next.js App Router için sayfa geçişlerini izleyen bileşen
function NavigationEvents() {
  const { setIsLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Sayfa değişikliği tamamlandığında
    const handleRouteChangeComplete = () => {
      setIsLoading(false);
    };

    // Sayfa değişikliği başladığında
    const handleRouteChangeStart = () => {
      setIsLoading(true);
    };

    // Özel event'leri oluştur
    const createCustomEvent = (name: string) => {
      return new CustomEvent(`nextjs:${name}`, {
        bubbles: true,
      });
    };

    // Sayfa değişikliği başladığında event tetikle
    document.dispatchEvent(createCustomEvent('navigation-start'));

    // Sayfa değişikliği tamamlandığında event tetikle
    return () => {
      document.dispatchEvent(createCustomEvent('navigation-complete'));
    };
  }, [pathname, searchParams, setIsLoading]);

  return null;
}

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <NavigationEvents />
      {children}
    </Providers>
  );
}
