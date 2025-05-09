// components/ui/loading-link.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useLoadingControl } from '@/hooks/use-loading';

interface LoadingLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
}

export const LoadingLink: React.FC<LoadingLinkProps> = ({
  href,
  children,
  className,
  onClick,
  ...props
}) => {
  const { showLoading } = useLoadingControl();

  const handleClick = (e: React.MouseEvent) => {
    // Eğer onClick prop'u varsa çağır
    if (onClick) {
      onClick();
    }

    // Loading durumunu true yap
    showLoading();
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
};
