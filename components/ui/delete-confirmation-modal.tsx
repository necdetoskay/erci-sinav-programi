"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button"; // Import Button if needed for custom actions

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // Function to call when deletion is confirmed
  title?: string; // Optional custom title
  description?: string; // Optional custom description
  confirmText?: string; // Optional custom confirm button text
  cancelText?: string; // Optional custom cancel button text
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Emin misiniz?", // Default title
  description = "Bu işlem geri alınamaz. Bu öğeyi kalıcı olarak silmek istediğinizden emin misiniz?", // Default description
  confirmText = "Sil", // Default confirm text
  cancelText = "İptal", // Default cancel text
}: DeleteConfirmationModalProps) {

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700"> {/* Destructive action style */}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
