"use client";

import { Modal } from "@/components/ui/modal";
import UserForm from "@/components/users/UserForm";
import { User } from "@/app/types";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  mode: "add" | "edit";
}

export default function UserFormModal({
  isOpen,
  onClose,
  user,
  mode,
}: UserFormModalProps) {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "add" ? "Yeni Kullanıcı Ekle" : "Kullanıcıyı Düzenle"}
      preventOutsideClick={true}
    >
      <UserForm
        user={user}
        mode={mode}
        onSuccess={handleSuccess}
        onCancel={onClose}
        isModal={true}
      />
    </Modal>
  );
}
