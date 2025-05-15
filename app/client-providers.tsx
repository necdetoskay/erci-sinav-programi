"use client";

import { Providers } from "@/providers/providers";
import { NavigationEvents } from "@/components/navigation-events";

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
