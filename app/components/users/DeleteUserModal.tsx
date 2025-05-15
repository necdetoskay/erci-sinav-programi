"use client";

import { useState } from "react";
import { useUsers } from "@/app/context/UserContext";
import { User } from "@/app/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function DeleteUserModal({
  isOpen,
  onClose,
  user,
}: DeleteUserModalProps) {
  const { deleteUser } = useUsers();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);
    setError("");

    try {
      await deleteUser(user.id);
      onClose();
    } catch (err) {
      setError("Kullanıcı silinirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kullanıcıyı Sil"
      preventOutsideClick={true}
    >
      {error && (
        <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500 mb-6">
        <strong>{user.name}</strong> adlı kullanıcıyı silmek istediğinizden
        emin misiniz? Bu işlem geri alınamaz.
      </p>

      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isDeleting}
        >
          İptal
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Siliniyor...
            </>
          ) : (
            "Sil"
          )}
        </Button>
      </div>
    </Modal>
  );
}
