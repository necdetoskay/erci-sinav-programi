"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  preventOutsideClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  preventOutsideClick = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !preventOutsideClick) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose, preventOutsideClick]);

  // Modal açıldığında scroll'u engelleme
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Dışarı tıklama kontrolü
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (preventOutsideClick) return;
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-modal="true"
      role="dialog"
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div
          ref={modalRef}
          className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-xl"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100" id="modal-title">
              {title}
            </h2>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
